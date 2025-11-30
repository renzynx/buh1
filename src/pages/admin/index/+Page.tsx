import { useQueries } from "@tanstack/react-query";
import {
  OverviewStats,
  SecondaryStats,
  TopUsersGrid,
} from "@/components/admin/analytics/all-stats";
import { AnalyticsSkeleton } from "@/components/admin/analytics/analytics-skeleton";
import { RecentActivityCard } from "@/components/admin/analytics/recent-activities";
import { useTRPC } from "@/trpc/client";

export default function Page() {
  const trpc = useTRPC();

  const [
    { data: analytics, isLoading: analyticsLoading },
    { data: topUsers, isLoading: topUsersLoading },
    { data: recentActivity, isLoading: recentActivityLoading },
  ] = useQueries({
    queries: [
      trpc.admin.getAnalytics.queryOptions(),
      trpc.admin.getTopUsers.queryOptions({ limit: 5 }),
      trpc.admin.getRecentActivity.queryOptions({ limit: 5 }),
    ],
  });

  if (analyticsLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            System-wide statistics and insights
          </p>
        </div>
        <AnalyticsSkeleton />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load analytics data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">
          System-wide statistics and insights
        </p>
      </div>

      <OverviewStats analytics={analytics} />

      <SecondaryStats analytics={analytics} />

      <TopUsersGrid topUsers={topUsers} isLoading={topUsersLoading} />

      <RecentActivityCard
        activity={recentActivity}
        isLoading={recentActivityLoading}
      />
    </div>
  );
}
