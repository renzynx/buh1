import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from ".";

const runMigrate =
  process.argv.includes("--migrate") || process.argv.includes("migrate");

if (runMigrate) {
  try {
    migrate(db, { migrationsFolder: "./src/database/migrations" });
  } catch {}
}
