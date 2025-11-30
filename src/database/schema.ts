import { relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  type SQLiteColumn,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const user = sqliteTable(
  "user",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: integer("email_verified", { mode: "boolean" })
      .default(false)
      .notNull(),
    image: text("image"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    role: text("role"),
    banned: integer("banned", { mode: "boolean" }).default(false),
    banReason: text("ban_reason"),
    banExpires: integer("ban_expires", { mode: "timestamp_ms" }),
    apiKey: text("api_key").unique(),
    twoFactorEnabled: integer("two_factor_enabled", {
      mode: "boolean",
    }).default(false),
  },
  (table) => [index("user_email_idx").on(table.email)],
);

export const userQuota = sqliteTable("user_quota", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  quota: integer("quota").notNull().default(0),
  usedQuota: integer("used_quota").notNull().default(0),
  fileCount: integer("file_count").notNull().default(0),
  fileCountQuota: integer("file_count_quota").notNull().default(0),
  inviteCount: integer("invite_count").notNull().default(0),
  inviteQuota: integer("invite_quota").notNull().default(0),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    impersonatedBy: text("impersonated_by"),
  },
  (table) => [
    index("session_user_id_idx").on(table.userId),
    index("session_token_idx").on(table.token),
  ],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_user_id_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const folders = sqliteTable(
  "folders",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    parentId: text("parent_id").references((): SQLiteColumn => folders.id, {
      onDelete: "cascade",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_folders_user_id").on(table.userId),
    index("idx_folders_parent_id").on(table.parentId),
  ],
);

export const files = sqliteTable(
  "files",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    folderId: text("folder_id").references(() => folders.id, {
      onDelete: "cascade",
    }),
    filename: text("filename").notNull(),
    searchText: text("search_text").notNull().default(""),
    size: integer("size").notNull(),
    mimeType: text("mime_type").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("idx_files_search_text").on(table.searchText),
    index("idx_files_folder_id").on(table.folderId),
  ],
);

export const configStore = sqliteTable("config_store", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const invites = sqliteTable(
  "invites",
  {
    code: text("code").primaryKey(),
    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }),
    createdBy: text("created_by").references(() => user.id, {
      onDelete: "set null",
    }),
    usedBy: text("used_by").references(() => user.id, { onDelete: "set null" }),
    usedAt: integer("used_at", { mode: "timestamp_ms" }),
  },
  (table) => [index("invites_used_by_idx").on(table.usedBy)],
);

export const twoFactor = sqliteTable(
  "two_factor",
  {
    id: text("id").primaryKey(),
    secret: text("secret").notNull(),
    backupCodes: text("backup_codes").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [
    index("two_factor_secret_idx").on(table.secret),
    index("two_factor_user_id_idx").on(table.userId),
  ],
);

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  files: many(files),
  folders: many(folders),
  createdInvites: many(invites, { relationName: "createdBy" }),
  usedInvites: many(invites, { relationName: "usedBy" }),
  twoFactors: many(twoFactor),
  quota: one(userQuota, {
    fields: [user.id],
    references: [userQuota.userId],
  }),
}));

export const userQuotaRelations = relations(userQuota, ({ one }) => ({
  user: one(user, {
    fields: [userQuota.userId],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const foldersRelations = relations(folders, ({ one, many }) => ({
  user: one(user, { fields: [folders.userId], references: [user.id] }),
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "subfolders",
  }),
  subfolders: many(folders, { relationName: "subfolders" }),
  files: many(files),
}));

export const filesRelations = relations(files, ({ one }) => ({
  user: one(user, { fields: [files.userId], references: [user.id] }),
  folder: one(folders, { fields: [files.folderId], references: [folders.id] }),
}));

export const invitesRelations = relations(invites, ({ one }) => ({
  user: one(user, {
    fields: [invites.usedBy],
    references: [user.id],
    relationName: "usedBy",
  }),
  creator: one(user, {
    fields: [invites.createdBy],
    references: [user.id],
    relationName: "createdBy",
  }),
}));

export const twoFactorRelations = relations(twoFactor, ({ one }) => ({
  user: one(user, {
    fields: [twoFactor.userId],
    references: [user.id],
  }),
}));

export type DatabaseUser = typeof user.$inferSelect;
export type NewDatabaseUser = typeof user.$inferInsert;
export type DatabaseAccount = typeof account.$inferSelect;
export type NewDatabaseAccount = typeof account.$inferInsert;
export type DatabaseSession = typeof session.$inferSelect;
export type NewDatabaseSession = typeof session.$inferInsert;
export type DatabaseVerification = typeof verification.$inferSelect;
export type NewDatabaseVerification = typeof verification.$inferInsert;
export type DatabaseFiles = typeof files.$inferSelect;
export type NewDatabaseFiles = typeof files.$inferInsert;
export type DatabaseFolders = typeof folders.$inferSelect;
export type NewDatabaseFolders = typeof folders.$inferInsert;
export type DatabaseInvite = typeof invites.$inferSelect;
export type NewDatabaseInvite = typeof invites.$inferInsert;
export type DatabaseTwoFactor = typeof twoFactor.$inferSelect;
export type NewDatabaseTwoFactor = typeof twoFactor.$inferInsert;
export type DatabaseUserQuota = typeof userQuota.$inferSelect;
export type NewDatabaseUserQuota = typeof userQuota.$inferInsert;
