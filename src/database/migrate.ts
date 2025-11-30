import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from ".";

const runMigrate =
  process.argv.includes("--migrate") || process.argv.includes("migrate");

if (runMigrate) {
  try {
    migrate(db, { migrationsFolder: "./src/database/migrations" });
  } catch {}
}
