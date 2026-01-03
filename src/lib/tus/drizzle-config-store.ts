import type { Upload } from "@tus/server";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import { configStore } from "@/database/schema";

export class DrizzleConfigstore {
  async get(key: string): Promise<Upload | undefined> {
    const row = db
      .select()
      .from(configStore)
      .where(eq(configStore.key, key))
      .get();
    if (!row) return undefined;
    try {
      return JSON.parse(row.value) as Upload;
    } catch {
      return undefined;
    }
  }

  async set(key: string, value: Upload): Promise<void> {
    const json = JSON.stringify(value);
    await db
      .insert(configStore)
      .values({ key, value: json })
      .onConflictDoUpdate({ target: configStore.key, set: { value: json } })
      .run();
  }

  async delete(key: string): Promise<void> {
    db.delete(configStore).where(eq(configStore.key, key)).run();
  }

  async list(): Promise<string[]> {
    const rows = db.select().from(configStore).all();
    return rows.map((row) => row.key);
  }
}
