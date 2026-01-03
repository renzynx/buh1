import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import {
  Activity,
  Database,
  FileText,
  HardDrive,
  Mail,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { AnalyticsData } from "@/lib/analytics";
import type { RouterOutput } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { StatCard } from "./stats-card";

type TopUsersData = RouterOutput["admin"]["getTopUsers"];

export function OverviewStats({ analytics }: { analytics: AnalyticsData }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Users"
        value={analytics.users.total.toLocaleString()}
        subtitle={`${analytics.users.active.toLocaleString()} active`}
        icon={Users}
        trend={{ value: `+${analytics.users.new}` }}
      />
      <StatCard
        title="Total Files"
        value={analytics.files.total.toLocaleString()}
        subtitle="Uploaded by users"
        icon={FileText}
        trend={{ value: `+${analytics.files.new}` }}
      />
      <StatCard
        title="Storage Used"
        value={formatBytes(analytics.storage.total)}
        subtitle="Across all users"
        icon={HardDrive}
        trend={{ value: formatBytes(analytics.storage.growth) }}
      />
      <StatCard
        title="Invites"
        value={analytics.invites.total.toLocaleString()}
        subtitle={`${analytics.invites.active} active`}
        icon={Mail}
      />
    </div>
  );
}

export function SecondaryStats({ analytics }: { analytics: AnalyticsData }) {
  const inviteUsageRate = useMemo(() => {
    if (!analytics?.invites.total) return 0;
    return ((analytics.invites.used / analytics.invites.total) * 100).toFixed(
      1,
    );
  }, [analytics]);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="New Users"
        value={analytics.users.new.toLocaleString()}
        subtitle="Last 30 days"
        icon={TrendingUp}
      />
      <StatCard
        title="Active Users"
        value={analytics.users.active.toLocaleString()}
        subtitle="Currently online"
        icon={Activity}
      />
      <StatCard
        title="Banned Users"
        value={analytics.users.banned.toLocaleString()}
        subtitle="Account suspended"
        icon={Users}
      />
      <StatCard
        title="Invite Usage"
        value={`${inviteUsageRate}%`}
        subtitle={`${analytics.invites.used} of ${analytics.invites.total} used`}
        icon={Database}
      />
    </div>
  );
}

export function TopUserList({
  title,
  description,
  items,
  loading,
  valueFormatter,
}: {
  title: string;
  description: string;
  items: TopUsersData["byFiles"] | TopUsersData["byStorage"] | undefined;
  loading: boolean;
  valueFormatter: (
    item: TopUsersData["byFiles"][number] | TopUsersData["byStorage"][number],
  ) => string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16 shrink-0" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {items?.map((item, index) => (
              <div
                key={item.user?.id ?? index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={item.user?.image ?? undefined} />
                    <AvatarFallback>
                      {item.user?.name?.charAt(0).toUpperCase() ?? "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {item.user?.name ?? "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.user?.email ?? "No email"}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="secondary"
                  className="shrink-0 whitespace-nowrap"
                >
                  {valueFormatter(item)}
                </Badge>
              </div>
            ))}
            {(!items || items.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No data available
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function TopUsersGrid({
  topUsers,
  isLoading,
}: {
  topUsers: TopUsersData | undefined;
  isLoading: boolean;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <TopUserList
        title="Top Users by Files"
        description="Users with the most uploaded files"
        items={topUsers?.byFiles}
        loading={isLoading}
        // @ts-expect-error
        valueFormatter={(item) => `${item.fileCount} files`}
      />
      <TopUserList
        title="Top Users by Storage"
        description="Users with the most storage used"
        items={topUsers?.byStorage}
        loading={isLoading}
        // @ts-expect-error
        valueFormatter={(item) => formatBytes(item.usedQuota)}
      />
    </div>
  );
}
