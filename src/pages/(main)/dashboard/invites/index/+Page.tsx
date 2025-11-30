import { lazy, Suspense } from "react";
import { InvitesTable } from "@/components/invites/invites-table";
import { InvitesTableSkeleton } from "@/components/invites/invites-table-skeleton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const CreateInviteDialog = lazy(() =>
  import("@/components/invites/create-invite-dialog").then((module) => ({
    default: module.CreateInviteDialog,
  })),
);

export default function Page() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invites</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage invite codes for new users
          </p>
        </div>
        <Suspense fallback={<Button isLoading />}>
          <CreateInviteDialog />
        </Suspense>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Invites</CardTitle>
          <CardDescription>
            View and manage all invites you've created
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<InvitesTableSkeleton />}>
            <InvitesTable />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
