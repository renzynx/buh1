import fs from "node:fs/promises";
import { TRPCError } from "@trpc/server";
import { generateId } from "better-auth";
import {
  and,
  asc,
  count,
  desc,
  eq,
  inArray,
  isNotNull,
  isNull,
  lt,
  type SQL,
  sql,
} from "drizzle-orm";
import type { SQLiteColumn } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import * as schema from "@/database/schema";
import { authenticatedProcedure, router } from "../server";

async function deleteFilesBackground(fileIds: string[]) {
  const BATCH_SIZE = 50;
  for (let i = 0; i < fileIds.length; i += BATCH_SIZE) {
    const batch = fileIds.slice(i, i + BATCH_SIZE);
    await Promise.allSettled(
      batch.map((id) => fs.rm(`./storage/${id}`, { force: true })),
    );
  }
}

export const userRouter = router({
  createApiKey: authenticatedProcedure.mutation(async ({ ctx }) => {
    if (ctx.session.user?.apiKey) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "API Key already exists",
      });
    }

    const newApiKey = generateId(32);

    await ctx.db
      .update(schema.user)
      .set({ apiKey: newApiKey })
      .where(eq(schema.user.id, ctx.session.user.id));

    return { apiKey: newApiKey };
  }),

  deleteApiKey: authenticatedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.session.user?.apiKey) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "API Key does not exist",
      });
    }

    await ctx.db
      .update(schema.user)
      .set({ apiKey: null })
      .where(eq(schema.user.id, ctx.session.user.id));

    return { success: true };
  }),

  createInvite: authenticatedProcedure
    .input(
      z.object({
        expiresInDays: z.number().int().min(0),
      }),
    )
    .mutation(async ({ input: { expiresInDays }, ctx }) => {
      const { getSettings } = await import("@/lib/settings");
      const settings = await getSettings();

      if (typeof expiresInDays === "number") {
        const maxMs = settings.maxInviteAge;
        if (maxMs > 0) {
          const requestedMs = expiresInDays * 24 * 60 * 60 * 1000;

          if (
            requestedMs > maxMs &&
            ctx.session.user.role !== "admin" &&
            ctx.session.user.role !== "superadmin"
          ) {
            const maxDays = Math.floor(maxMs / (24 * 60 * 60 * 1000));
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: `Invite expiration exceeds maximum allowed (${maxDays} days)`,
            });
          }
        }
      }

      if (
        !settings.allowUserCreateInvites &&
        ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "superadmin"
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Invite creation is disabled",
        });
      }

      const code = generateId(24);

      const expiresAt = expiresInDays
        ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
        : null;

      const userQuota = await ctx.db.query.userQuota.findFirst({
        where: (userQuota, { eq }) => eq(userQuota.userId, ctx.session.user.id),
      });

      if (
        userQuota?.inviteQuota !== -1 &&
        (userQuota?.inviteCount ?? 0) >=
          (userQuota?.inviteQuota ?? settings.defaultInvitesQuota)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have any invites left",
        });
      }

      try {
        const [row] = await ctx.db
          .insert(schema.invites)
          .values({
            code,
            expiresAt: expiresAt ?? null,
            usedBy: null,
            createdBy: ctx.session.user.id,
          })
          .returning();

        return { code: row.code, expiresAt: row.expiresAt };
      } catch (err) {
        const message =
          err && (err as Error).message
            ? (err as Error).message
            : "Failed to create invite";
        if (String(message).includes("UNIQUE")) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Failed to generate unique invite code, try again",
          });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: String(message),
        });
      }
    }),

  deleteFiles: authenticatedProcedure
    .input(z.object({ ids: z.array(z.string()) }))
    .mutation(async ({ input: { ids }, ctx }) => {
      const validFiles = await ctx.db
        .select({ id: schema.files.id, size: schema.files.size })
        .from(schema.files)
        .where(
          and(
            inArray(schema.files.id, ids),
            eq(schema.files.userId, ctx.session.user.id),
          ),
        );

      const validIds = validFiles.map((f) => f.id);

      if (validIds.length === 0) {
        return { deleted: 0, success: false };
      }

      const deleted = ctx.db.transaction((tx) => {
        const { changes } = tx
          .delete(schema.files)
          .where(
            and(
              inArray(schema.files.id, validIds),
              eq(schema.files.userId, ctx.session.user.id),
            ),
          )
          .run();

        const totalSize = validFiles.reduce((acc, f) => acc + f.size, 0);
        const fileCountToRemove = validFiles.length;

        tx.update(schema.userQuota)
          .set({
            usedQuota: sql`MAX(used_quota - ${totalSize}, 0)`,
            fileCount: sql`MAX(file_count - ${fileCountToRemove}, 0)`,
          })
          .where(eq(schema.userQuota.userId, ctx.session.user.id))
          .run();

        return changes;
      });

      // Offload file deletion to background
      setImmediate(() => {
        deleteFilesBackground(validIds);
      });

      return { deleted, success: true };
    }),

  deleteFolder: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input: { id }, ctx }) => {
      const [folder] = await ctx.db
        .select()
        .from(schema.folders)
        .where(eq(schema.folders.id, id));

      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found" });
      }

      if (folder.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to delete this folder",
        });
      }

      // Get all subfolders recursively
      const subfolders = (await ctx.db.run(
        sql`
          WITH RECURSIVE subfolders AS (
            SELECT id FROM ${schema.folders} WHERE id = ${id}
            UNION ALL
            SELECT f.id FROM ${schema.folders} f
            JOIN subfolders s ON f.parent_id = s.id
          )
          SELECT id FROM subfolders;
        `,
      )) as unknown as { id: string }[];

      const folderIds = subfolders.map((f) => f.id);

      const filesToDelete = await ctx.db
        .select({ id: schema.files.id, size: schema.files.size })
        .from(schema.files)
        .where(inArray(schema.files.folderId, folderIds));

      // Offload file deletion to background
      setImmediate(() => {
        deleteFilesBackground(filesToDelete.map((f) => f.id));
      });

      await ctx.db.transaction((tx) => {
        tx.update(schema.userQuota)
          .set({
            usedQuota: sql`MAX(used_quota - ${filesToDelete.reduce(
              (acc, file) => acc + file.size,
              0,
            )}, 0)`,
            fileCount: sql`MAX(file_count - ${
              filesToDelete.length + folderIds.length
            }, 0)`,
          })
          .where(eq(schema.userQuota.userId, ctx.session.user.id))
          .run();

        tx.delete(schema.folders).where(eq(schema.folders.id, id)).run();
      });

      return { success: true };
    }),

  deleteInvite: authenticatedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ input: { code }, ctx }) => {
      const [invite] = await ctx.db
        .select()
        .from(schema.invites)
        .where(eq(schema.invites.code, code))
        .limit(1);

      if (!invite) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }

      if (invite.createdBy !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own invites",
        });
      }

      if (invite.usedBy) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete an invite that has already been used",
        });
      }

      await ctx.db.transaction((tx) => {
        tx.delete(schema.invites).where(eq(schema.invites.code, code)).run();

        tx.update(schema.userQuota)
          .set({
            inviteCount: sql`MAX(invite_count - 1, 0)`,
          })
          .where(eq(schema.userQuota.userId, ctx.session.user.id))
          .run();
      });

      return { success: true };
    }),

  getFiles: authenticatedProcedure
    .input(
      z.object({
        page: z.coerce.number().default(1),
        pageSize: z.coerce.number().default(10),
        search: z.string().optional().default(""),
        sortBy: z.string().optional(),
        sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
        folderId: z.string().optional().nullable(),
      }),
    )
    .query(
      async ({
        input: { page, pageSize, search, sortBy, sortDir, folderId },
        ctx,
      }) => {
        const searchLower = search.toLowerCase().trim();

        const whereClause = and(
          eq(schema.files.userId, ctx.session.user.id),
          searchLower
            ? sql`LOWER(${schema.files.searchText}) LIKE ${`%${searchLower}%`}`
            : undefined,
          folderId
            ? eq(schema.files.folderId, folderId)
            : isNull(schema.files.folderId),
        );

        const [totalResult] = await ctx.db
          .select({ count: count() })
          .from(schema.files)
          .where(whereClause);

        const total = totalResult?.count ?? 0;
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        const start = (Math.max(1, page) - 1) * pageSize;

        const query = ctx.db
          .select()
          .from(schema.files)
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
        }));

        return {
          items,
          total,
          page: Math.max(1, page),
          pageSize,
          pageCount,
          folderId,
        };
      },
    ),

  getFolder: authenticatedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const [folder] = await ctx.db
        .select()
        .from(schema.folders)
        .where(eq(schema.folders.id, input.id));

      if (!folder) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found" });
      }

      if (folder.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You do not have access to this folder",
        });
      }

      const ancestors: (typeof schema.folders.$inferSelect)[] = [];
      let currentParentId = folder.parentId;

      while (currentParentId) {
        const [parent] = await ctx.db
          .select()
          .from(schema.folders)
          .where(eq(schema.folders.id, currentParentId));

        if (!parent || parent.userId !== ctx.session.user.id) break;

        ancestors.unshift(parent);
        currentParentId = parent.parentId;
      }

      return { ...folder, ancestors };
    }),

  getFolders: authenticatedProcedure
    .input(
      z.object({
        parentId: z.string().optional().nullable(),
        page: z.coerce.number().default(1),
        pageSize: z.coerce.number().default(50),
        search: z.string().optional().default(""),
      }),
    )
    .query(async ({ input: { parentId, page, pageSize, search }, ctx }) => {
      const searchLower = search.toLowerCase().trim();

      const whereClause = and(
        eq(schema.folders.userId, ctx.session.user.id),
        parentId
          ? eq(schema.folders.parentId, parentId)
          : isNull(schema.folders.parentId),
        searchLower
          ? sql`LOWER(${schema.folders.name}) LIKE ${`%${searchLower}%`}`
          : undefined,
      );

      const [totalResult] = await ctx.db
        .select({ count: count() })
        .from(schema.folders)
        .where(whereClause);

      const total = totalResult?.count ?? 0;
      const pageCount = Math.max(1, Math.ceil(total / pageSize));
      const start = (Math.max(1, page) - 1) * pageSize;

      const items = await ctx.db
        .select()
        .from(schema.folders)
        .where(whereClause)
        .orderBy(desc(schema.folders.createdAt))
        .limit(pageSize)
        .offset(start);

      return { items, total, page: Math.max(1, page), pageSize, pageCount };
    }),

  getInvites: authenticatedProcedure
    .input(
      z.object({
        page: z.coerce.number().default(1),
        pageSize: z.coerce.number().default(10),
        sortBy: z.string().optional(),
        sortDir: z.enum(["asc", "desc"]).optional().default("desc"),
        status: z
          .enum(["all", "active", "used", "expired"])
          .optional()
          .default("all"),
      }),
    )
    .query(
      async ({ input: { page, pageSize, sortBy, sortDir, status }, ctx }) => {
        const now = new Date();

        const baseCondition = eq(schema.invites.createdBy, ctx.session.user.id);
        const conditions: unknown[] = [baseCondition];

        if (status === "active") {
          conditions.push(isNull(schema.invites.usedBy));
        } else if (status === "used") {
          conditions.push(isNotNull(schema.invites.usedBy));
        } else if (status === "expired") {
          conditions.push(
            isNull(schema.invites.usedBy),
            isNotNull(schema.invites.expiresAt),
            lt(schema.invites.expiresAt, now),
          );
        }

        const whereClause = and(...(conditions as SQL[]));

        const [totalResult] = await ctx.db
          .select({ count: count(schema.invites.code) })
          .from(schema.invites)
          .where(whereClause);

        const total = totalResult?.count ?? 0;
        const pageCount = Math.max(1, Math.ceil(total / pageSize));
        const start = (Math.max(1, page) - 1) * pageSize;

        const query = ctx.db
          .select({
            code: schema.invites.code,
            createdAt: schema.invites.createdAt,
            expiresAt: schema.invites.expiresAt,
            usedAt: schema.invites.usedAt,
            usedBy: schema.invites.usedBy,
            usedByEmail: schema.user.email,
            usedByName: schema.user.name,
          })
          .from(schema.invites)
          .leftJoin(schema.user, eq(schema.invites.usedBy, schema.user.id))
          .where(whereClause)
          .$dynamic();

        let queryWithSort = query;

        if (sortBy && sortBy in schema.invites) {
          const column = schema.invites[
            sortBy as keyof typeof schema.invites
          ] as SQLiteColumn;
          queryWithSort = query.orderBy(
            sortDir === "asc" ? asc(column) : desc(column),
          );
        } else {
          queryWithSort = query.orderBy(desc(schema.invites.createdAt));
        }

        const rows = await queryWithSort.limit(pageSize).offset(start);

        const items = rows.map((row) => {
          let inviteStatus: "active" | "used" | "expired" = "active";
          if (row.usedBy) inviteStatus = "used";
          else if (row.expiresAt && row.expiresAt < now)
            inviteStatus = "expired";
          return { ...row, status: inviteStatus };
        });

        return { items, total, page: Math.max(1, page), pageSize, pageCount };
      },
    ),

  moveFiles: authenticatedProcedure
    .input(
      z.object({
        fileIds: z.array(z.string()),
        targetFolderId: z.string().nullable(),
      }),
    )
    .mutation(async ({ input: { fileIds, targetFolderId }, ctx }) => {
      if (targetFolderId) {
        const [targetFolder] = await ctx.db
          .select()
          .from(schema.folders)
          .where(eq(schema.folders.id, targetFolderId));

        if (!targetFolder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Target folder not found",
          });
        }
        if (targetFolder.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You do not have permission to move files to this folder",
          });
        }
      }

      const result = await ctx.db
        .update(schema.files)
        .set({ folderId: targetFolderId })
        .where(
          and(
            inArray(schema.files.id, fileIds),
            eq(schema.files.userId, ctx.session.user.id),
          ),
        )
        .run();

      return { success: true, movedCount: result.changes };
    }),

  createFolder: authenticatedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        parentId: z.string().optional(),
      }),
    )
    .mutation(async ({ input: { name, parentId }, ctx }) => {
      const { getSettings } = await import("@/lib/settings");
      const settings = await getSettings();

      const userQuota = await ctx.db.query.userQuota.findFirst({
        where: (userQuota, { eq }) => eq(userQuota.userId, ctx.session.user.id),
      });

      if (
        userQuota?.fileCountQuota !== -1 &&
        (userQuota?.fileCount ?? 0) >=
          (userQuota?.fileCountQuota ?? settings.defaultUserFileCountQuota)
      ) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You have reached your file/folder limit",
        });
      }

      if (parentId) {
        const [parentFolder] = await ctx.db
          .select()
          .from(schema.folders)
          .where(eq(schema.folders.id, parentId));

        if (!parentFolder)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Parent folder not found",
          });
        if (parentFolder.userId !== ctx.session.user.id)
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to access this folder",
          });
      }

      const [folder] = await ctx.db
        .insert(schema.folders)
        .values({
          id: generateId(),
          name,
          userId: ctx.session.user.id,
          parentId: parentId || null,
        })
        .returning();

      await ctx.db
        .update(schema.userQuota)
        .set({ fileCount: sql`file_count + 1` })
        .where(eq(schema.userQuota.userId, ctx.session.user.id));

      return folder;
    }),

  renameFolder: authenticatedProcedure
    .input(z.object({ id: z.string(), name: z.string().min(1).max(255) }))
    .mutation(async ({ input: { id, name }, ctx }) => {
      const [folder] = await ctx.db
        .select()
        .from(schema.folders)
        .where(eq(schema.folders.id, id));

      if (!folder)
        throw new TRPCError({ code: "NOT_FOUND", message: "Folder not found" });
      if (folder.userId !== ctx.session.user.id)
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to rename this folder",
        });

      const [updated] = await ctx.db
        .update(schema.folders)
        .set({ name })
        .where(eq(schema.folders.id, id))
        .returning();

      return updated;
    }),

  moveFolder: authenticatedProcedure
    .input(
      z.object({
        folderId: z.string(),
        targetParentId: z.string().nullable(),
      }),
    )
    .mutation(async ({ input: { folderId, targetParentId }, ctx }) => {
      // Get the folder to move
      const [folder] = await ctx.db
        .select()
        .from(schema.folders)
        .where(eq(schema.folders.id, folderId));

      if (!folder) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Folder not found",
        });
      }

      if (folder.userId !== ctx.session.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to move this folder",
        });
      }

      // Cannot move folder into itself
      if (folderId === targetParentId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot move a folder into itself",
        });
      }

      // Validate target parent if not null (moving to root)
      if (targetParentId) {
        const [targetFolder] = await ctx.db
          .select()
          .from(schema.folders)
          .where(eq(schema.folders.id, targetParentId));

        if (!targetFolder) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Target folder not found",
          });
        }

        if (targetFolder.userId !== ctx.session.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You don't have permission to move to this folder",
          });
        }

        // Prevent moving folder into its own descendant (circular reference)
        // Walk up the parent chain from targetParentId to check
        let currentParentId: string | null = targetParentId;
        const visited = new Set<string>();

        while (currentParentId) {
          if (currentParentId === folderId) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot move a folder into its own subfolder",
            });
          }

          if (visited.has(currentParentId)) break; // Prevent infinite loop
          visited.add(currentParentId);

          const [parent] = await ctx.db
            .select({ parentId: schema.folders.parentId })
            .from(schema.folders)
            .where(eq(schema.folders.id, currentParentId));

          currentParentId = parent?.parentId ?? null;
        }
      }

      // Update the folder's parentId
      const [updated] = await ctx.db
        .update(schema.folders)
        .set({ parentId: targetParentId })
        .where(eq(schema.folders.id, folderId))
        .returning();

      return updated;
    }),
});
