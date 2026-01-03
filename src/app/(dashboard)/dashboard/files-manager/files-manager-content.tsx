"use client";

import { skipToken, useQuery, useQueryClient } from "@tanstack/react-query";
import { LayoutGrid, LayoutList, RefreshCcw, Upload } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { lazy, Suspense, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { FilesGrid } from "@/components/files-manager/files-grid";
import { FilesTable } from "@/components/files-manager/files-table";
import { FilesTableSkeleton } from "@/components/files-manager/files-table-skeleton";
import {
  type BreadcrumbItem,
  FolderBreadcrumb,
} from "@/components/files-manager/folder-breadcrumb";
import { FolderList } from "@/components/files-manager/folder-list";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { DndProvider } from "@/hooks/use-dnd";
import { cn } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

const NewFolderDialog = lazy(() =>
  import("@/components/files-manager/dialogs/new-folder-dialog").then(
    (module) => ({
      default: module.NewFolderDialog,
    }),
  ),
);

export function FilesManagerContent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentFolderId = searchParams.get("folderId") || undefined;
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);
  const [folderPage, setFolderPage] = useState(1);
  const folderPageSize = 20;
  const trpc = useTRPC();
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  const { data: foldersData } = useQuery(
    trpc.user.getFolders.queryOptions({
      parentId: currentFolderId,
      page: folderPage,
      pageSize: folderPageSize,
      search: searchParams.get("search") || undefined,
    }),
  );

  const { data: currentFolder } = useQuery(
    trpc.user.getFolder.queryOptions(
      currentFolderId ? { id: currentFolderId } : skipToken,
    ),
  );

  useEffect(() => {
    if (!currentFolderId) {
      setBreadcrumbs([]);
      setFolderPage(1);
      return;
    }

    if (currentFolder) {
      const items: BreadcrumbItem[] = [
        ...currentFolder.ancestors.map((f) => ({ id: f.id, name: f.name })),
        { id: currentFolder.id, name: currentFolder.name },
      ];
      setBreadcrumbs(items);
    }
    setFolderPage(1);
  }, [currentFolderId, currentFolder]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("files-view-mode");
      if (stored === "table" || stored === "grid") setViewMode(stored);
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("files-view-mode", viewMode);
    } catch {}
  }, [viewMode]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    await queryClient.invalidateQueries({
      queryKey: trpc.user.getFiles.queryKey(),
      exact: false,
    });

    await queryClient.invalidateQueries({
      queryKey: trpc.user.getFolders.queryKey(),
      exact: false,
    });

    toast.success("Files refreshed successfully");

    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  const updateSearchParams = useCallback(
    (updates: Record<string, string | null>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, value);
        }
      }
      router.push(`${pathname}?${newParams.toString()}`);
    },
    [searchParams, router, pathname],
  );

  const handleFolderNavigate = (folderId: string | null): void => {
    if (folderId === null) {
      updateSearchParams({ folderId: null });
      setBreadcrumbs([]);
    } else {
      updateSearchParams({ folderId });

      const folder = foldersData?.items.find((f) => f.id === folderId);
      if (folder) {
        setBreadcrumbs((prev) => [
          ...prev,
          { id: folderId, name: folder.name },
        ]);
      } else {
        const index = breadcrumbs.findIndex((b) => b.id === folderId);
        if (index !== -1) {
          setBreadcrumbs(breadcrumbs.slice(0, index + 1));
        }
      }
    }
  };

  const handleFolderUpdate = () => {
    queryClient.invalidateQueries({
      queryKey: trpc.user.getFolders.queryKey(),
      exact: false,
    });
  };

  return (
    <DndProvider>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Files Manager</h1>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
            <Button asChild variant="outline" className="w-full sm:w-auto">
              <Link href="/dashboard/uploads">
                <Upload className="mr-2 size-4" />
                Upload
              </Link>
            </Button>
            <Suspense fallback={<Button disabled>Loading...</Button>}>
              <NewFolderDialog
                className="w-full sm:w-auto"
                parentId={currentFolderId}
                onSuccess={handleFolderUpdate}
              />
            </Suspense>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="col-span-2 w-full sm:col-span-1 sm:w-auto"
            >
              <RefreshCcw
                className={cn("mr-2 size-4", isRefreshing && "animate-spin")}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <FolderBreadcrumb
            items={breadcrumbs}
            onNavigate={handleFolderNavigate}
          />

          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Table view"
                  aria-pressed={viewMode === "table"}
                  className={cn(
                    "transition-transform",
                    viewMode === "table" && "ring-2 ring-primary scale-105",
                  )}
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                >
                  <LayoutList className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Table view</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  aria-label="Grid view"
                  aria-pressed={viewMode === "grid"}
                  className={cn(
                    "transition-transform",
                    viewMode === "grid" && "ring-2 ring-primary scale-105",
                  )}
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Grid view</TooltipContent>
            </Tooltip>
          </div>
        </div>

        <FolderList
          folders={foldersData?.items ?? []}
          total={foldersData?.total ?? 0}
          page={foldersData?.page ?? 1}
          pageCount={foldersData?.pageCount ?? 1}
          onPageChange={setFolderPage}
          onNavigate={handleFolderNavigate}
          onUpdate={handleFolderUpdate}
        />

        {viewMode === "table" ? (
          <Suspense fallback={<FilesTableSkeleton />}>
            <FilesTable currentFolderId={currentFolderId} />
          </Suspense>
        ) : (
          <FilesGrid currentFolderId={currentFolderId} />
        )}
      </div>
    </DndProvider>
  );
}
