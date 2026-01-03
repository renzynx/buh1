import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import type { RouterOutput } from "@/lib/types";
import { formatBytes } from "@/lib/utils";

type RecentActivity = RouterOutput["admin"]["getRecentActivity"];

export function ActivityUserItem({
  user,
}: {
  user: RecentActivity["users"][number];
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={user.image ?? undefined} />
          <AvatarFallback>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
        {formatDistanceToNow(user.createdAt, { addSuffix: true })}
      </span>
    </div>
  );
}

export function ActivityFileItem({
  file,
}: {
  file: RecentActivity["files"][number];
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.filename}</p>
        <p className="text-xs text-muted-foreground truncate">
          by {file.user.name} • {formatBytes(file.size)}
        </p>
      </div>
      <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0 ml-auto">
        {formatDistanceToNow(file.createdAt, { addSuffix: true })}
      </span>
    </div>
  );
}

export function ActivityInviteItem({
  invite,
}: {
  invite: RecentActivity["invites"][number];
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium font-mono truncate">{invite.code}</p>
        <p className="text-xs text-muted-foreground truncate">
          by {invite.creator?.name ?? "System"}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <Badge variant={invite.usedAt ? "default" : "secondary"}>
          {invite.usedAt ? "Used" : "Active"}
        </Badge>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDistanceToNow(invite.createdAt, { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}

export function RecentActivityCard({
  activity,
  isLoading,
}: {
  activity: RecentActivity | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest users, files, and invites</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-5 w-24 mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <Skeleton key={j} className="h-12 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Recent Users */}
            <div>
              <h3 className="text-sm font-medium mb-4">Recent Users</h3>
              <div className="space-y-3">
                {activity?.users?.slice(0, 3).map((user) => (
                  <ActivityUserItem key={user.id} user={user} />
                ))}
                {(!activity?.users || activity.users.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent users
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Recent Files */}
            <div>
              <h3 className="text-sm font-medium mb-4">Recent Files</h3>
              <div className="space-y-3">
                {activity?.files?.slice(0, 3).map((file) => (
                  <ActivityFileItem key={file.id} file={file} />
                ))}
                {(!activity?.files || activity.files.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent files
                  </p>
                )}
              </div>
            </div>

            <Separator />

            {/* Recent Invites */}
            <div>
              <h3 className="text-sm font-medium mb-4">Recent Invites</h3>
              <div className="space-y-3">
                {activity?.invites?.slice(0, 3).map((invite) => (
                  <ActivityInviteItem key={invite.code} invite={invite} />
                ))}
                {(!activity?.invites || activity.invites.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No recent invites
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
