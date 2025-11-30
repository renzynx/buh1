import type { PageContextServer } from "vike/types";
import { db } from "@/database";
import { appRouter } from "@/trpc/router";

export type Data = Awaited<ReturnType<typeof data>>;

export async function data(pageContext: PageContextServer) {
  const urlParams = new URLSearchParams(
    pageContext.urlParsed.searchOriginal || "",
  );
  const page = Number(urlParams.get("page") ?? 1);
  const pageSize = Number(urlParams.get("pageSize") ?? 10);
  const search = urlParams.get("search") || "";
  const sortBy = urlParams.get("sortBy") || "createdAt";
  const sortDir = (urlParams.get("sortDir") || "desc") as "asc" | "desc";
  const folderId = urlParams.get("folderId") || undefined;

  const caller = appRouter.createCaller({
    db,
    session: pageContext.session,
  });

  const [files, folders, currentFolder] = await Promise.all([
    caller.user.getFiles({
      page,
      pageSize,
      search,
      sortBy,
      sortDir,
      folderId,
    }),
    caller.user.getFolders({
      parentId: folderId,
      page: 1,
      pageSize: 50,
    }),
    folderId ? caller.user.getFolder({ id: folderId }) : Promise.resolve(null),
  ]);

  return {
    files: { ...files, folderId },
    folders,
    currentFolder,
  };
}
