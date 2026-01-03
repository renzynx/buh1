"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ShareXConfigCard = dynamic(
  () =>
    import("@/components/settings/sharex-config-card").then(
      (mod) => mod.ShareXConfigCard,
    ),
  { ssr: false },
);

function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-48 w-full rounded-xl" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Dashboard Settings
        </h1>
        <p className="text-muted-foreground mt-1">
          Configure your dashboard experience and tools.
        </p>
      </div>

      <Suspense fallback={<SettingsSkeleton />}>
        <div className="space-y-6">
          <ShareXConfigCard />
        </div>
      </Suspense>
    </div>
  );
}
