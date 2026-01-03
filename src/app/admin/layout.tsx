import { redirect } from "next/navigation";
import { HydrateClient, prefetchSession } from "@/trpc/server";
import { AdminShell } from "./admin-shell";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await prefetchSession();

  if (!session) {
    redirect("/auth/sign-in");
  }

  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    redirect("/dashboard");
  }

  return (
    <HydrateClient>
      <AdminShell session={session}>{children}</AdminShell>
    </HydrateClient>
  );
}
