import type { Metadata } from "next";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { prefetch, trpc } from "@/trpc/server";
import { DashboardContent } from "./dashboard-content";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  prefetch(
    trpc.user.getFiles.queryOptions({
      page: 1,
      pageSize: 5,
      sortBy: "createdAt",
      sortDir: "desc",
    }),
  );

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
