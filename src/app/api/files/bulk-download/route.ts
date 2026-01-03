import { constants } from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import { PassThrough, Readable } from "node:stream";
import archiver from "archiver";
import { and, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/database";
import { files } from "@/database/schema";
import { auth } from "@/lib/auth";

const MAX_BATCH_SIZE = 50;
const STORAGE_ROOT = path.join(process.cwd(), "storage");

export async function GET(req: Request): Promise<Response> {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const ids = url.searchParams.get("ids")?.split(",") ?? [];

  if (ids.length === 0) {
    return Response.json({ error: "No files selected" }, { status: 400 });
  }

  if (ids.length > MAX_BATCH_SIZE) {
    return Response.json(
      { error: `Cannot download more than ${MAX_BATCH_SIZE} files at once` },
      { status: 400 },
    );
  }

  const userFiles = await db
    .select({
      id: files.id,
      filename: files.filename,
    })
    .from(files)
    .where(and(eq(files.userId, session.user.id), inArray(files.id, ids)));

  if (userFiles.length === 0) {
    return Response.json({ error: "No files found" }, { status: 404 });
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
    return Response.json(
      { error: "Files exist in DB but missing on disk" },
      { status: 404 },
    );
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `files-export-${timestamp}.zip`;

  const archive = archiver("zip", { zlib: { level: 6 } });
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
      stream.destroy(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
