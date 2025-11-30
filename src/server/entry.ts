import "dotenv/config";
import "@/database/migrate";
import { apply, serve } from "@photonjs/hono";
import { Hono } from "hono";
import { auth } from "@/lib/auth";
import { tusServer } from "@/lib/tus/tus-server";
import { bulkDownloadHandler } from "./bulk-download-handler";
import { dbMiddleware } from "./db-middleware";
import { staticFileHandler } from "./static-file-handler";
import { trpcHandler } from "./trpc-handler";
import { uploadFileHandler } from "./upload-file-handler";

const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

if (!process.env.AUTH_SECRET || !process.env.AUTH_BASE_URL) {
  console.error(
    "Error: AUTH_SECRET and AUTH_BASE_URL must be set in the environment variables.",
  );
  process.exit(1);
}

export default startServer();

function startServer() {
  const app = new Hono();

  app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

  app.on(["POST", "PATCH", "DELETE", "OPTIONS", "HEAD"], "/api/upload/*", (c) =>
    tusServer.handleWeb(c.req.raw),
  );

  apply(app, [
    dbMiddleware,
    bulkDownloadHandler,
    staticFileHandler,
    uploadFileHandler,
    trpcHandler("/api/trpc"),
  ]);

  return serve(app, {
    port,
    hostname: "0.0.0.0",
  });
}
