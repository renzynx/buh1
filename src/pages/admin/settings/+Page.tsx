import { lazy, Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const FilesSettingsCard = lazy(() =>
  import("@/components/admin/settings/files-settings-card").then((mod) => ({
    default: mod.FilesSettingsCard,
  })),
);
const GeneralSettingsCard = lazy(() =>
  import("@/components/admin/settings/general-settings-card").then((mod) => ({
    default: mod.GeneralSettingsCard,
  })),
);
const InvitesSettingsCard = lazy(() =>
  import("@/components/admin/settings/invites-settings-card").then((mod) => ({
    default: mod.InvitesSettingsCard,
  })),
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

export default function Page() {
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
