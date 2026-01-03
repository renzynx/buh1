import fs, { type Stats } from "node:fs";
import path from "node:path";
import { openFile } from "@mjackson/lazy-file/fs";
import { eq } from "drizzle-orm";
import { db } from "@/database";
import { files } from "@/database/schema";

const STORAGE_DIR = path.resolve("./storage");

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; filename: string[] }> },
): Promise<Response> {
  try {
    const { slug } = await params;

    if (!slug) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    const metadata = db
      .select({
        id: files.id,
        filename: files.filename,
        size: files.size,
        mimeType: files.mimeType,
      })
      .from(files)
      .where(eq(files.slug, slug))
      .get();

    if (!metadata) {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    const normalizedId = path
      .normalize(metadata.id)
      .replace(/^(\.\.(\/|\\|$))+/, "");
    const filePath = path.join(STORAGE_DIR, normalizedId);

    if (!filePath.startsWith(STORAGE_DIR)) {
      return Response.json({ error: "Access denied" }, { status: 403 });
    }

    let stats: Stats;
    try {
      stats = await fs.promises.stat(filePath);
    } catch {
      return Response.json({ error: "File not found" }, { status: 404 });
    }

    if (!stats.isFile()) {
      return Response.json({ error: "Invalid file" }, { status: 400 });
    }

    const fileHandle = openFile(filePath);

    return new Response(fileHandle.stream(), {
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
        "Content-Security-Policy": "default-src 'none'",
        "Content-Length": metadata.size.toString(),
        "Content-Type": metadata.mimeType,
        "Content-Disposition": `inline; filename="${encodeURIComponent(metadata.filename)}"`,
      },
    });
  } catch (error) {
    console.error("File handler error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
