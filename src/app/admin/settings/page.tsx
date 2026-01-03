"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const FilesSettingsCard = dynamic(
  () =>
    import("@/components/admin/settings/files-settings-card").then(
      (mod) => mod.FilesSettingsCard,
    ),
  { ssr: false },
);
const GeneralSettingsCard = dynamic(
  () =>
    import("@/components/admin/settings/general-settings-card").then(
      (mod) => mod.GeneralSettingsCard,
    ),
  { ssr: false },
);
const InvitesSettingsCard = dynamic(
  () =>
    import("@/components/admin/settings/invites-settings-card").then(
      (mod) => mod.InvitesSettingsCard,
    ),
  { ssr: false },
);

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Manage global application settings and configurations.
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <div className="space-y-6">
          <GeneralSettingsCard />
          <FilesSettingsCard />
          <InvitesSettingsCard />
        </div>
      </Suspense>
    </div>
  );
}
