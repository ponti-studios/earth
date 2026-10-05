import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let _db: ReturnType<typeof drizzle> | null = null;
let _client: postgres.Sql | null = null;

function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (url) return url;
  if (process.env.NODE_ENV === "test") {
    return "postgresql://postgres:postgres@localhost:4433/labs-test";
  }
  throw new Error("DATABASE_URL environment variable is required");
}

function initializeDb() {
  if (_db) return _db;
  // Reuse one client across Vite HMR reloads in dev: every re-executed
  // module otherwise opens a fresh pool and Postgres eventually refuses
  // connections ("too many clients already").
  const globalForDb = globalThis as unknown as {
    __earthDb?: ReturnType<typeof drizzle>;
    __earthClient?: postgres.Sql;
  };
  if (globalForDb.__earthDb && globalForDb.__earthClient) {
    _db = globalForDb.__earthDb;
    _client = globalForDb.__earthClient;
    return _db;
  }
  _client = postgres(getDatabaseUrl(), { max: 5 });
  _db = drizzle(_client, { schema });
  globalForDb.__earthDb = _db;
  globalForDb.__earthClient = _client;
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_, prop) {
    return Reflect.get(initializeDb(), prop);
  },
});

export function closeDb() {
  if (_client) {
    _client.end();
    _client = null;
    _db = null;
  }
}
