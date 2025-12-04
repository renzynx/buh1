import type { ColumnDef, SortingFn } from "@tanstack/react-table";
import { format } from "date-fns";
import type { Dispatch, SetStateAction } from "react";
import type { FileRow } from "@/lib/types";
import { formatBytes } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { FileActions } from "./files-action";

export type GetColumnsOptions = {
  fuzzySort: SortingFn<FileRow>;
  rowSelection: Record<string, boolean>;
  setRowSelection: Dispatch<SetStateAction<Record<string, boolean>>>;
  setDeleteFileIds: (ids: string[]) => void;
  setPreviewFile: (f: FileRow | null) => void;
  setShareFile: (f: FileRow | null) => void;
};

export function getColumns({
  fuzzySort,
  rowSelection,
  setRowSelection,
  setDeleteFileIds,
  setPreviewFile,
  setShareFile,
}: GetColumnsOptions): ColumnDef<FileRow, unknown>[] {
  return [
    {
      id: "select",
      header: ({ table }) => {
        const rows = table.getRowModel().rows;
        const allSelected =
          rows.length > 0 && rows.every((r) => Boolean(rowSelection[r.id]));
        const someSelected = rows.some((r) => Boolean(rowSelection[r.id]));
        return (
          <Checkbox
            checked={
              allSelected ? true : someSelected ? "indeterminate" : false
            }
            onCheckedChange={(v: boolean | "indeterminate") => {
              if (v) {
                const next: Record<string, boolean> = {};
                rows.forEach((r) => {
                  next[r.id] = true;
                });
                setRowSelection(next);
              } else {
                setRowSelection((prev) => {
                  const next = { ...prev };
                  rows.forEach((r) => {
                    delete next[r.id];
                  });
                  return next;
                });
              }
            }}
          />
        );
      },
      cell: ({ row }) => (
        <Checkbox
          checked={Boolean(rowSelection[row.id])}
          onCheckedChange={(v: boolean | "indeterminate") => {
            setRowSelection((prev) => {
              const next = { ...prev };
              if (v) next[row.id] = true;
              else delete next[row.id];
              return next;
            });
          }}
        />
      ),
    },
    {
      accessorKey: "filename",
      header: "Filename",
      cell: (info) => info.getValue(),
      sortingFn: fuzzySort,
    },
    {
      accessorKey: "size",
      header: "Size",
      cell: (info) => formatBytes(Number(info.getValue())),
      enableSorting: true,
    },
    {
      accessorKey: "mimeType",
      header: "MIME Type",
    },
    {
      accessorKey: "createdAt",
      header: "Created At",
      cell: (info) => format(new Date(info.getValue() as string), "PP pp"),
      enableSorting: true,
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <FileActions
          file={row.original}
          onDelete={(ids) => setDeleteFileIds(ids)}
          onPreview={(f) => setPreviewFile(f)}
          onShare={(f) => setShareFile(f)}
        />
      ),
    },
  ];
}
