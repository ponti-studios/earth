# Deploying Earth to Railway

## One-time setup

1. Create a Railway project from this repo (service root = repo root,
   Dockerfile path = `Dockerfile`).
2. Add a Postgres plugin to the project.
3. On the earth service, set `DATABASE_URL` to reference the database,
   e.g. `${{Postgres.DATABASE_URL}}`. `PORT` is injected by Railway.
4. Optional: set `TFL_APP_ID` / `TFL_APP_KEY` to raise TfL rate limits.
5. Generate a domain for the service.

## What happens on boot

`scripts/start.sh` runs in order:

1. `node scripts/migrate.ts` — applies `migrations/*.sql` (fatal on failure).
2. `node scripts/seed-if-empty.ts` — seeds TfL cameras + stations only when
   those tables are empty (non-fatal; a TfL outage won't crash-loop).
3. `react-router-serve` on `$PORT`.

Healthcheck: `GET /` (Railway `healthcheckPath`, plus a Docker
`HEALTHCHECK`).

## Local Docker check

```sh
docker build -t earth:test .
docker run -e "DATABASE_URL=postgresql://postgres:postgres@host.docker.internal:5435/earth" \
  -e PORT=3100 -p 3100:3100 earth:test
curl localhost:3100/
```

## The vendored kit

`@ponti-studios/ui` resolves to `vendor/ui` (a snapshot of the `ui` repo,
which lives outside this repo so remote builds can see it). After pulling
new kit work, run `pnpm sync-ui` to refresh the snapshot. The pnpm
workspace (`pnpm-workspace.yaml`) wires the dependency; `vendor/` is
excluded from tsconfig's include glob because the kit's `src/native`
React Native types would otherwise shadow DOM globals (notably
`FormData`).
