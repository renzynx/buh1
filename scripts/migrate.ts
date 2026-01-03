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
migrate(db, { migrationsFolder: "/app/migrations" });
console.log("Migrations complete.");
