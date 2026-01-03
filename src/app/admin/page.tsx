import { Suspense } from "react";
import { AnalyticsSkeleton } from "@/components/admin/analytics/analytics-skeleton";
import { prefetch, trpc } from "@/trpc/server";
import { AdminAnalyticsContent } from "./admin-analytics-content";

export default async function AdminPage() {
  await Promise.all([
    prefetch(trpc.admin.getAnalytics.queryOptions()),
    prefetch(trpc.admin.getTopUsers.queryOptions({ limit: 5 })),
    prefetch(trpc.admin.getRecentActivity.queryOptions({ limit: 5 })),
  ]);

  return (
    <Suspense fallback={<AnalyticsSkeleton />}>
      <AdminAnalyticsContent />
    </Suspense>
  );
}
