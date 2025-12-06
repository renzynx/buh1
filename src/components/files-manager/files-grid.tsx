import { useSuspenseQuery } from "@tanstack/react-query";
import {
  Download,
  Eye,
  FolderInput,
  GripVertical,
  MoreHorizontal,
  Share2,
  Trash2,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryParams } from "@/hooks/use-query-params";
import type { FileRow } from "@/lib/types";
import { cn, formatBytes } from "@/lib/utils";
import type { Data } from "@/pages/(main)/dashboard/files-manager/+data";
import { useTRPC } from "@/trpc/client";
import { useDnd } from "../../hooks/use-dnd";
import { Loading } from "../loading";
import { FilesBulkActionsBar } from "./files-bulk-actions-bar";

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

export function FilesGrid({
  currentFolderId,
  initialData,
}: {
  currentFolderId?: string | null;
  initialData?: Data["files"];
}) {
  const { params, setQueryParams } = useQueryParams();
  const trpc = useTRPC();
  const { handleDragStart, handleDragEnd, isDragging } = useDnd();

  const pageIndex = (params.page ?? 1) - 1;
  const pageSize = params.pageSize ?? 20;
  const search = params.search ?? "";

  const buildParams = (
    pIndex = pageIndex,
    pSize = pageSize,
    searchQuery = search,
  ) =>
    ({
      page: pIndex + 1,
      pageSize: pSize,
      search: searchQuery,
      sortBy: "createdAt",
      sortDir: "desc",
      folderId: currentFolderId,
    }) as const;

  const { data } = useSuspenseQuery(
    trpc.user.getFiles.queryOptions(
      {
        ...buildParams(pageIndex, pageSize, search),
      },
      {
        initialData,
      },
    ),
  );

  const files = data?.items ?? [];
  const pageCount = data?.pageCount ?? 0;

  const [rowSelection, setRowSelection] = useState<Record<string, boolean>>({});
  const [deleteFileIds, setDeleteFileIds] = useState<string[]>([]);
  const [moveFileIds, setMoveFileIds] = useState<string[]>([]);
  const [previewFile, setPreviewFile] = useState<FileRow | null>(null);
  const [shareFile, setShareFile] = useState<FileRow | null>(null);

  const selectedIds = Object.keys(rowSelection).filter((k) => rowSelection[k]);

  const updateUrl = (
    pIndex = pageIndex,
    pSize = pageSize,
    searchQuery = search,
  ) => {
    setQueryParams({
      ...(params ?? {}),
      page: pIndex + 1,
      pageSize: pSize,
      search: searchQuery || undefined,
    });
  };

  return (
    <div>
      <div className="mb-3">
        <FilesBulkActionsBar
          selectedIds={selectedIds}
          onClear={() => setRowSelection({})}
          onDeleted={() => updateUrl(pageIndex, pageSize, search)}
        />
      </div>

      <Suspense fallback={<Loading />}>
        {deleteFileIds.length > 0 && (
          <DeleteFilesDialog
            fileIds={deleteFileIds}
            onClose={() => setDeleteFileIds([])}
            onDeleted={() => updateUrl(pageIndex, pageSize, search)}
          />
        )}

        {moveFileIds.length > 0 && (
          <MoveFilesDialog
            fileIds={moveFileIds}
            onClose={() => setMoveFileIds([])}
            onMoved={() => {
              setMoveFileIds([]);
              updateUrl(pageIndex, pageSize, search);
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

      {files.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">No files</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {files.map((f) => {
            const checked = Boolean(rowSelection[f.id]);
            // Determine which file IDs to drag: selected files if this file is selected, otherwise just this file
            const dragIds =
              checked && selectedIds.length > 0 ? selectedIds : [f.id];

            return (
              <div
                key={f.id}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, { type: "file", ids: dragIds })
                }
                onDragEnd={handleDragEnd}
                className={cn(
                  "rounded border p-3 flex flex-col gap-2 hover:shadow-md cursor-grab active:cursor-grabbing transition-opacity",
                  isDragging && "opacity-50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-1 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GripVertical className="size-4 text-muted-foreground" />
                      <Checkbox
                        aria-label={`Select ${f.filename}`}
                        checked={checked}
                        onCheckedChange={(v) =>
                          setRowSelection((prev) => ({
                            ...prev,
                            [f.id]: Boolean(v),
                          }))
                        }
                      />
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label="File actions"
                        >
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent side="bottom" align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            const link = document.createElement("a");
                            link.href = `/api/f/${f.encodedId}`;
                            link.download = f.filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          }}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        <DropdownMenuItem onClick={() => setPreviewFile(f)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setShareFile(f)}>
                          <Share2 className="mr-2 h-4 w-4" />
                          Share
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setMoveFileIds([f.id])}
                        >
                          <FolderInput className="mr-2 h-4 w-4" />
                          Move
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteFileIds([f.id])}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <button
                  className="h-28 bg-muted rounded flex items-center justify-center text-sm text-muted-foreground cursor-pointer hover:bg-muted/80 transition-colors"
                  onClick={() => setPreviewFile(f)}
                >
                  Preview
                </button>

                <div className="text-sm font-medium truncate">{f.filename}</div>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(f.size)}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Simple pagination controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          Page {pageIndex + 1} of {pageCount}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() =>
              updateUrl(Math.max(0, pageIndex - 1), pageSize, search)
            }
            disabled={pageIndex <= 0}
          >
            Prev
          </Button>
          <Button
            size="sm"
            onClick={() =>
              updateUrl(
                Math.min(pageCount - 1, pageIndex + 1),
                pageSize,
                search,
              )
            }
            disabled={pageIndex >= pageCount - 1}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
