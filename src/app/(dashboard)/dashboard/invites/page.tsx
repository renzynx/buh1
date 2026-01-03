import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { prefetch, trpc } from "@/trpc/server";
import { InvitesContent } from "./invites-content";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    status?: string;
    sortBy?: string;
    sortDir?: string;
  }>;
}

export default async function InvitesPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const page = Number(params.page ?? 1);
  const pageSize = Number(params.pageSize ?? 10);
  const status = (params.status || "all") as
    | "all"
    | "active"
    | "used"
    | "expired";
  const sortBy = params.sortBy || "createdAt";
  const sortDir = (params.sortDir || "desc") as "asc" | "desc";

  prefetch(
    trpc.user.getInvites.queryOptions({
      page,
      pageSize,
      status,
      sortBy,
      sortDir,
    }),
  );

  return (
    <Suspense fallback={<Skeleton className="h-96 w-full" />}>
      <InvitesContent />
    </Suspense>
  );
}
