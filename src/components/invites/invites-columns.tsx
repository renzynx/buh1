import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Copy, MoreHorizontal, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type InviteStatus = "active" | "used" | "expired";

export type InviteRow = {
  code: string;
  status: InviteStatus;
  createdAt: string | Date | null;
  expiresAt: string | Date | null;
  usedByEmail: string | null;
  usedByName: string | null;
  usedAt: string | Date | null;
};

export const getColumns = ({
  onCopy,
  onDelete,
}: {
  onCopy: (code: string) => void;
  onDelete: (code: string) => void;
}): ColumnDef<InviteRow>[] => [
  {
    accessorKey: "code",
    header: "Code",
    cell: ({ getValue }) => (
      <span
        title="Hover or focus to reveal"
        className="inline-block blur-sm hover:blur-none focus:blur-none transition duration-150 select-all cursor-default font-mono text-sm"
      >
        {getValue() as string}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => {
      const status = getValue() as InviteStatus;
      switch (status) {
        case "active":
          return <Badge variant="default">Active</Badge>;
        case "used":
          return <Badge variant="secondary">Used</Badge>;
        case "expired":
          return <Badge variant="destructive">Expired</Badge>;
        default:
          return null;
      }
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ getValue }) => {
      const val = getValue() as string | Date | null;
      return val ? format(new Date(val), "PPp") : "-";
    },
  },
  {
    accessorKey: "expiresAt",
    header: "Expires",
    cell: ({ getValue }) => {
      const val = getValue() as string | Date | null;
      return val ? format(new Date(val), "PPp") : "Never";
    },
  },
  {
    id: "usedBy",
    header: "Used By",
    cell: ({ row }) => {
      const { usedByEmail, usedByName } = row.original;
      if (!usedByEmail) return "-";
      return (
        <div>
          <div className="font-medium">{usedByName}</div>
          <div className="text-sm text-muted-foreground">{usedByEmail}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "usedAt",
    header: "Used At",
    cell: ({ getValue }) => {
      const val = getValue() as string | Date | null;
      return val ? format(new Date(val), "PPp") : "-";
    },
  },
  {
    id: "actions",
    enableSorting: false,
    header: "",
    cell: ({ row }) => {
      const invite = row.original;
      return (
        <div className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onCopy(invite.code)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Code
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete(invite.code)}
                disabled={invite.status === "used"}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    size: 50,
  },
];
