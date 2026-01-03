import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import {
  Ban,
  CircleSlash,
  Gem,
  Hammer,
  MoreHorizontal,
  Trash2,
  UserPen,
  VenetianMask,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DatabaseUser } from "@/database/schema";
import { BanDetailsCard } from "./ban-details-card";

interface GetColumnsProps {
  currentUserId?: string;
  currentUserRole: string;
  isCurrentlyImpersonating: boolean;
  onEdit: (user: DatabaseUser) => void;
  onDelete: (userId: string) => void;
  onBan: (user: DatabaseUser) => void;
  onUnban: (userId: string) => void;
  onImpersonate: (user: DatabaseUser) => void;
  onSetRole: (userId: string, role: "superadmin" | "admin" | "user") => void;
}

export const getColumns = ({
  currentUserId,
  currentUserRole,
  isCurrentlyImpersonating,
  onEdit,
  onDelete,
  onBan,
  onUnban,
  onImpersonate,
  onSetRole,
}: GetColumnsProps): ColumnDef<DatabaseUser>[] => [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ getValue }) => (
      <span className="font-medium">{getValue() as string}</span>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ getValue }) => {
      const role = getValue() as string;
      if (role === "superadmin") {
        return (
          <Badge variant="default" className="bg-purple-600">
            Superadmin
          </Badge>
        );
      }
      if (role === "admin") {
        return <Badge variant="default">Admin</Badge>;
      }
      return <Badge variant="secondary">User</Badge>;
    },
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const user = row.original;
      if (user.banned) {
        return <BanDetailsCard user={user} />;
      }
      if (user.emailVerified) {
        return (
          <Badge variant="default" className="bg-green-600">
            Verified
          </Badge>
        );
      }
      return <Badge variant="outline">Unverified</Badge>;
    },
  },
  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ getValue }) => {
      const val = getValue() as string | Date | null;
      return val ? format(new Date(val), "PPp") : "-";
    },
  },
  {
    id: "actions",
    header: "",
    enableSorting: false,
    cell: ({ row }) => {
      const user = row.original;

      // Impersonation logic
      const cannotImpersonate =
        isCurrentlyImpersonating ||
        user.id === currentUserId ||
        user.banned ||
        (currentUserRole === "admin" && user.role === "superadmin");

      let impersonateReason: string | null = null;
      if (isCurrentlyImpersonating)
        impersonateReason = "(Already impersonating)";
      else if (user.id === currentUserId)
        impersonateReason = "(Cannot impersonate yourself)";
      else if (currentUserRole === "admin" && user.role === "superadmin")
        impersonateReason = "(Insufficient permissions)";
      else if (user.banned) impersonateReason = "(User is banned)";

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onImpersonate(user)}
              disabled={cannotImpersonate}
              className={
                cannotImpersonate ? "opacity-50 cursor-not-allowed" : ""
              }
            >
              <VenetianMask className="mr-2 h-4 w-4" />
              Impersonate
              {cannotImpersonate && impersonateReason && (
                <span className="ml-2 text-xs text-muted-foreground">
                  {impersonateReason}
                </span>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Role Management */}
            {user.id === currentUserId ? (
              <DropdownMenuItem disabled className="opacity-50">
                Cannot change own role
              </DropdownMenuItem>
            ) : (
              <>
                {user.role === "superadmin" &&
                  currentUserRole === "superadmin" && (
                    <>
                      <DropdownMenuItem
                        onClick={() => onSetRole(user.id, "admin")}
                      >
                        <Hammer className="mr-2 h-4 w-4" />
                        Demote to Admin
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onSetRole(user.id, "user")}
                      >
                        <Hammer className="mr-2 h-4 w-4" />
                        Demote to User
                      </DropdownMenuItem>
                    </>
                  )}
                {user.role === "admin" && (
                  <DropdownMenuItem onClick={() => onSetRole(user.id, "user")}>
                    <Hammer className="mr-2 h-4 w-4" />
                    Demote to User
                  </DropdownMenuItem>
                )}
                {user.role !== "admin" &&
                  user.role !== "superadmin" &&
                  currentUserRole === "superadmin" && (
                    <DropdownMenuItem
                      onClick={() => onSetRole(user.id, "admin")}
                    >
                      <Gem className="mr-2 h-4 w-4" />
                      Promote to Admin
                    </DropdownMenuItem>
                  )}
              </>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(user)}>
              <UserPen className="mr-2 h-4 w-4" />
              Edit User
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {/* Ban / Delete */}
            {currentUserRole === "superadmin" &&
              (user.banned ? (
                <DropdownMenuItem onClick={() => onUnban(user.id)}>
                  <CircleSlash className="mr-2 h-4 w-4" />
                  Unban User
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  onClick={() => onBan(user)}
                  className="text-destructive focus:text-destructive"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Ban User
                </DropdownMenuItem>
              ))}
            <DropdownMenuItem
              onClick={() => onDelete(user.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete User
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 50,
  },
];
