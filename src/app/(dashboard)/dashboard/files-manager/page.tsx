import { Suspense } from "react";
import { FilesTableSkeleton } from "@/components/files-manager/files-table-skeleton";
import { prefetch, trpc } from "@/trpc/server";
import { FilesManagerContent } from "./files-manager-content";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    sortBy?: string;
    sortDir?: string;
    folderId?: string;
  }>;
}

export default async function FilesManagerPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const search = params.search ?? "";
  const sortBy = params.sortBy || "createdAt";
  const sortDir = (params.sortDir || "desc") as "asc" | "desc";
  const folderId = params.folderId || undefined;

  prefetch(
    trpc.user.getFiles.queryOptions({
      page,
      pageSize,
      search,
      sortBy,
      sortDir,
      folderId,
    }),
  );
  prefetch(
    trpc.user.getFolders.queryOptions({
      parentId: folderId,
      page: 1,
      pageSize: 20,
      search: params.search || undefined,
    }),
  );
  if (folderId) {
    prefetch(trpc.user.getFolder.queryOptions({ id: folderId }));
  }

  return (
    <Suspense fallback={<FilesTableSkeleton />}>
      <FilesManagerContent />
    </Suspense>
  );
}
