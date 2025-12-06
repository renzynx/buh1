import type { RankingInfo } from "@tanstack/match-sorter-utils";
import { rankItem } from "@tanstack/match-sorter-utils";
import { useSuspenseQuery } from "@tanstack/react-query";
import type {
  ColumnFiltersState,
  FilterFn,
  SortingState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useClipboard } from "@/hooks/use-clipboard";
import { useQueryParams } from "@/hooks/use-query-params";
import { useSession } from "@/hooks/use-session";
import { useSettings } from "@/stores/settings-store";
import { useTRPC } from "@/trpc/client";
import { Loading } from "../loading";
import {
  getColumns,
  type InviteRow,
  type InviteStatus,
} from "./invites-columns";

const DeleteInviteDialog = lazy(() =>
  import("@/components/invites/delete-invite-dialog").then((module) => ({
    default: module.DeleteInviteDialog,
  })),
);

declare module "@tanstack/react-table" {
  interface FilterMeta {
    itemRank: RankingInfo;
  }
}

export function InvitesTable() {
  const { params, setQueryParams } = useQueryParams();
  const trpc = useTRPC();
  const { copyToClipboard } = useClipboard();
  const { settings } = useSettings();
  const { data: session } = useSession();

  const [deleteInviteCode, setDeleteInviteCode] = useState<string | null>(null);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Search state
  const [search, setSearch] = useState(params.search ?? "");

  const pageIndex = (params.page ?? 1) - 1;
  const pageSize = params.pageSize ?? 10;
  const status = (params.status as InviteStatus | "all") ?? "all";

  // biome-ignore lint/correctness/useExhaustiveDependencies: <idc>
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== (params.search ?? "")) {
        updateUrl(0, pageSize, status, sorting, search);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <idc>
  useEffect(() => {
    if (params.search !== undefined && params.search !== search) {
      setSearch(params.search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.search]);

  const sorting: SortingState = useMemo(
    () =>
      params.sortBy
        ? [{ id: params.sortBy, desc: params.sortDir === "desc" }]
        : [{ id: "createdAt", desc: true }],
    [params.sortBy, params.sortDir],
  );

  const buildParams = React.useCallback(
    (
      pIndex = pageIndex,
      pSize = pageSize,
      statusFilter = status,
      sort = sorting,
    ) => {
      const sortState = sort?.[0];
      return {
        page: pIndex + 1,
        pageSize: pSize,
        status: statusFilter,
        sortBy: sortState?.id,
        sortDir: sortState?.id ? (sortState.desc ? "desc" : "asc") : undefined,
      } as const;
    },
    [pageIndex, pageSize, status, sorting],
  );

  const { data } = useSuspenseQuery(
    trpc.user.getInvites.queryOptions({
      ...buildParams(pageIndex, pageSize, status, sorting),
    }),
  );

  const updateUrl = React.useCallback(
    (
      pIndex = pageIndex,
      pSize = pageSize,
      statusFilter = status,
      sort = sorting,
      searchQuery = search,
    ) => {
      // Get params without search
      const newParams = buildParams(pIndex, pSize, statusFilter, sort);

      // Manually add search to the URL state
      setQueryParams({
        ...(params ?? {}),
        page: newParams.page,
        pageSize: newParams.pageSize,
        status: newParams.status,
        sortBy: newParams.sortBy,
        sortDir: newParams.sortDir as "asc" | "desc",
        search: searchQuery || undefined,
      });
    },
    [
      params,
      setQueryParams,
      buildParams,
      pageIndex,
      pageSize,
      status,
      sorting,
      search,
    ],
  );

  // Client-side fuzzy filter
  const fuzzyFilter = React.useCallback<FilterFn<InviteRow>>(
    (row, columnId, value, addMeta) => {
      const itemRank = rankItem(row.getValue(columnId), value);
      addMeta({ itemRank });
      return itemRank.passed;
    },
    [],
  );

  const handleCopyCode = (code: string) => {
    copyToClipboard(code, "Invite code copied to clipboard");
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <idc>
  const columns = useMemo(
    () =>
      getColumns({
        onCopy: handleCopyCode,
        onDelete: setDeleteInviteCode,
      }),
    [],
  );

  const table = useReactTable({
    data: data?.items ?? [],
    columns,
    manualFiltering: false,
    manualPagination: true,
    manualSorting: true,
    enableSortingRemoval: false,
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: fuzzyFilter,
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      columnFilters,
      sorting,
      rowSelection,
      pagination: { pageIndex, pageSize },
      globalFilter: search,
    },
    onRowSelectionChange: setRowSelection,
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: (updater) => {
      let next: SortingState;
      if (typeof updater === "function") {
        next = updater(sorting);
      } else {
        next = updater;
      }
      updateUrl(pageIndex, pageSize, status, next, search);
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const next = updater({ pageIndex, pageSize });
        updateUrl(next.pageIndex, next.pageSize, status, sorting, search);
      } else {
        const nextPageIndex = updater.pageIndex ?? pageIndex;
        const nextPageSize = updater.pageSize ?? pageSize;
        updateUrl(nextPageIndex, nextPageSize, status, sorting, search);
      }
    },
    pageCount: data?.pageCount ?? 0,
    getCoreRowModel: getCoreRowModel(),
  });

  // Pagination Logic
  const pageCount = data?.pageCount ?? 0;
  const currentPageNum = pageIndex + 1;

  const visiblePages = useMemo(() => {
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
    <div className="space-y-4">
      {/* Header / Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <Input
          placeholder="Search invites..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-64"
        />

        <div className="flex items-center gap-4">
          <Select
            value={status}
            onValueChange={(val) => {
              updateUrl(
                0,
                pageSize,
                val as InviteStatus | "all",
                sorting,
                search,
              );
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Invites</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="used">Used</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground whitespace-nowrap">
            {data?.total ?? 0} /{" "}
            {session?.user?.quota?.inviteQuota === -1
              ? "Unlimited"
              : (session?.user?.quota?.inviteQuota ??
                settings.defaultInvitesQuota)}{" "}
            invites
          </div>
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        {deleteInviteCode && (
          <DeleteInviteDialog
            inviteCode={deleteInviteCode}
            onClose={() => setDeleteInviteCode(null)}
            onDeleted={() =>
              updateUrl(pageIndex, pageSize, status, sorting, search)
            }
          />
        )}
      </Suspense>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {header.column.getIsSorted() === "asc" ? (
                          <ChevronUp className="size-4 ml-1" />
                        ) : header.column.getIsSorted() === "desc" ? (
                          <ChevronDown className="size-4 ml-1" />
                        ) : null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="text-center py-8"
                >
                  <div className="text-muted-foreground">
                    No invites found.
                    {(status !== "all" || search) && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearch("");
                          updateUrl(0, pageSize, "all", sorting, "");
                        }}
                        className="ml-2"
                      >
                        Clear filters
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data && data.items.length > 0 && (
        <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-2">
          <div>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    size="default"
                    onClick={
                      currentPageNum > 1
                        ? () =>
                            updateUrl(
                              pageIndex - 1,
                              pageSize,
                              status,
                              sorting,
                              search,
                            )
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
                        onClick={() =>
                          updateUrl(p - 1, pageSize, status, sorting, search)
                        }
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
                        ? () =>
                            updateUrl(
                              pageIndex + 1,
                              pageSize,
                              status,
                              sorting,
                              search,
                            )
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
                updateUrl(0, Number(val), status, sorting, search);
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    Show {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
