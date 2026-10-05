"use client";

import * as React from "react";

import { useMediaQuery } from "../../hooks/use-media-query";
import { cn } from "../../lib/utils";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
  depth: number;
  twinklePhase: number;
  twinkleSpeed: number;
}

export interface ParticleBackgroundPalette {
  particle: string;
  link: string;
}

export interface ParticleBackgroundProps extends React.ComponentProps<"div"> {
  enabled?: boolean;
  interactive?: boolean;
  particleCount?: number;
  particleDensity?: number;
  maxLinkDistance?: number;
  attractRadius?: number;
  attractStrength?: number;
  velocity?: number;
  showGradient?: boolean;
  palette?: ParticleBackgroundPalette;
}

const DEFAULT_PARTICLE_COUNT = 320;
const DEFAULT_PARTICLE_DENSITY = 2800;
const DEFAULT_LINK_DISTANCE = 90;
const DEFAULT_ATTRACT_STRENGTH = 0.003;
const DEFAULT_ATTRACT_RADIUS = 150;
const DEFAULT_VELOCITY = 0.06;
const PARALLAX_STRENGTH = 0.015;
const TWINKLE_MIN_SPEED = 0.0002;
const TWINKLE_MAX_SPEED = 0.0008;
const PARTICLE_BASE_OPACITY = 0.2;

const DEFAULT_PALETTE = {
  particle: "15,23,42",
  link: "15,23,42",
};

function readCssVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
}

function toRgbTriplet(color: string): string {
  if (color.startsWith("#")) {
    let hex = color.slice(1);
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = Number.parseInt(hex, 16);
    return `${(num >> 16) & 255},${(num >> 8) & 255},${num & 255}`;
  }

  const match = color.match(/rgba?\(([^)]+)\)/);
  if (match) {
    return match[1]
      .split(",")
      .slice(0, 3)
      .map((part) => part.trim())
      .join(",");
  }

  return DEFAULT_PALETTE.particle;
}

function useThemePalette(): ParticleBackgroundPalette {
  const [palette, setPalette] = React.useState<ParticleBackgroundPalette>(DEFAULT_PALETTE);

  React.useEffect(() => {
    const resolve = () => {
      const accent = toRgbTriplet(readCssVar("--color-primary", "#0969da"));
      const foreground = toRgbTriplet(readCssVar("--color-foreground", "#25292e"));
      setPalette({ particle: accent, link: foreground });
    };

    resolve();

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    media.addEventListener("change", resolve);

    return () => {
      media.removeEventListener("change", resolve);
    };
  }, []);

  return palette;
}

function useResolvedTheme() {
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const resolve = () => setResolvedTheme(media.matches ? "dark" : "light");

    resolve();
    media.addEventListener("change", resolve);

    return () => {
      media.removeEventListener("change", resolve);
    };
  }, []);

  return resolvedTheme;
}

