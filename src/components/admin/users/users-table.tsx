import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import type { ColumnFiltersState, SortingState } from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronUp } from "lucide-react";
import React, { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { navigate } from "vike/client/router";
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
import type { DatabaseUser } from "@/database/schema";
import { useQueryParams } from "@/hooks/use-query-params";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { Loading } from "../../loading";
import { getColumns } from "./users-columns";

const BanUserDialog = lazy(() =>
  import("./ban-user-dialog").then((module) => ({
    default: module.BanUserDialog,
  })),
);
const DeleteUserDialog = lazy(() =>
  import("./delete-user-dialog").then((module) => ({
    default: module.DeleteUserDialog,
  })),
);
const EditUserDialog = lazy(() =>
  import("./edit-user-dialog").then((module) => ({
    default: module.EditUserDialog,
  })),
);

export function UsersTable() {
  const { params, setQueryParams } = useQueryParams();
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [userToEdit, setUserToEdit] = useState<DatabaseUser | null>(null);
  const [userToBan, setUserToBan] = useState<DatabaseUser | null>(null);

  // Table State
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});

  // Search state
  const [search, setSearch] = useState(params.search ?? "");

  const currentUserRole = session?.user?.role ?? "user";
  const currentUserId = session?.user?.id;
  const isCurrentlyImpersonating = Boolean(session?.session?.impersonatedBy);

  const pageIndex = (params.page ?? 1) - 1;
  const pageSize = params.pageSize ?? 10;

  // Setup sorting state to match URL
  const sorting: SortingState = useMemo(
    () =>
      params.sortBy
        ? [{ id: params.sortBy, desc: params.sortDir === "desc" }]
        : [{ id: "createdAt", desc: true }], // Default sort
    [params.sortBy, params.sortDir],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <idc>
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (search !== (params.search ?? "")) {
        updateUrl(0, pageSize, sorting, search);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [search]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <idc>
  useEffect(() => {
    if (params.search !== undefined && params.search !== search) {
      setSearch(params.search);
    }
  }, [params.search]);

  const buildParams = React.useCallback(
    (
      pIndex = pageIndex,
      pSize = pageSize,
      sort = sorting,
      searchQuery = search,
    ) => {
      const sortState = sort?.[0];
      return {
        page: pIndex + 1,
        pageSize: pSize,
        sortBy: sortState?.id,
        sortDir: sortState?.id ? (sortState.desc ? "desc" : "asc") : undefined,
        search: searchQuery || undefined,
      } as const;
    },
    [pageIndex, pageSize, sorting, search],
  );

  // Data Fetching
  const { data, refetch } = useSuspenseQuery({
    queryKey: ["users", buildParams(pageIndex, pageSize, sorting, search)],
    queryFn: async () => {
      const currentParams = buildParams(pageIndex, pageSize, sorting, search);
      const { data, error } = await authClient.admin.listUsers({
        query: {
          limit: currentParams.pageSize,
          offset: (currentParams.page - 1) * currentParams.pageSize,
          sortBy: currentParams.sortBy as
            | "createdAt"
            | "email"
            | "name"
            | "role",
          sortDirection: currentParams.sortDir,
          searchField: "email",
          searchValue: currentParams.search,
        },
      });

      if (error) {
        toast.error(error.message);
        return null;
      }
      return data;
    },
  });

  const updateUrl = React.useCallback(
    (
      pIndex = pageIndex,
      pSize = pageSize,
      sort = sorting,
      searchQuery = search,
    ) => {
      const newParams = buildParams(pIndex, pSize, sort, searchQuery);
      setQueryParams({
        ...(params ?? {}),
        page: newParams.page,
        pageSize: newParams.pageSize,
        sortBy: newParams.sortBy,
        sortDir: newParams.sortDir as "asc" | "desc",
        search: newParams.search,
      });
    },
    [params, setQueryParams, buildParams, pageIndex, pageSize, sorting, search],
  );

  // Mutations
  const { mutate: unbanUser } = useMutation({
    mutationFn: async ({ userId }: { userId: string }) =>
      await authClient.admin.unbanUser({ userId }),
    onMutate: () => toast.loading("Unbanning user...", { id: "unban-user" }),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error(error.message, { id: "unban-user" });
        return;
      }
      toast.info(`User ${data?.user?.email} has been unbanned 👌`, {
        id: "unban-user",
      });
      refetch();
    },
    onError: (error) => toast.error(error.message, { id: "unban-user" }),
  });

  const { mutate: setRole } = useMutation({
    mutationFn: async ({
      userId,
      role,
    }: {
      userId: string;
      role: "superadmin" | "admin" | "user";
    }) => await authClient.admin.setRole({ userId, role }),
    onMutate: () => toast.loading("Updating user role...", { id: "set-role" }),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error(error.message, { id: "set-role" });
        return;
      }
      toast.info(`User ${data?.user?.email} role updated`, { id: "set-role" });
      refetch();
    },
    onError: (error) => toast.error(error.message, { id: "set-role" }),
  });

  const { mutate: impersonateUser } = useMutation({
    mutationFn: async ({ userId }: { userId: string }) =>
      await authClient.admin.impersonateUser({ userId }),
    onMutate: () =>
      toast.loading("Impersonating...", { id: "impersonate-user" }),
    onSuccess: async ({ data, error }) => {
      if (error) {
        toast.error(error.message, { id: "impersonate-user" });
        return;
      }

      if (data) {
        toast.success(`Now impersonating ${data?.user.email}`, {
          id: "impersonate-user",
        });

        queryClient.clear();

        await navigate("/dashboard");

        return;
      }

      toast.error("Failed to impersonate user", { id: "impersonate-user" });
    },
    onError: (error) => toast.error(error.message, { id: "impersonate-user" }),
  });

  const { mutate: removeUser, isPending: isRemovingUser } = useMutation({
    mutationFn: async ({ userId }: { userId: string }) =>
      await authClient.admin.removeUser({ userId }),
    onMutate: () => toast.loading("Removing user...", { id: "remove-user" }),
    onSuccess: ({ data, error }) => {
      if (error) {
        toast.error(error.message, { id: "remove-user" });
        return;
      }
      if (data.success) {
        toast.success("User removed successfully", { id: "remove-user" });
        refetch();
        setUserToDelete(null);
      }
    },
    onError: (error) => toast.error(error.message, { id: "remove-user" }),
  });

  const handleImpersonate = (user: DatabaseUser) => {
    if (isCurrentlyImpersonating) {
      toast.error(
        "You are already impersonating a user. Stop impersonating first.",
      );
      return;
    }

    if (currentUserRole === "admin" && user.role === "superadmin") {
      toast.error("Admins cannot impersonate superadmins.");
      return;
    }

    impersonateUser({ userId: user.id });
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <idc>
  const columns = useMemo(
    () =>
      getColumns({
        currentUserId,
        currentUserRole,
        isCurrentlyImpersonating,
        onEdit: setUserToEdit,
        onDelete: setUserToDelete,
        onBan: setUserToBan,
        onUnban: (id) => unbanUser({ userId: id }),
        onImpersonate: handleImpersonate,
        onSetRole: (userId, role) => setRole({ userId, role }),
      }),
    [currentUserId, currentUserRole, isCurrentlyImpersonating],
  );

  const table = useReactTable({
    data: (data?.users ?? []) as DatabaseUser[],
    columns,
    manualPagination: true,
    manualFiltering: true, // Server-side filtering
    manualSorting: true,
    enableSortingRemoval: false,
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
      updateUrl(pageIndex, pageSize, next, search);
    },
    onPaginationChange: (updater) => {
      if (typeof updater === "function") {
        const next = updater({ pageIndex, pageSize });
        updateUrl(next.pageIndex, next.pageSize, sorting, search);
      } else {
        const nextPageIndex = updater.pageIndex ?? pageIndex;
        const nextPageSize = updater.pageSize ?? pageSize;
        updateUrl(nextPageIndex, nextPageSize, sorting, search);
      }
    },
    pageCount: data?.total ? Math.ceil(data.total / pageSize) : 0,
    getCoreRowModel: getCoreRowModel(),
  });

  // Pagination Helper
  const pageCount = table.getPageCount();
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
      {/* Header / Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
        <DebouncedInput
          value={search}
          onChange={(v) => setSearch(String(v))}
          className="w-full md:w-64"
          placeholder="Search users by email..."
        />
        <div className="text-sm text-muted-foreground">
          {data?.total ?? 0} total user{data?.total !== 1 ? "s" : ""}
        </div>
      </div>

      <Suspense fallback={<Loading />}>
        {userToDelete && (
          <DeleteUserDialog
            isLoading={isRemovingUser}
            open={Boolean(userToDelete)}
            onOpenChange={(open) => !open && setUserToDelete(null)}
            onConfirm={() => {
              if (userToDelete) {
                removeUser({ userId: userToDelete });
              }
            }}
          />
        )}
        {userToEdit && (
          <EditUserDialog
            user={userToEdit}
            open={Boolean(userToEdit)}
            onOpenChange={(open) => !open && setUserToEdit(null)}
            onSuccess={() => refetch()}
          />
        )}
        {userToBan && (
          <BanUserDialog
            userId={userToBan?.id ?? null}
            userEmail={userToBan?.email}
            open={Boolean(userToBan)}
            onOpenChange={(open) => !open && setUserToBan(null)}
            onSuccess={() => refetch()}
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
                    {search
                      ? "No users found matching your search."
                      : "No users found."}
                    {search && (
                      <Button
                        variant="link"
                        onClick={() => {
                          setSearch("");
                          updateUrl(0, pageSize, sorting, "");
                        }}
                        className="ml-2"
                      >
                        Clear search
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
      {data && data.users.length > 0 && (
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
                            updateUrl(pageIndex - 1, pageSize, sorting, search)
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
                          updateUrl(p - 1, pageSize, sorting, search)
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
                            updateUrl(pageIndex + 1, pageSize, sorting, search)
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
                updateUrl(0, Number(val), sorting, search);
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
