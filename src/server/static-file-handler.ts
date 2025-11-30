import fs, { type Stats } from "node:fs";
import path from "node:path";
import { openFile } from "@mjackson/lazy-file/fs";
import { enhance } from "@universal-middleware/core";
import { eq } from "drizzle-orm";
import { files } from "@/database/schema";
import type { Handler } from "@/lib/types";

const STORAGE_DIR = path.resolve("./storage");

export const staticFileHandler: Handler = enhance(
  async (req, ctx) => {
    try {
      const slug = req.url.split("/").pop();

      // Validate slug exists
      if (!slug) {
        return new Response(JSON.stringify({ error: "Not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      let id: string;
      try {
        id = Buffer.from(slug, "base64url").toString("utf-8");
      } catch {
        return new Response(
          JSON.stringify({ error: "Invalid file identifier" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const metadata = await ctx.db
        .select({
          filename: files.filename,
          size: files.size,
          mimeType: files.mimeType,
        })
        .from(files)
        .where(eq(files.id, id))
        .get();

      if (!metadata) {
        return new Response(JSON.stringify({ error: "File not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      const normalizedId = path.normalize(id).replace(/^(\.\.(\/|\\|$))+/, "");
      const filePath = path.join(STORAGE_DIR, normalizedId);

      if (!filePath.startsWith(STORAGE_DIR)) {
        return new Response(JSON.stringify({ error: "Access denied" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }

      let stats: Stats;

      try {
        stats = await fs.promises.stat(filePath);
      } catch {
        return new Response(JSON.stringify({ error: "File not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (!stats.isFile()) {
        return new Response(JSON.stringify({ error: "Invalid file" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const fileHandle = await openFile(filePath);

      return new Response(fileHandle, {
        headers: {
          "Cache-Control": "public, max-age=31536000, immutable",
          "X-Content-Type-Options": "nosniff",
          "Content-Security-Policy": "default-src 'none'",
          "Content-Length": metadata.size.toString(),
          "Content-Type": metadata.mimeType,
          "Content-Disposition": `inline; filename="${encodeURIComponent(
            metadata.filename,
          )}"`,
        },
      });
    } catch (error) {
      console.error("File handler error:", error);
      return new Response(JSON.stringify({ error: "Internal server error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
  {
    name: "buh:static-file",
    path: "/api/f/:slug",
    method: "GET",
  },
);
