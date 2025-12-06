import type { RankingInfo } from "@tanstack/match-sorter-utils";
import { compareItems, rankItem } from "@tanstack/match-sorter-utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import type {
  ColumnFiltersState,
  FilterFn,
  SortingFn,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  sortingFns,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp, GripVertical } from "lucide-react";
import React, { lazy, Suspense, useState } from "react";
import { useQueryParams } from "@/hooks/use-query-params";
import type { FileRow } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { Data } from "@/pages/(main)/dashboard/files-manager/+data";
import { useTRPC } from "@/trpc/client";
import { LoadingToast } from "../loading-toast";
import { DebouncedInput } from "../ui/debounced-input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useDndContext } from "./dnd-context";
import { FilesBulkActionsBar } from "./files-bulk-actions-bar";
import { getColumns } from "./files-columns";

// Lazy load dialogs
const DeleteFilesDialog = lazy(() =>
  import("./dialogs/delete-files-dialog").then((module) => ({
    default: module.DeleteFilesDialog,
  })),
);
const FilePreviewDialog = lazy(() =>
  import("./dialogs/file-preview-dialog").then((module) => ({
    default: module.FilePreviewDialog,
  })),
);
const ShareFileDialog = lazy(() =>
  import("./dialogs/share-file-dialog").then((module) => ({
    default: module.ShareFileDialog,
  })),
);
const MoveFilesDialog = lazy(() =>
  import("./dialogs/move-files-dialog").then((module) => ({
    default: module.MoveFilesDialog,
  })),
);

declare module "@tanstack/react-table" {
  interface FilterMeta {
    itemRank: RankingInfo;
  }
}

