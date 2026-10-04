import { SegmentedControl } from "@ponti-studios/ui/primitives";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { LAYERS, parseLayers, serializeLayers, type LayerId } from "~/lib/layers";

function isLayerId(id: string): id is LayerId {
  return LAYERS.some((l) => l.id === id);
}

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

export default function LayerToggle() {
  const [params, setParams] = useSearchParams();
  const enabled = parseLayers(params.get("layers"));

  const setLayers = (next: string[]) => {
    const valid = next.filter(isLayerId);
    // Keep at least one layer on.
    if (valid.length === 0) return;
    setParams(
      (prev) => {
        const search = new URLSearchParams(prev);
        search.set("layers", serializeLayers(valid));
        return search;
      },
      { preventScrollReset: true },
    );
  };

  return (
    <div className="fixed top-5 right-4 z-[200] flex items-center gap-2" aria-label="Map controls">
      <SegmentedControl
        label="Map layers"
        multiple
        value={[...enabled]}
        onValueChange={setLayers}
        options={LAYERS.map((layer) => ({ value: layer.id, label: layer.label }))}
      />
      <ThemeSegment />
    </div>
  );
}
