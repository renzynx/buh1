import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { prefetch, trpc } from "@/trpc/server";
import { AdminFilesContent } from "./admin-files-content";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}

export default async function AdminFilesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const search = params.search || "";
  const searchField = (params.status || "filename") as
    | "filename"
    | "id"
    | "userName"
    | "userEmail";
  const sortBy = params.sortBy || "createdAt";
  const sortDir = (params.sortDir || "desc") as "asc" | "desc";

  prefetch(
    trpc.admin.getAllFiles.queryOptions({
      page,
      pageSize,
      search,
      searchField,
      sortBy,
      sortDir,
    }),
  );

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <AdminFilesContent />
    </Suspense>
  );
}
