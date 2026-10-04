import "dotenv/config";
import { isNull, or, sql } from "drizzle-orm";
import { db, places, placeGeocodeAttempts } from "../src/db/index.js";
import { geocodePreview } from "../app/lib/server/geocode.js";

// Port of geo's `geokit enrich-db`: geocode places missing coordinates
// using the web geocoder (Nominatim), with pacing between lookups.
// Usage: pnpm db:enrich-places [--limit N] [--dry-run] [--pacing-ms N]

const args = process.argv.slice(2);
const limitFlag = args.indexOf("--limit");
const limit = limitFlag >= 0 ? Number(args[limitFlag + 1]) : undefined;
const dryRun = args.includes("--dry-run");
const pacingFlag = args.indexOf("--pacing-ms");
const pacingMs = pacingFlag >= 0 ? Number(args[pacingFlag + 1]) : 1100;

const rows = await db
  .select()
  .from(places)
  .where(or(isNull(places.latitude), isNull(places.formattedAddress), sql`${places.formattedAddress} = ''`))
  .orderBy(places.id)
  .limit(limit && Number.isFinite(limit) ? limit : 100);

if (rows.length === 0) {
  console.log("No places found that need geocoding.");
  process.exit(0);
}

console.log(`Found ${rows.length} place(s) to geocode${dryRun ? " (dry-run)" : ""}.`);

let updated = 0;
let failed = 0;

for (const [index, row] of rows.entries()) {
  const query = [row.reviewQuery || row.name, row.city, row.state, row.country]
    .filter((part) => part && part.trim())
    .join(", ");
  process.stderr.write(`  [${index + 1}/${rows.length}] "${query}" ... `);

  try {
    const preview = await geocodePreview(query, 1);
    const result = preview.results[0];
    if (!result) {
      process.stderr.write("no results\n");
      failed += 1;
    } else if (dryRun) {
      process.stderr.write(
        `would update: lat=${result.latitude} lon=${result.longitude} addr="${result.displayTitle}"\n`,
      );
      updated += 1;
    } else {
      await db
        .update(places)
        .set({
          latitude: result.latitude,
          longitude: result.longitude,
          formattedAddress: result.formattedAddress ?? result.displayTitle,
          city: result.city ?? row.city,
          state: result.state ?? row.state,
          postalCode: result.postalCode ?? row.postalCode,
          country: result.country ?? row.country,
          countryCode: result.countryCode ?? row.countryCode,
          geocodedAt: new Date(),
          lastGeocodeStatus: "ok",
          lastGeocodeQuery: query,
          lastGeocodeResultSummary: result.displayTitle,
          updatedAt: new Date(),
        })
        .where(sql`${places.id} = ${row.id}`);
      await db.insert(placeGeocodeAttempts).values({
        placeId: row.id,
        query,
        status: "enriched",
        resultSummary: result.displayTitle,
      });
      process.stderr.write("updated\n");
      updated += 1;
    }
  } catch (error) {
    process.stderr.write(`error: ${error instanceof Error ? error.message : String(error)}\n`);
    failed += 1;
  }

  if (index < rows.length - 1 && pacingMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, pacingMs));
  }
}

console.log(`\n${dryRun ? "Would update" : "Updated"} ${updated} place(s)${failed > 0 ? `, ${failed} failed` : ""}.`);
process.exit(0);
