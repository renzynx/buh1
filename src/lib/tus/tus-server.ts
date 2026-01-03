import { normalize } from "node:path";
import { FileStore } from "@tus/file-store";
import { EVENTS, Server } from "@tus/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/database";
import { configStore, files, userQuota } from "@/database/schema";
import { auth } from "../auth";
import { getSettings } from "../settings";
import { generateUniqueSlug } from "../utils";
import { DrizzleConfigstore } from "./drizzle-config-store";

export const tusServer = new Server({
  path: "/api/upload",
  datastore: new FileStore({
    directory: "./storage",
    configstore: new DrizzleConfigstore(),
  }),
  respectForwardedHeaders: true,
  allowedOrigins: process.env.AUTH_BASE_URL ? [process.env.AUTH_BASE_URL] : [],
  maxSize: async () => await getSettings().then((s) => s.uploadFileMaxSize),
  onIncomingRequest: async (request) => {
    const session = await auth.api.getSession({ headers: request.headers });

    if (!session) {
      throw {
        status_code: 401,
        body: "Unauthorized",
      };
    }

    const [settings, quota] = await Promise.all([
      getSettings(),
      db.query.userQuota.findFirst({
        where: (userQuota, { eq }) => eq(userQuota.userId, session.user.id),
      }),
    ]);

    const maxQuota = quota?.quota || settings.defaultUserQuota;
    const maxFiles = settings.defaultUserFileCountQuota;

    if (quota?.quota !== -1 && (quota?.usedQuota ?? 0) >= maxQuota) {
      throw {
        status_code: 403,
        body: "Storage quota exceeded",
      };
    }

    if (quota?.fileCountQuota !== -1 && (quota?.fileCount ?? 0) >= maxFiles) {
      throw {
        status_code: 403,
        body: `Maximum file limit reached (${maxFiles} files)`,
      };
    }
  },
  onUploadCreate: async (_, upload) => {
    const userSettings = await getSettings();
    const blacklistedExtensions = userSettings.blacklistedExtensions;
    const extension = upload.metadata!.filename?.split(".").pop();

    if (!extension || blacklistedExtensions.includes(extension)) {
      throw {
        status_code: 403,
        body: "File type not allowed",
      };
    }

    return {
      metadata: upload.metadata,
    };
  },
});

tusServer.on(EVENTS.POST_FINISH, async (_, __, upload) => {
  const filename = upload.metadata?.filename;
  const mimeType = upload.metadata?.filetype || "application/octet-stream";
  const folderId = upload.metadata?.folderId;
  const userId = upload.metadata?.userId;
  const size = upload.size;

  if (!filename || !userId || size === undefined) {
    console.error("Missing required upload metadata", {
      filename,
      userId,
      size,
    });
    return;
  }

  const searchText = normalize(`${filename} ${mimeType}`);
  const slug = await generateUniqueSlug((s) =>
    Boolean(db.select().from(files).where(eq(files.slug, s)).get()),
  );

  db.transaction((tx) => {
    tx.insert(files)
      .values({
        id: upload.id,
        slug,
        filename,
        size,
        userId,
        mimeType,
        searchText,
        folderId,
      })
      .returning()
      .run();

    tx.update(userQuota)
      .set({
        usedQuota: sql`used_quota + ${size}`,
        fileCount: sql`file_count + 1`,
      })
      .where(eq(userQuota.userId, userId))
      .run();

    tx.delete(configStore).where(eq(configStore.key, upload.id)).run();
  });
});
