import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";

const dbPath = process.env.DATABASE_URL ?? "/app/db/data.db";
const sqlite = new Database(dbPath);

sqlite.run("PRAGMA journal_mode = WAL");
sqlite.run("PRAGMA synchronous = NORMAL");
sqlite.run("PRAGMA cache_size = -64000");
sqlite.run("PRAGMA busy_timeout = 5000");

const db = drizzle(sqlite);

console.log(`Running migrations on ${dbPath}...`);

// Check if this is an existing database without migration tracking
// by checking if tables exist but __drizzle_migrations doesn't
const tablesExist = sqlite
  .query<{ name: string }, []>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='account'",
  )
  .get();

const migrationsTableExists = sqlite
  .query<{ name: string }, []>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='__drizzle_migrations'",
  )
  .get();

if (tablesExist && !migrationsTableExists) {
  console.log("Detected existing database without migration tracking.");
  console.log("Seeding migration history for existing tables...");

  // Create the migrations table manually
  sqlite.run(`
    CREATE TABLE IF NOT EXISTS __drizzle_migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hash TEXT NOT NULL,
      created_at INTEGER
    )
  `);

  // Check if slug column exists on files table to determine which migrations were applied
  const slugExists = sqlite
    .query<{ name: string }, []>(
      "SELECT name FROM pragma_table_info('files') WHERE name='slug'",
    )
    .get();

  // Mark migration 0000 as applied (initial schema)
  sqlite.run(
    "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
    ["0000_light_paper_doll", Date.now()],
  );
  console.log("Marked migration 0000_light_paper_doll as applied.");

  // If slug column exists, mark migration 0001 as applied too
  if (slugExists) {
    sqlite.run(
      "INSERT INTO __drizzle_migrations (hash, created_at) VALUES (?, ?)",
      ["0001_mysterious_wrecker", Date.now()],
    );
    console.log("Marked migration 0001_mysterious_wrecker as applied.");
  }
}

// Now run migrations normally - only pending ones will execute
migrate(db, { migrationsFolder: "/app/migrations" });
console.log("Migrations complete.");