/** Animated canvas background of drifting, linked particles. Skips rendering under `prefers-reduced-motion`. */
export function ParticleBackground({
  className,
  enabled = true,
  interactive = true,
  particleCount,
  particleDensity = DEFAULT_PARTICLE_DENSITY,
  maxLinkDistance = DEFAULT_LINK_DISTANCE,
  attractRadius = DEFAULT_ATTRACT_RADIUS,
  attractStrength = DEFAULT_ATTRACT_STRENGTH,
  velocity = DEFAULT_VELOCITY,
  showGradient: _showGradient = true,
  palette,
  ...props
}: ParticleBackgroundProps) {
  const prefersReduced = useMediaQuery("(prefers-reduced-motion: reduce)");
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const mouse = React.useRef({ x: -9999, y: -9999 });
  const particles = React.useRef<Particle[]>([]);
  const raf = React.useRef<number>(0);
  const scrollOffset = React.useRef(typeof window === "undefined" ? 0 : window.scrollY);
  const resolvedTheme = useResolvedTheme();
  const themePalette = useThemePalette();
  const resolvedPalette = palette ?? themePalette;

  React.useEffect(() => {
    if (prefersReduced || !enabled) return;

    const canvasEl = canvasRef.current;
    if (!canvasEl) return;

    const ctx = canvasEl.getContext("2d");
    if (!ctx) return;

    const canvas = canvasEl;
    const context = ctx;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = Math.max(1, Math.round(rect.width * dpr));
      canvas.height = Math.max(1, Math.round(rect.height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount =
        particleCount ??
        Math.max(
          80,
          Math.min(
            DEFAULT_PARTICLE_COUNT,
            Math.round((rect.width * rect.height) / particleDensity),
          ),
        );

      particles.current = Array.from({ length: targetCount }, () => {
        const depth = Math.random();

        return {
          x: Math.random() * rect.width,
          y: Math.random() * rect.height,
          vx: (Math.random() - 0.5) * velocity * (0.4 + depth * 0.8),
          vy: (Math.random() - 0.5) * velocity * (0.4 + depth * 0.8),
          opacity: PARTICLE_BASE_OPACITY * (0.5 + depth * 0.5),
          depth,
          twinklePhase: Math.random() * Math.PI * 2,
          twinkleSpeed: TWINKLE_MIN_SPEED + Math.random() * (TWINKLE_MAX_SPEED - TWINKLE_MIN_SPEED),
        };
      });
    }

    let isRunning = false;
    let inView = true;
    let tabVisible = !document.hidden;
    const renderPositions: { x: number; y: number }[] = [];

    function draw(time: number) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      context.clearRect(0, 0, width, height);
      context.lineCap = "round";

      const ps = particles.current;
      const parallaxY = scrollOffset.current * PARALLAX_STRENGTH;

      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];

        const mdx = mouse.current.x - p.x;
        const mdy = mouse.current.y - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);

        if (interactive && mdist < attractRadius) {
          const force = (1 - mdist / attractRadius) * attractStrength;
          p.vx += mdx * force;
          p.vy += mdy * force;
        }

        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        const renderY = (((p.y + parallaxY * p.depth) % height) + height) % height;
        renderPositions[i] = { x: p.x, y: renderY };

        const twinkle = 0.6 + 0.4 * Math.sin(time * p.twinkleSpeed + p.twinklePhase);
        const radius = 0.6 + p.depth * 1.4;

        context.beginPath();
        context.arc(p.x, renderY, radius, 0, Math.PI * 2);
        context.fillStyle = `rgba(${resolvedPalette.particle},${p.opacity * twinkle})`;
        context.fill();

        for (let j = i + 1; j < ps.length; j++) {
          const q = ps[j];
          const qRender = renderPositions[j] ?? { x: q.x, y: q.y };
          const dx = p.x - q.x;
          const dy = renderY - qRender.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < maxLinkDistance) {
            const depthFactor = (p.depth + q.depth) / 2;

            // Links are more transparent in dark mode to reduce contrast and visual noise, and slightly more opaque in light mode to add some subtlety.
            const alpha =
              (1 - dist / maxLinkDistance) *
              (resolvedTheme === "dark" ? 0.015 : 0.01) *
              depthFactor;
            context.beginPath();
            context.moveTo(p.x, renderY);
            context.lineTo(qRender.x, qRender.y);
            context.strokeStyle = `rgba(${resolvedPalette.link},${alpha})`;
            context.lineWidth = 0.5;
            context.stroke();
          }
        }
      }

      if (isRunning) {
        raf.current = requestAnimationFrame(draw);
      }
    }

    function syncRunning() {
      const shouldRun = inView && tabVisible;

      if (shouldRun && !isRunning) {
        isRunning = true;
        raf.current = requestAnimationFrame(draw);
      } else if (!shouldRun && isRunning) {
        isRunning = false;
        cancelAnimationFrame(raf.current);
      }
    }

    // Resizing the canvas element clears its pixels, so repaint a frame
    // whenever the loop isn't already running to redraw for it.
    function handleResize() {
      resize();
      if (!isRunning) {
        draw(performance.now());
      }
    }

    const ro = new ResizeObserver(handleResize);
    ro.observe(canvas);
    resize();
    // Paint one frame immediately so the canvas is never left blank while
    // waiting on the intersection/visibility observers to report in.
    draw(performance.now());
    syncRunning();

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };

    const onMouseLeave = () => {
      mouse.current = { x: -9999, y: -9999 };
    };

    if (interactive) {
      canvas.addEventListener("mousemove", onMouseMove);
      canvas.addEventListener("mouseleave", onMouseLeave);
      document.addEventListener("mousemove", onMouseMove);
    }

    const onScroll = () => {
      scrollOffset.current = window.scrollY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      ([entry]) => {
        inView = entry?.isIntersecting ?? true;
        syncRunning();
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    const onVisibilityChange = () => {
      tabVisible = !document.hidden;
      syncRunning();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      isRunning = false;
      cancelAnimationFrame(raf.current);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      window.removeEventListener("scroll", onScroll);
    };
  }, [
    attractRadius,
    attractStrength,
    enabled,
    interactive,
    maxLinkDistance,
    resolvedPalette,
    particleCount,
    particleDensity,
    prefersReduced,
    resolvedTheme,
    velocity,
  ]);

  if (!enabled || prefersReduced) return null;

  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
      {...props}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
}
