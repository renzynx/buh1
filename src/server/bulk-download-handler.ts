import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import { enhance } from "@universal-middleware/core";
import archiver from "archiver";
import { and, eq, inArray } from "drizzle-orm";
import { files } from "@/database/schema";
import { auth } from "@/lib/auth";
import type { Handler } from "@/lib/types";

const MAX_BATCH_SIZE = 50;
const STORAGE_ROOT = path.join(process.cwd(), "storage");

export const bulkDownloadHandler: Handler = enhance(
  async (req, ctx) => {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const ids = url.searchParams.get("ids")?.split(",") ?? [];

    if (ids.length === 0) {
      return new Response(JSON.stringify({ error: "No files selected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (ids.length > MAX_BATCH_SIZE) {
      return new Response(
        JSON.stringify({
          error: `Cannot download more than ${MAX_BATCH_SIZE} files at once`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const userFiles = await ctx.db
      .select({
        id: files.id,
        filename: files.filename,
      })
      .from(files)
      .where(and(eq(files.userId, session.user.id), inArray(files.id, ids)));

    if (userFiles.length === 0) {
      return new Response(JSON.stringify({ error: "No files found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const validFiles = (
      await Promise.all(
        userFiles.map(async (file) => {
          const filePath = path.join(STORAGE_ROOT, file.id);
          try {
            await fs.access(filePath, constants.F_OK);
            return { ...file, filePath };
          } catch {
            return null;
          }
        }),
      )
    ).filter((f): f is NonNullable<typeof f> => f !== null);

    if (validFiles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Files exist in DB but missing on disk" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `files-export-${timestamp}.zip`;

    const archive = archiver("zip", {
      zlib: { level: 6 }, // Balanced compression speed/size
    });

    const stream = new PassThrough();

    archive.pipe(stream);

    archive.on("error", (err) => {
      console.error("Archiver error:", err);
      stream.destroy(err);
    });

    (async () => {
      try {
        for (const file of validFiles) {
          archive.file(file.filePath, { name: file.filename });
        }
        await archive.finalize();
      } catch (error) {
        console.error("Error finalizing archive:", error);
        stream.destroy(
          error instanceof Error ? error : new Error(String(error)),
        );
      }
    })();

    return new Response(Readable.toWeb(stream) as ReadableStream, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  },
  {
    name: "buh:bulk-download",
    path: "/api/files/bulk-download",
    method: "GET",
  },
);
