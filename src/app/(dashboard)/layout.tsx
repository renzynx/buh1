import { redirect } from "next/navigation";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { HydrateClient, prefetchSession } from "@/trpc/server";
import { DashboardShell } from "./dashboard-shell";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await prefetchSession();

  if (!session) {
    const message = encodeURIComponent(
      "You must be signed in to access this page!",
    );
    redirect(`/auth/sign-in?message=${message}&redirectTo=/dashboard`);
  }

  const appName = process.env.APP_NAME ?? "Buh";
  const isAdmin =
    session.user.role === "admin" || session.user.role === "superadmin";

  return (
    <HydrateClient>
      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardShell appName={appName} isAdmin={isAdmin} session={session}>
          {children}
        </DashboardShell>
      </Suspense>
    </HydrateClient>
  );
}
