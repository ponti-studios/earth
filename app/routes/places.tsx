import { Form, Link, useNavigation, useSearchParams } from "react-router";
import { listPlaces, PlaceFilterSchema } from "~/lib/server/places";
import type { Route } from "./+types/places";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "needs_review", label: "Needs review" },
  { value: "ok", label: "Resolved" },
  { value: "no_match", label: "No match" },
  { value: "not_a_place", label: "Not a place" },
  { value: "unknown", label: "Unknown" },
] as const;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const filter = PlaceFilterSchema.catch("all").parse(url.searchParams.get("filter") ?? "all");
  const search = url.searchParams.get("search") ?? "";
  try {
    const data = await listPlaces({ filter, search });
    return { ...data, filter, search };
  } catch (error) {
    console.error("Failed to load places:", error);
    return { places: [], total: 0, needReview: 0, filter, search };
  }
}

function statusColor(status: string | null) {
  switch (status) {
    case "needs_review":
      return "bg-amber-500";
    case "ok":
      return "bg-green-500";
    case "no_match":
      return "bg-red-400";
    case "not_a_place":
      return "bg-muted-foreground";
    default:
      return "bg-muted-foreground";
  }
}

export default function Places({ loaderData }: Route.ComponentProps) {
  const { places, total, needReview, filter, search } = loaderData;
  const [params] = useSearchParams();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";
  const activeFilter = params.get("filter") ?? filter;
  const activeSearch = params.get("search") ?? search;
  const layersParam = params.get("layers") ?? "cameras,places";

  return (
    <div className="space-y-4">
      <div>
        <p className="ui-eyebrow mb-1">Places Review</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {places.length} shown · {total} total · {needReview} need review
        </p>
      </div>

      <Form method="get" className="space-y-2">
        <input
          type="search"
          name="search"
          placeholder="Search places, queries, addresses…"
          defaultValue={activeSearch}
          className="bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-ring w-full rounded-md border px-3 py-2 text-sm transition-colors focus:outline-none"
        />
        <input type="hidden" name="filter" value={activeFilter} />
      </Form>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            to={`/places?filter=${f.value}${activeSearch ? `&search=${encodeURIComponent(activeSearch)}` : ""}`}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold tracking-wide uppercase transition-colors no-underline ${
              activeFilter === f.value
                ? "bg-foreground text-background"
                : "bg-card border-border text-muted-foreground hover:text-foreground border"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {isLoading ? (
        <p className="text-muted-foreground py-2 text-xs">Loading…</p>
      ) : places.length === 0 ? (
        <p className="text-muted-foreground py-2 text-xs">
          No places match. Run <code className="font-mono">pnpm db:enrich-places</code> to import,
          or add rows to the <code className="font-mono">places</code> table.
        </p>
      ) : (
        <ul className="space-y-1">
          {places.map((place) => (
            <li key={place.id}>
              <Link
                to={`/?layers=${encodeURIComponent(layersParam)}&sel=place:${place.id}`}
                className="bg-card border-border hover:border-ring flex items-center gap-3 rounded-md border p-3 transition-colors"
              >
                <span className={`size-2 flex-shrink-0 rounded-full ${statusColor(place.reviewStatus)}`} />
                <div className="min-w-0 flex-1">
                  <div className="text-foreground truncate text-sm font-medium">{place.name}</div>
                  <div className="text-muted-foreground truncate font-mono text-[10px]">
                    {[place.city, place.country].filter(Boolean).join(", ") ||
                      place.formattedAddress ||
                      `#${place.id}`}
                  </div>
                </div>
                <span className="text-muted-foreground flex-shrink-0 font-mono text-[9px] tracking-wider uppercase">
                  {place.reviewStatus?.replace(/_/g, " ") ?? "unknown"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
