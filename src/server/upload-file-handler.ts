import "dotenv/config";
import { writeFile } from "@mjackson/lazy-file/fs";
import { enhance } from "@universal-middleware/core";
import { generateId } from "better-auth";
import { eq } from "drizzle-orm";
import { files, user } from "@/database/schema";
import { getSettings } from "@/lib/settings";
import type { Handler } from "@/lib/types";
import { normalize } from "@/lib/utils";

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const BASE_URL = process.env.AUTH_BASE_URL;

export const uploadFileHandler: Handler = enhance(
  async (req, ctx) => {
    const apiKey = req.headers.get("x-api-key");
    if (!apiKey) {
      return Response.json({ error: "API Key is required" }, { status: 401 });
    }

    const userData = await ctx.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.apiKey, apiKey))
      .get();

    if (!userData) {
      return Response.json({ error: "Invalid API Key" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return Response.json({ error: "File is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return Response.json(
        { error: "File size exceeds the 100MB limit" },
        { status: 413 },
      );
    }

    const fileId = generateId(32);
    const storagePath = `./storage/${fileId}`;

    try {
      await writeFile(storagePath, file);

      await ctx.db.insert(files).values({
        id: fileId,
        userId: userData.id,
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        searchText: normalize(`${file.name} ${file.type}`),
      });

      const settings = await getSettings();

      return Response.json({
        url: `${settings.cdnUrl || BASE_URL}/api/f/${Buffer.from(fileId).toString("base64url")}`,
      });
    } catch {
      return Response.json({ error: "Failed to upload file" }, { status: 500 });
    }
  },
  {
    method: ["POST"],
    name: "buh:upload-file-handler",
    path: "/api/upload-file",
  },
);
