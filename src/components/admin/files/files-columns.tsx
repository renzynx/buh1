import type { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { Download, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { RouterOutput } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";

export type AdminFileRow =
  RouterOutput["admin"]["getAllFiles"]["items"][number];

interface GetColumnsProps {
  onDelete: (ids: string[]) => void;
}

export const getColumns = ({
  onDelete,
}: GetColumnsProps): ColumnDef<AdminFileRow>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) =>
          table.toggleAllPageRowsSelected(Boolean(value))
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 40,
  },
  {
    accessorKey: "filename",
    header: "Filename",
    cell: ({ row }) => (
      <div className="flex flex-col min-w-[200px] max-w-[400px]">
        <span className="font-medium truncate" title={row.original.filename}>
          {row.original.filename}
        </span>
        <span className="text-xs text-muted-foreground font-mono truncate">
          {row.original.id}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "user",
    header: "Owner",
    cell: ({ row }) => {
      const user = row.original.user;
      return user ? (
        <div className="flex flex-col">
          <span className="text-sm font-medium truncate">{user.name}</span>
          <span className="text-xs text-muted-foreground truncate">
            {user.email}
          </span>
        </div>
      ) : (
        <Badge variant="outline" className="text-muted-foreground">
          Deleted User
        </Badge>
      );
    },
  },
  {
    accessorKey: "size",
    header: "Size",
    cell: ({ row }) => (
      <span className="whitespace-nowrap">
        {formatBytes(row.original.size)}
      </span>
    ),
  },
  {
    accessorKey: "mimeType",
    header: "Type",
    cell: ({ row }) => (
      <Badge variant="secondary" className="font-mono text-xs font-normal">
        {row.original.mimeType}
      </Badge>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Uploaded",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-muted-foreground">
        {format(new Date(row.original.createdAt), "PP p")}
      </span>
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const { settings } = useSettings();

      const file = row.original;
      return (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              const link = document.createElement("a");
              link.href = `${settings.cdnUrl || ""}/api/f/${file.encodedId}`;
              link.download = file.filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">Download</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => onDelete([file.id])}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only">Delete</span>
          </Button>
        </div>
      );
    },
    size: 100,
  },
];
