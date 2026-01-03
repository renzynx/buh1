"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { FileIcon, FolderOpen, HardDrive, Mail, Upload } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { RecentFilesCard } from "@/components/dashboard/recent-files-card";
import { StatsCard } from "@/components/dashboard/stats-card";
import { useSuspenseSession } from "@/hooks/use-session";
import { formatBytes } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

export function DashboardContent() {
  const { data: session } = useSuspenseSession();
  const trpc = useTRPC();

  const { data: recentFiles, isPending: isFilesPending } = useSuspenseQuery(
    trpc.user.getFiles.queryOptions({
      page: 1,
      pageSize: 5,
      sortBy: "createdAt",
      sortDir: "desc",
    }),
  );

  const user = session?.user;
  const quota = user?.quota;

  const usedQuota = quota?.usedQuota ?? 0;
  const maxQuota = quota?.quota ?? 0;
  const isUnlimited = maxQuota === -1;
  const percentageUsed = isUnlimited
    ? 0
    : Math.min(100, Math.round((usedQuota / maxQuota) * 100));

  const usedInvites = quota?.inviteCount ?? 0;
  const maxInvites = quota?.inviteQuota ?? 0;
  const isInvitesUnlimited = maxInvites === -1;

  return (
    <div className="space-y-8 pb-10">
      <DashboardHeader userName={user?.name} />

      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Storage"
          value={formatBytes(usedQuota)}
          icon={HardDrive}
          progress={{
            percentage: isUnlimited ? 0 : percentageUsed,
            label: isUnlimited
              ? "Unlimited storage"
              : `${percentageUsed}% of ${formatBytes(maxQuota)} used`,
          }}
        />

        <StatsCard
          title="Files"
          value={quota?.fileCount?.toLocaleString() ?? 0}
          icon={FileIcon}
          description="Total files uploaded"
          actions={[
            {
              label: "Upload",
              href: "/dashboard/uploads",
              icon: Upload,
            },
            {
              label: "Manage",
              href: "/dashboard/files-manager",
              variant: "outline",
              icon: FolderOpen,
            },
          ]}
        />

        <StatsCard
          title="Invites"
          value={usedInvites}
          icon={Mail}
          description={
            isInvitesUnlimited
              ? "Unlimited invites remaining"
              : `${Math.max(0, maxInvites - usedInvites)} remaining`
          }
          actions={[
            {
              label: "Manage Invites",
              href: "/dashboard/invites",
              variant: "secondary",
            },
          ]}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-1">
        <RecentFilesCard
          files={recentFiles?.items}
          isPending={isFilesPending}
        />
      </div>
    </div>
  );
}
