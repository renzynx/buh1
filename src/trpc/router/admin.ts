import fs from "node:fs/promises";
import { asc, count, desc, eq, inArray, type SQL, sql } from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import * as schema from "@/database/schema";
import {
  getSettings,
  invalidateSettingsCache,
  settingKeyMap,
  updateSettingsSchema,
} from "@/lib/settings";
import { adminProcedure, router, superAdminProcedure } from "../server";

async function deleteFilesBackground(fileIds: string[]) {
  const BATCH_SIZE = 50;
  for (let i = 0; i < fileIds.length; i += BATCH_SIZE) {
    const batch = fileIds.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map((id) => fs.rm(`./storage/${id}`, { force: true })),
    );
  }
}

export const adminRouter = router({
  getUserQuota: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(({ input, ctx }) => {
      return ctx.db.query.userQuota.findFirst({
        where: (userQuota, { eq }) => eq(userQuota.userId, input.userId),
      });
    }),

  updateUserQuota: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        quota: z.number().optional(),
        fileCountQuota: z.number().optional(),
        inviteQuota: z.number().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.db
        .update(schema.userQuota)
        .set(input)
        .where(eq(schema.userQuota.userId, input.userId))
        .execute();

      return { success: true };
    }),

  updateSettings: superAdminProcedure
    .input(updateSettingsSchema)
    .mutation(async ({ input, ctx }) => {
      const updates: { key: string; value: string }[] = [];

      for (const [camelKey, value] of Object.entries(input)) {
        if (value !== undefined) {
          const dbKey = settingKeyMap[camelKey];
          if (dbKey) {
            updates.push({
              key: dbKey,
              value: String(value),
            });
          }
        }
      }

      for (const update of updates) {
        await ctx.db
          .insert(schema.configStore)
          .values({ key: update.key, value: update.value })
          .onConflictDoUpdate({
            target: schema.configStore.key,
            set: { value: update.value },
          });
      }

      invalidateSettingsCache();

      return { success: true, settings: await getSettings() };
    }),

  getAnalytics: adminProcedure.query(async () => {
    const { getAnalytics } = await import("@/lib/analytics");
    return getAnalytics();
  }),

  getTopUsers: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Get users with most files
      const topByFiles = await ctx.db
        .select({
          userId: schema.userQuota.userId,
          fileCount: schema.userQuota.fileCount,
        })
        .from(schema.userQuota)
        .orderBy(sql`${schema.userQuota.fileCount} DESC`)
        .limit(input.limit);

      // Get users with most storage used
      const topByStorage = await ctx.db
        .select({
          userId: schema.userQuota.userId,
          usedQuota: schema.userQuota.usedQuota,
        })
        .from(schema.userQuota)
        .orderBy(sql`${schema.userQuota.usedQuota} DESC`)
        .limit(input.limit);

      // Fetch user details
      const userIds = [
        ...new Set([
          ...topByFiles.map((u) => u.userId),
          ...topByStorage.map((u) => u.userId),
        ]),
      ];

      const users = await ctx.db.query.user.findMany({
        where: (user, { inArray }) => inArray(user.id, userIds),
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      // Map users and ensure name fallback
      const usersMap = new Map(
        users.map((u) => [
          u.id,
          { ...u, name: u.name || u.email?.split("@")[0] || "Unknown" },
        ]),
      );

      return {
        byFiles: topByFiles.map((item) => ({
          user: usersMap.get(item.userId),
          fileCount: item.fileCount,
        })),
        byStorage: topByStorage.map((item) => ({
          user: usersMap.get(item.userId),
          usedQuota: item.usedQuota,
        })),
      };
    }),

  getRecentActivity: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(10),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Recent users
      const recentUsers = await ctx.db.query.user.findMany({
        orderBy: (user, { desc }) => [desc(user.createdAt)],
        limit: input.limit,
        columns: {
          id: true,
          name: true,
          email: true,
          image: true,
          createdAt: true,
        },
      });

      // Recent files
      const recentFiles = await ctx.db.query.files.findMany({
        orderBy: (files, { desc }) => [desc(files.createdAt)],
        limit: input.limit,
        with: {
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // Recent invites
      const recentInvites = await ctx.db.query.invites.findMany({
        orderBy: (invites, { desc }) => [desc(invites.createdAt)],
        limit: input.limit,
        with: {
          creator: {
            columns: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return {
        users: recentUsers.map((user) => ({
          ...user,
          name: user.name || user.email?.split("@")[0] || "Unknown",
        })),
        files: recentFiles.map((file) => ({
          ...file,
          user: file.user
            ? {
                ...file.user,
                name:
                  file.user.name ||
                  file.user.email?.split("@")[0] ||
                  "Unknown User",
              }
            : {
                id: "deleted",
                name: "Deleted User",
                email: "deleted@user.com",
              },
        })),
        invites: recentInvites.map((invite) => ({
          ...invite,
          creator: invite.creator
            ? {
                ...invite.creator,
                name:
                  invite.creator.name ||
                  invite.creator.email?.split("@")[0] ||
                  "System",
              }
            : null,
        })),
      };
    }),

  getAllFiles: adminProcedure
    .input(
      z.object({
        page: z.coerce.number().default(1),
        pageSize: z.coerce.number().default(10),
        search: z.string().optional().default(""),
        searchField: z
          .enum(["filename", "id", "userName", "userEmail"])
          .optional()
          .default("filename"),
        sortBy: z.string().optional(),
        sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
      }),
    )
    .query(
      async ({
        input: { page, pageSize, search, searchField, sortBy, sortDir },
        ctx,
      }) => {
        const searchLower = search.toLowerCase().trim();

        let whereClause: SQL | undefined;

        if (searchLower) {
          if (searchField === "filename") {
            whereClause = sql`LOWER(${schema.files.filename}) LIKE ${`%${searchLower}%`}`;
          } else if (searchField === "id") {
            whereClause = eq(schema.files.id, searchLower);
          } else if (searchField === "userName") {
            whereClause = sql`LOWER(${schema.user.name}) LIKE ${`%${searchLower}%`}`;
          } else if (searchField === "userEmail") {
            whereClause = sql`LOWER(${schema.user.email}) LIKE ${`%${searchLower}%`}`;
          }
        }

        const [totalResult] = await ctx.db
          .select({ count: count() })
          .from(schema.files)
          .leftJoin(schema.user, eq(schema.files.userId, schema.user.id))
          .where(whereClause);

        const total = totalResult?.count ?? 0;
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        const start = (Math.max(1, page) - 1) * pageSize;

        const query = ctx.db
          .select({
            id: schema.files.id,
            filename: schema.files.filename,
            size: schema.files.size,
            mimeType: schema.files.mimeType,
            createdAt: schema.files.createdAt,
            user: {
              id: schema.user.id,
              email: schema.user.email,
              name: schema.user.name,
            },
          })
          .from(schema.files)
          .leftJoin(schema.user, eq(schema.files.userId, schema.user.id))
          .where(whereClause)
          .$dynamic();

        let queryWithSort = query;

        if (sortBy && sortBy in schema.files) {
          const column = schema.files[
            sortBy as keyof typeof schema.files
          ] as SQLiteColumn;
          queryWithSort = query.orderBy(
            sortDir === "asc" ? asc(column) : desc(column),
          );
        } else {
          queryWithSort = query.orderBy(desc(schema.files.createdAt));
        }

        const rows = await queryWithSort.limit(pageSize).offset(start);

        const items = rows.map((file) => ({
          ...file,
          encodedId: Buffer.from(file.id, "utf8").toString("base64url"),
          user: file.user
            ? {
                ...file.user,
                name:
                  file.user.name || file.user.email?.split("@")[0] || "Unknown",
              }
            : null,
        }));

        return {
          items,
          total,
          page: Math.max(1, page),
          pageSize,
          pageCount,
        };
      },
    ),

  deleteFiles: adminProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input: { ids }, ctx }) => {
      if (ids.length === 0) {
        return { deleted: 0, success: false };
      }

      const chunks: string[][] = [];
      const DB_BATCH_SIZE = 500;

      for (let i = 0; i < ids.length; i += DB_BATCH_SIZE) {
        chunks.push(ids.slice(i, i + DB_BATCH_SIZE));
      }

      const validFiles = [];

      for (const chunk of chunks) {
        const batch = await ctx.db
          .select({
            id: schema.files.id,
            size: schema.files.size,
            userId: schema.files.userId,
          })
          .from(schema.files)
          .where(inArray(schema.files.id, chunk));
        validFiles.push(...batch);
      }

      if (validFiles.length === 0) {
        return { deleted: 0, success: false };
      }

      const filesByUser = validFiles.reduce(
        (acc, file) => {
          if (!acc[file.userId]) {
            acc[file.userId] = { size: 0, count: 0 };
          }
          acc[file.userId].size += file.size;
          acc[file.userId].count += 1;
          return acc;
        },
        {} as Record<string, { size: number; count: number }>,
      );

      await ctx.db.transaction((tx) => {
        for (const chunk of chunks) {
          tx.delete(schema.files).where(inArray(schema.files.id, chunk)).run();
        }

        for (const [userId, stats] of Object.entries(filesByUser)) {
          tx.update(schema.userQuota)
            .set({
              usedQuota: sql`MAX(used_quota - ${stats.size}, 0)`,
              fileCount: sql`MAX(file_count - ${stats.count}, 0)`,
            })
            .where(eq(schema.userQuota.userId, userId))
            .run();
        }
      });

      void Promise.resolve().then(async () => {
        try {
          await deleteFilesBackground(ids);
        } catch (error) {
          console.error("Background file deletion failed:", error);
        }
      });

      return { deleted: validFiles.length, success: true };
    }),
});
