import { Link } from "react-router";
import { yearColor } from "~/lib/flights";

type Props = {
  years: readonly number[];
  selectedYears: readonly number[];
};

function chipClass(active: boolean): string {
  const base =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-semibold tracking-wide uppercase no-underline transition-colors";
  return active
    ? `${base} bg-foreground text-background`
    : `${base} bg-card border-border text-muted-foreground hover:text-foreground border`;
}

/**
 * Single-select year pills plus an "All" reset. The selection lives in the URL
 * (`?years=2019`) so a filtered map is shareable and the map and list always
 * read the same source of truth.
 */
export default function FlightYearFilter({ years, selectedYears }: Props) {
  const allSelected = selectedYears.length === years.length;

  return (
    <section aria-label="Year filter">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 className="ui-eyebrow">Years</h2>
        <span className="text-muted-foreground font-mono text-[10px] tracking-wide">
          {allSelected ? "All selected" : selectedYears.join(", ")}
        </span>
      </div>

      <nav aria-label="Filter legs by year" className="flex flex-wrap gap-1.5">
        <Link
          to="/flights"
          aria-current={allSelected ? "true" : undefined}
          className={chipClass(allSelected)}
        >
          All
        </Link>
        {years.map((year) => {
          const active = !allSelected && selectedYears.includes(year);
          return (
            <Link
              key={year}
              to={`/flights?years=${year}`}
              data-year={year}
              aria-current={active ? "true" : undefined}
              className={chipClass(active)}
            >
              <span
                aria-hidden="true"
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: yearColor(year) }}
              />
              {year}
            </Link>
          );
        })}
      </nav>
    </section>
  );
}
