#!/bin/sh
# Container boot: migrate, seed an empty database, then serve.
# Migration failure is fatal (the app cannot run without its schema).
# Seed failure is not: a TfL outage shouldn't crash-loop the app. Fresh
# databases simply seed on the next deploy (or via `pnpm seed:tfl` /
# `pnpm seed:stations` against the same DATABASE_URL).
set -eu

echo "earth: running migrations..."
node scripts/migrate.ts

echo "earth: checking seed data..."
if node scripts/seed-if-empty.ts; then
  echo "earth: seed check ok"
else
  echo "earth: WARNING: seeding failed (TfL API may be unreachable); serving anyway."
fi

echo "earth: starting server on port ${PORT:-3000}..."
exec node_modules/.bin/react-router-serve ./build/server/index.js --port="${PORT:-3000}"
