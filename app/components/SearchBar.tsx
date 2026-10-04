import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@ponti-studios/ui/overlays";
import { useEffect, useRef, useState } from "react";
import { useFetcher, useNavigate, useSearchParams } from "react-router";
import { parseLayers, serializeLayers } from "~/lib/layers";
import type { GeocodePreview, GeocodeResult } from "~/lib/server/geocode";

type SavedPlace = {
  id: number;
  name: string;
  city: string | null;
  country: string | null;
  formattedAddress: string | null;
};

type SaveResponse = { ok: true; id: number } | { error: string };

export default function SearchBar() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [searching, setSearching] = useState(false);
  const [saved, setSaved] = useState<SavedPlace[]>([]);
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const saveFetcher = useFetcher<SaveResponse>();
  const requestId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const layersParam = params.get("layers") ?? serializeLayers(parseLayers(null));
  const showList = query.trim().length >= 2;

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setSaved([]);
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      try {
        const [geoRes, savedRes] = await Promise.all([
          fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=5`),
          fetch(`/api/places?search=${encodeURIComponent(q)}&filter=all`),
        ]);
        if (requestId.current !== id) return;
        const preview: GeocodePreview | null = geoRes.ok ? await geoRes.json() : null;
        const savedJson: { places?: SavedPlace[] } | null = savedRes.ok
          ? await savedRes.json()
          : null;
        setResults(preview?.results ?? []);
        setSaved((savedJson?.places ?? []).slice(0, 5));
      } catch {
        if (requestId.current === id) {
          setResults([]);
          setSaved([]);
        }
      } finally {
        if (requestId.current === id) setSearching(false);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  const reset = () => {
    setQuery("");
    setOpen(false);
    // Remount to clear the combobox input, then restore focus.
    setResetKey((k) => k + 1);
  };

  useEffect(() => {
    if (resetKey > 0) inputRef.current?.focus();
  }, [resetKey]);

  useEffect(() => {
    const data = saveFetcher.data;
    if (data && "ok" in data && data.ok) {
      window.dispatchEvent(new CustomEvent("places:changed"));
      const id = data.id;
      reset();
      navigate(`/?layers=${layersParam}&sel=place:${id}`);
    }
  }, [saveFetcher.data, navigate, layersParam]);

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const runSelection = (id: string | null) => {
    if (!id) return;
    if (id.startsWith("saved:")) {
      const placeId = Number(id.slice("saved:".length));
      if (!Number.isInteger(placeId)) return;
      reset();
      navigate(`/?layers=${layersParam}&sel=place:${placeId}`);
    } else if (id.startsWith("osm:")) {
      const r = results[Number(id.slice("osm:".length))];
      if (!r) return;
      saveFetcher.submit(
        {
          name: r.displayTitle,
          latitude: String(r.latitude),
          longitude: String(r.longitude),
          formattedAddress: r.formattedAddress ?? "",
          city: r.city ?? "",
          state: r.state ?? "",
          postalCode: r.postalCode ?? "",
          country: r.country ?? "",
          countryCode: r.countryCode ?? "",
        },
        { method: "post", action: "/api/places" },
      );
    }
  };

  const saveError =
    saveFetcher.data && "error" in saveFetcher.data ? saveFetcher.data.error : null;

  return (
    <div
      ref={boxRef}
      className="search-shell fixed top-5 left-1/2 z-[200] w-[min(480px,calc(100vw-2rem))] -translate-x-1/2 max-sm:left-4 max-sm:w-[calc(100vw-7.5rem)] max-sm:translate-x-0"
    >
      <Command
        key={resetKey}
        filter={null}
        autoHighlight
        open={open}
        onOpenChange={setOpen}
        onInputValueChange={(value) => {
          setQuery(value);
          if (value.trim().length >= 2) setOpen(true);
        }}
        onValueChange={runSelection}
        aria-label="Search places"
      >
        <CommandInput ref={inputRef} placeholder="Search places…" aria-label="Search places" />
        {showList && (
          <CommandList aria-label="Place results">
            {searching && saved.length === 0 && results.length === 0 ? (
              <CommandItem disabled value="loading">
                Searching…
              </CommandItem>
            ) : (
              <>
                {saved.length > 0 && (
                  <CommandGroup heading="Saved">
                    {saved.map((p) => (
                      <CommandItem key={p.id} value={`saved:${p.id}`}>
                        <span className="min-w-0 flex-1">
                          <span className="text-foreground block truncate text-sm font-medium">
                            {p.name}
                          </span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {[p.city, p.country].filter(Boolean).join(", ") ||
                              p.formattedAddress ||
                              ""}
                          </span>
                        </span>
                        <CommandShortcut className="shrink-0">Open</CommandShortcut>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                )}
                <CommandGroup heading="Results">
                  {results.map((r, i) => {
                    const [name, ...rest] = r.displayTitle.split(",");
                    return (
                      <CommandItem key={`${r.latitude},${r.longitude}`} value={`osm:${i}`}>
                        <span className="min-w-0 flex-1">
                          <span className="text-foreground block truncate text-sm font-medium">
                            {name.trim()}
                          </span>
                          <span className="text-muted-foreground block truncate text-xs">
                            {rest.join(",").trim()}
                          </span>
                        </span>
                        <CommandShortcut className="shrink-0">Save</CommandShortcut>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {!searching && saved.length === 0 && results.length === 0 && (
                  <CommandEmpty>No places found.</CommandEmpty>
                )}
              </>
            )}
          </CommandList>
        )}
      </Command>

      {saveError && (
        <p className="bg-card border-border mt-1 rounded-md border px-3 py-2 text-xs text-red-500">
          {saveError}
        </p>
      )}
    </div>
  );
}
