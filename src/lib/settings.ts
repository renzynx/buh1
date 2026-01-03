import { z } from "zod";
import { db } from "@/database";
import { configStore } from "@/database/schema";
import type { CamelCaseKeys } from "./types";
import { snakeToCamel } from "./utils";

const CONFIG_DEF = {
  require_invite: z.boolean().default(false),
  sign_up_enabled: z.boolean().default(true),
  blacklisted_extensions: z.string().default(""),
  max_invite_age: z.number().default(1000 * 60 * 60 * 24 * 7),
  allow_user_create_invites: z.boolean().default(true),
  default_user_file_count_quota: z.number().default(1000),
  default_user_quota: z.number().default(1024 * 1024 * 1024),
  default_invites_quota: z.number().default(10),
  upload_file_chunk_size: z.number().default(1024 * 1024 * 25),
  upload_file_max_size: z.number().default(1024 * 1024 * 1024 * 5),
  cdn_url: z.url().default(""),
};

type ConfigDef = typeof CONFIG_DEF;
export type ConfigKey = keyof ConfigDef;
type ConfigState = z.infer<z.ZodObject<ConfigDef>>;
export type AppSettings = CamelCaseKeys<ConfigState>;

const zShape: Record<string, z.ZodTypeAny> = {};
const keyMap: Record<string, ConfigKey> = {};
const defaults: Record<string, string> = {};

for (const [key, value] of Object.entries(CONFIG_DEF)) {
  const camelKey = snakeToCamel(key);
  const schema = value as z.ZodTypeAny;

  if (schema instanceof z.ZodDefault) {
    const defaultSchema = schema as z.ZodDefault<z.ZodTypeAny>;
    zShape[camelKey] = defaultSchema.def.innerType.optional();
  } else {
    zShape[camelKey] = schema.optional();
  }

  keyMap[camelKey] = key as ConfigKey;
  defaults[key] = String(schema.parse(undefined));
}

export const updateSettingsSchema = z.object(zShape) as z.ZodType<
  Partial<AppSettings>
>;
export const settingKeyMap = keyMap;
export const DEFAULTS = defaults;

let cachedConfig: AppSettings | null = null;

export const getSettings = async (): Promise<AppSettings> => {
  if (cachedConfig) return cachedConfig;

  const rows = await db.select().from(configStore);

  const finalConfig: Record<string, unknown> = {};
  const rawMap = new Map(rows.map((r) => [r.key, r.value]));

  for (const [snakeKey, value] of Object.entries(CONFIG_DEF)) {
    const camelKey = snakeToCamel(snakeKey);
    const dbValue = rawMap.get(snakeKey);
    const schema = value as z.ZodTypeAny;

    if (dbValue === undefined) {
      finalConfig[camelKey] = schema.parse(undefined);
    } else {
      if (schema instanceof z.ZodDefault) {
        const innerType = (schema as z.ZodDefault<z.ZodTypeAny>).def.innerType;
        if (innerType instanceof z.ZodNumber) {
          finalConfig[camelKey] = Number(dbValue);
        } else if (innerType instanceof z.ZodBoolean) {
          finalConfig[camelKey] = dbValue === "true";
        } else {
          finalConfig[camelKey] = dbValue;
        }
      } else {
        finalConfig[camelKey] = dbValue;
      }
    }
  }

  const existingKeys = new Set(rows.map((r) => r.key));
  const missing = Object.keys(CONFIG_DEF).filter((k) => !existingKeys.has(k));

  if (missing.length > 0) {
    const inserts = missing.map((k) => ({ key: k, value: DEFAULTS[k] }));
    await db
      .insert(configStore)
      .values(inserts)
      .onConflictDoNothing()
      .execute();
  }

  cachedConfig = finalConfig as AppSettings;
  return cachedConfig;
};

export const invalidateSettingsCache = () => {
  cachedConfig = null;
};
