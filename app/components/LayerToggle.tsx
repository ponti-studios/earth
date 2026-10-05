import { Checkbox } from "@ponti-studios/ui/forms";
import { SegmentedControl } from "@ponti-studios/ui/primitives";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { LAYERS, parseLayers, serializeLayers, type LayerId } from "~/lib/layers";

function currentIsDark() {
  if (document.documentElement.classList.contains("dark")) return true;
  if (document.documentElement.classList.contains("light")) return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.classList.toggle("light", !dark);
  try {
    localStorage.setItem("earth-theme", dark ? "dark" : "light");
  } catch {
    // storage unavailable — theme still applies for the session
  }
}

function ThemeSegment() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("earth-theme");
      if (stored === "dark" || stored === "light") {
        const isDark = stored === "dark";
        applyTheme(isDark);
        setDark(isDark);
      } else {
        setDark(currentIsDark());
      }
    } catch {
      setDark(currentIsDark());
    }
  }, []);

  return (
    <SegmentedControl
      label="Color theme"
      value={[dark ? "dark" : "light"]}
      onValueChange={(next) => {
        const mode = next[next.length - 1];
        if (mode !== "dark" && mode !== "light") return;
        setDark(mode === "dark");
        applyTheme(mode === "dark");
      }}
      options={[
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ]}
    />
  );
}

function LayersSheet() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const enabled = parseLayers(params.get("layers"));

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const toggle = (id: LayerId) => {
    setParams(
      (prev) => {
        const search = new URLSearchParams(prev);
        const current = parseLayers(search.get("layers"));
        const next = current.includes(id) ? current.filter((l) => l !== id) : [...current, id];
        // Keep at least one layer on.
        if (next.length === 0) return prev;
        // Canonical registry order keeps shared URLs stable.
        const order = new Map(LAYERS.map((l, i) => [l.id as LayerId, i]));
        next.sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0));
        search.set("layers", serializeLayers(next));
        return search;
      },
      { preventScrollReset: true },
    );
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Map layers"
        className="bg-background border-border text-foreground hover:bg-muted inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3.5 text-xs font-semibold tracking-wide uppercase shadow-sm transition-colors"
      >
        <span aria-hidden>🗺️</span> Layers · {enabled.length}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close layers"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[190] cursor-default bg-transparent"
          />
          <div
            role="dialog"
            aria-label="Map layers"
            className="bg-background border-border absolute top-full right-0 z-[191] mt-2 w-56 rounded-xl border p-1.5 shadow-lg"
          >
            {LAYERS.map((layer) => {
              const checked = enabled.includes(layer.id);
              const lastOne = checked && enabled.length === 1;
              return (
                <label
                  key={layer.id}
                  title={lastOne ? "Keep at least one layer on" : undefined}
                  className={`hover:bg-muted flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors ${lastOne ? "opacity-60" : ""}`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => toggle(layer.id)}
                    aria-label={layer.label}
                  />
                  <span aria-hidden className="text-base leading-none">
                    {layer.icon}
                  </span>
                  <span className="text-foreground text-sm font-medium">{layer.label}</span>
                </label>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

export default function LayerToggle() {
  return (
    <div className="fixed top-5 right-4 z-[200] flex items-center gap-2" aria-label="Map controls">
      <LayersSheet />
      <ThemeSegment />
    </div>
  );
}
