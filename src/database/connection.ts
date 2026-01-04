import { Database } from "bun:sqlite";
import { drizzle, type BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

function createDb(): BunSQLiteDatabase<typeof schema> {
  const sqlite = new Database(process.env.DATABASE_URL ?? "data.db");
  sqlite.run("PRAGMA journal_mode = WAL");
  sqlite.run("PRAGMA synchronous = NORMAL");
  sqlite.run("PRAGMA cache_size = -64000");
  sqlite.run("PRAGMA busy_timeout = 30000");
  return drizzle(sqlite, { schema });
}

declare global {
  var __db: BunSQLiteDatabase<typeof schema> | undefined;
}

export const db: BunSQLiteDatabase<typeof schema> =
  globalThis.__db ?? (globalThis.__db = createDb());
