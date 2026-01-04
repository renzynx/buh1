import "./env-config.ts";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/database/schema.ts",
  out: "./src/database/migrations",

  dbCredentials: {
    url: process.env.DATABASE_URL ?? "data.db",
  },
});