export function FilesTable({
  initialData,
  currentFolderId,
}: {
  initialData?: Data["files"];
  currentFolderId?: string | null;
}) {
  const { params, setQueryParams } = useQueryParams();
  const [deleteFileIds, setDeleteFileIds] = useState<string[]>([]);
  const [moveFileIds, setMoveFileIds] = useState<string[]>([]);
  const [shareFile, setShareFile] = useState<FileRow | null>(null);
  const [previewFile, setPreviewFile] = useState<FileRow | null>(null);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  );
  const trpc = useTRPC();
  const { handleDragStart, handleDragEnd, isDragging } = useDndContext();

  const pageIndex = (params.page ?? 1) - 1;
  const pageSize = params.pageSize ?? 10;
  const search = params.search ?? "";

  const sorting: SortingState = React.useMemo(
    () =>
      params.sortBy
        ? [{ id: params.sortBy, desc: params.sortDir === "desc" }]
        : [{ id: "createdAt", desc: true }],
    [params.sortBy, params.sortDir],
  );

  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});

  const buildParams = React.useCallback(
    (
      pIndex = pageIndex,
      pSize = pageSize,
      searchQuery = search,
      sort = sorting,
      folderId = currentFolderId,
    ) => {
      const sortState = sort?.[0];
      return {
        page: pIndex + 1,
        pageSize: pSize,
        search: searchQuery,
        sortBy: sortState?.id,
        sortDir: sortState?.id ? (sortState.desc ? "desc" : "asc") : undefined,
        folderId: folderId,
      } as const;
    },
    [pageIndex, pageSize, search, sorting, currentFolderId],
  );

  const { data } = useSuspenseQuery(
    trpc.user.getFiles.queryOptions(
      {
        ...buildParams(pageIndex, pageSize, search, sorting, currentFolderId),
      },
      {
        initialData,
      },
    ),
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <e>
  const updateUrl = React.useCallback(
    (
      pIndex = pageIndex,
      pSize = pageSize,
      searchQuery = search,
      sort = sorting,
    ) => {
      const newParams = buildParams(pIndex, pSize, searchQuery, sort);
      setQueryParams({
        ...(params ?? {}),
        page: newParams.page,
        pageSize: newParams.pageSize,
        search: newParams.search || undefined,
        sortBy: newParams.sortBy,
        sortDir: newParams.sortDir as "asc" | "desc",
      });
    },
    [params, setQueryParams],
  );

  const fuzzyFilter = React.useCallback<FilterFn<FileRow>>(
    (row, columnId, value, addMeta) => {
      const itemRank = rankItem(row.getValue(columnId), value);
      addMeta({ itemRank });
      return itemRank.passed;
    },
    [],
  );

  const fuzzySort = React.useCallback<SortingFn<FileRow>>(
    (rowA, rowB, columnId) => {
      let dir = 0;
      if (rowA.columnFiltersMeta[columnId]) {
        dir = compareItems(
          rowA.columnFiltersMeta[columnId]?.itemRank!,
          rowB.columnFiltersMeta[columnId]?.itemRank!,
        );
      }
      return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
    },
    [],
  );

  const columns = React.useMemo(
    () =>
      getColumns({
        fuzzySort,
        rowSelection,
        setRowSelection,
        setDeleteFileIds,
        setPreviewFile,
        setShareFile,
        setMoveFileIds,
      }),
    [fuzzySort, rowSelection],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    filterFns: { fuzzy: fuzzyFilter },
    manualPagination: true,
    manualFiltering: true,
    manualSorting: true,
    enableSortingRemoval: false, // Prevent unsorted state, always toggle between asc/desc
    state: {
      columnFilters,
      globalFilter: search,
      sorting,
      rowSelection,
      pagination: { pageIndex, pageSize },
    },
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: (val) => {
      const newSearch = String(val ?? "");
      updateUrl(0, pageSize, newSearch, sorting);
    },
    onSortingChange: (updater) => {
      let next: SortingState;
      if (typeof updater === "function") {
        next = updater(sorting);
      } else {
        next = updater;
      }
      updateUrl(pageIndex, pageSize, search, next);
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const next = updater({ pageIndex, pageSize });
        updateUrl(next.pageIndex, next.pageSize, search, sorting);
      } else {
        const nextPageIndex = updater.pageIndex ?? pageIndex;
        const nextPageSize = updater.pageSize ?? pageSize;
        updateUrl(nextPageIndex, nextPageSize, search, sorting);
      }
    },
    globalFilterFn: fuzzyFilter,
    pageCount: data?.pageCount ?? 0,
    getCoreRowModel: getCoreRowModel(),
  });

  // pagination helpers
  const pageCount = data?.pageCount ?? 0;
  const currentPageNum = pageIndex + 1;

  const visiblePages = React.useMemo(() => {
    const pages: number[] = [];
    if (pageCount <= 7) {
      for (let i = 1; i <= pageCount; i++) pages.push(i);
      return pages;
    }
    pages.push(1);
    const left = Math.max(2, currentPageNum - 2);
    const right = Math.min(pageCount - 1, currentPageNum + 2);
    if (left > 2) pages.push(-1);
    for (let p = left; p <= right; p++) pages.push(p);
    if (right < pageCount - 1) pages.push(-1);
    pages.push(pageCount);
    return pages;
  }, [pageCount, currentPageNum]);

  return (
    <div>
      <div className="mb-3">
        <DebouncedInput
          value={search}
          onChange={(v) => {
            const newSearch = String(v ?? "");
            updateUrl(0, pageSize, newSearch, sorting);
          }}
          className="w-full p-2 rounded-md border"
          placeholder="Search files..."
        />
      </div>

      <FilesBulkActionsBar
        selectedIds={
          table
            ? table
                .getRowModel()
                .rows.filter((r) => Boolean(rowSelection[r.id]))
                .map((r) => (r.original as FileRow).id)
                .filter((id): id is string => id != null && id !== "")
            : []
        }
        onClear={() => setRowSelection({})}
        onDeleted={() => updateUrl(pageIndex, pageSize, search, sorting)}
      />

      <Suspense fallback={<LoadingToast />}>
        {deleteFileIds.length > 0 && (
          <DeleteFilesDialog
            fileIds={deleteFileIds}
            onClose={() => setDeleteFileIds([])}
            onDeleted={() => updateUrl(pageIndex, pageSize, search, sorting)}
          />
        )}
        {moveFileIds.length > 0 && (
          <MoveFilesDialog
            fileIds={moveFileIds}
            onClose={() => setMoveFileIds([])}
            onMoved={() => {
              setMoveFileIds([]);
              updateUrl(pageIndex, pageSize, search, sorting);
            }}
          />
        )}
        {previewFile && (
          <FilePreviewDialog file={previewFile} setFile={setPreviewFile} />
        )}
        {shareFile && (
          <ShareFileDialog file={shareFile} setFile={setShareFile} />
        )}
      </Suspense>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                <TableHead className="w-8" />
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <ChevronUp className="size-4 inline-block ml-1" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ChevronDown className="size-4 inline-block ml-1" />
                        ) : null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              const file = row.original as FileRow;
              const isSelected = Boolean(rowSelection[row.id]);
              // Determine which file IDs to drag: selected files if this file is selected, otherwise just this file
              const selectedIds = Object.keys(rowSelection).filter(
                (k) => rowSelection[k],
              );
              const dragIds =
                isSelected && selectedIds.length > 0
                  ? table
                      .getRowModel()
                      .rows.filter((r) => rowSelection[r.id])
                      .map((r) => (r.original as FileRow).id)
                  : [file.id];

              return (
                <TableRow
                  key={row.id}
                  draggable
                  onDragStart={(e) =>
                    handleDragStart(e, { type: "file", ids: dragIds })
                  }
                  onDragEnd={handleDragEnd}
                  className={cn(
                    "cursor-grab active:cursor-grabbing",
                    isDragging && "opacity-50",
                  )}
                >
                  <TableCell className="w-8">
                    <GripVertical className="size-4 text-muted-foreground" />
                  </TableCell>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="h-4" />

      <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  size="default"
                  onClick={
                    currentPageNum > 1
                      ? () => {
                          const next = currentPageNum - 1;
                          updateUrl(next - 1, pageSize, search, sorting);
                        }
                      : undefined
                  }
                  aria-disabled={currentPageNum <= 1}
                />
              </PaginationItem>

              {visiblePages.map((p, i) =>
                p === -1 ? (
                  <PaginationItem key={`e-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      size="icon"
                      isActive={p === currentPageNum}
                      onClick={() => {
                        updateUrl(p - 1, pageSize, search, sorting);
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  size="default"
                  onClick={
                    currentPageNum < pageCount
                      ? () => {
                          const next = currentPageNum + 1;
                          updateUrl(next - 1, pageSize, search, sorting);
                        }
                      : undefined
                  }
                  aria-disabled={currentPageNum >= pageCount}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

        <div className="flex items-center gap-3 mt-2 md:mt-0 w-full md:w-auto justify-center md:justify-start">
          <div className="text-sm text-muted-foreground">
            Page {currentPageNum} of {pageCount}
          </div>

          <Select
            value={String(pageSize)}
            onValueChange={(val) => {
              const next = Number(val);
              updateUrl(0, next, search, sorting);
            }}
          >
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={String(pageSize)}>
                  Show {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
