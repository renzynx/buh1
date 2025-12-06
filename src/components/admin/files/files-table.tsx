import { useSuspenseQuery } from "@tanstack/react-query";
import type { SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Loading } from "@/components/loading";
import { Button } from "@/components/ui/button";
import { DebouncedInput } from "@/components/ui/debounced-input";
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
import { useQueryParams } from "@/hooks/use-query-params";
import { useTRPC } from "@/trpc/client";
import { type AdminFileRow, getColumns } from "./files-columns";

const DeleteFilesDialog = lazy(() =>
  import("@/components/files-manager/dialogs/delete-files-dialog").then(
    (module) => ({
      default: module.DeleteFilesDialog,
    }),
  ),
);

export function FilesTable() {
  const { params, setQueryParams } = useQueryParams();
  const trpc = useTRPC();
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [deleteFileIds, setDeleteFileIds] = useState<string[]>([]);

  const pageIndex = (params.page ?? 1) - 1;
  const pageSize = params.pageSize ?? 10;

  const [search, setSearch] = useState(params.search ?? "");
  const [searchField, setSearchField] = useState(params.status ?? "filename");

  useEffect(() => {
    setSearch(params.search ?? "");
    if (params.status && params.status !== "all") {
      setSearchField(params.status);
    } else if (!params.status) {
      setSearchField("filename");
    }
  }, [params.search, params.status]);

  const sorting: SortingState = useMemo(
    () =>
      params.sortBy
        ? [{ id: params.sortBy, desc: params.sortDir === "desc" }]
        : [{ id: "createdAt", desc: true }],
    [params.sortBy, params.sortDir],
  );

  const buildParams = React.useCallback(
    (
      pIndex: number,
      pSize: number,
      searchQuery: string,
      sField: string,
      sort: SortingState,
    ) => {
      const sortState = sort?.[0];
      return {
        page: pIndex + 1,
        pageSize: pSize,
        search: searchQuery,
        searchField: sField as "filename" | "id" | "userName" | "userEmail",
        sortBy: sortState?.id,
        sortDir: sortState?.id ? (sortState.desc ? "desc" : "asc") : undefined,
      } as const;
    },
    [],
  );

  const queryOptions = trpc.admin.getAllFiles.queryOptions({
    ...buildParams(pageIndex, pageSize, search, searchField, sorting),
  });

  const { data } = useSuspenseQuery(queryOptions);

  const updateUrl = React.useCallback(
    (
      pIndex: number,
      pSize: number,
      searchQuery: string,
      sField: string,
      sort: SortingState,
    ) => {
      const newParams = buildParams(pIndex, pSize, searchQuery, sField, sort);
      setQueryParams({
        ...(params ?? {}),
        page: newParams.page,
        pageSize: newParams.pageSize,
        search: newParams.search || undefined,
        status:
          newParams.searchField !== "filename"
            ? newParams.searchField
            : undefined,
        sortBy: newParams.sortBy,
        sortDir: newParams.sortDir as "asc" | "desc",
      });
    },
    [params, setQueryParams, buildParams],
  );

  const columns = useMemo(
    () =>
      getColumns({
        onDelete: setDeleteFileIds,
      }),
    [],
  );

  const table = useReactTable({
    data: (data?.items ?? []) as AdminFileRow[],
    columns,
    state: {
      sorting,
      rowSelection,
      pagination: { pageIndex, pageSize },
    },
    pageCount: data?.pageCount ?? 0,
    manualPagination: true,
    manualSorting: true,
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: (updater) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      updateUrl(0, pageSize, search, searchField, next);
    },
    getCoreRowModel: getCoreRowModel(),
  });

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);
  const mappedSelectedIds = selectedIds
    .map((index) => data?.items[parseInt(index, 10)]?.id)
    .filter((id): id is string => Boolean(id));

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
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex w-full sm:w-auto">
            <Select
              value={searchField}
              onValueChange={(val) => {
                setSearchField(val);
                updateUrl(0, pageSize, search, val, sorting);
              }}
            >
              <SelectTrigger className="w-[130px] rounded-r-none border-r-0 focus:ring-0">
                <SelectValue placeholder="Filter by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="filename">Filename</SelectItem>
                <SelectItem value="id">File ID</SelectItem>
                <SelectItem value="userName">User Name</SelectItem>
                <SelectItem value="userEmail">User Email</SelectItem>
              </SelectContent>
            </Select>
            <DebouncedInput
              value={search}
              onChange={(val) => {
                const newVal = String(val);
                if (newVal !== search) {
                  updateUrl(0, pageSize, newVal, searchField, sorting);
                }
              }}
              placeholder="Search..."
              className="w-full sm:w-64 rounded-l-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          {mappedSelectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setDeleteFileIds(mappedSelectedIds)}
              className="whitespace-nowrap w-full sm:w-auto"
            >
              Delete ({mappedSelectedIds.length})
            </Button>
          )}
        </div>

        <div className="text-sm text-muted-foreground whitespace-nowrap self-start md:self-center">
          {data?.total ?? 0} total file{data?.total !== 1 ? "s" : ""}
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        {deleteFileIds.length > 0 && (
          <DeleteFilesDialog
            fileIds={deleteFileIds}
            onClose={() => setDeleteFileIds([])}
            onDeleted={() => {
              setRowSelection({});
              updateUrl(pageIndex, pageSize, search, searchField, sorting);
            }}
          />
        )}
      </Suspense>

      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="bg-muted/50 hover:bg-muted/50"
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder ? null : (
                        <div
                          {...{
                            className: header.column.getCanSort()
                              ? "cursor-pointer select-none flex items-center gap-1 hover:text-foreground transition-colors"
                              : "",
                            onClick: header.column.getToggleSortingHandler(),
                          }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {{
                            asc: <ChevronUp className="h-4 w-4" />,
                            desc: <ChevronDown className="h-4 w-4" />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
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
                  className="h-24 text-center text-muted-foreground"
                >
                  No files found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.pageCount > 0 && (
        <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-4 pt-2">
          <Pagination className="justify-start w-auto mx-0">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPageNum > 1) {
                      updateUrl(
                        pageIndex - 1,
                        pageSize,
                        search,
                        searchField,
                        sorting,
                      );
                    }
                  }}
                  aria-disabled={currentPageNum <= 1}
                  className={
                    currentPageNum <= 1 ? "pointer-events-none opacity-50" : ""
                  }
                />
              </PaginationItem>

              {visiblePages.map((p, i) =>
                p === -1 ? (
                  <PaginationItem key={`ellipsis-${i}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={p}>
                    <PaginationLink
                      href="#"
                      isActive={p === currentPageNum}
                      onClick={(e) => {
                        e.preventDefault();
                        updateUrl(
                          p - 1,
                          pageSize,
                          search,
                          searchField,
                          sorting,
                        );
                      }}
                    >
                      {p}
                    </PaginationLink>
                  </PaginationItem>
                ),
              )}

              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (currentPageNum < pageCount) {
                      updateUrl(
                        pageIndex + 1,
                        pageSize,
                        search,
                        searchField,
                        sorting,
                      );
                    }
                  }}
                  aria-disabled={currentPageNum >= pageCount}
                  className={
                    currentPageNum >= pageCount
                      ? "pointer-events-none opacity-50"
                      : ""
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-muted-foreground whitespace-nowrap">
              Rows per page
            </p>
            <Select
              value={`${pageSize}`}
              onValueChange={(value) => {
                updateUrl(0, Number(value), search, searchField, sorting);
              }}
            >
              <SelectTrigger className="h-8 w-[70px]">
                <SelectValue placeholder={pageSize} />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 30, 40, 50].map((size) => (
                  <SelectItem key={size} value={`${size}`}>
                    {size}
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
