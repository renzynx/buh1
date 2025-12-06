import {
  ChevronLeft,
  ChevronRight,
  Folder,
  GripVertical,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DatabaseFolders } from "@/database/schema";
import { cn } from "@/lib/utils";
import { useDnd } from "../../hooks/use-dnd";
import { LoadingToast } from "../loading-toast";

const DeleteFolderDialog = lazy(() =>
  import("./dialogs/delete-folder-dialog").then((module) => ({
    default: module.DeleteFolderDialog,
  })),
);
const RenameFolderDialog = lazy(() =>
  import("./dialogs/rename-folder-dialog").then((module) => ({
    default: module.RenameFolderDialog,
  })),
);

export function FolderList({
  folders,
  total,
  page,
  pageCount,
  onPageChange,
  onNavigate,
  onUpdate,
}: {
  folders: DatabaseFolders[];
  total: number;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  onNavigate: (folderId: string) => void;
  onUpdate: () => void;
}) {
  const [renameFolder, setRenameFolder] = useState<DatabaseFolders | null>(
    null,
  );
  const [deleteFolder, setDeleteFolder] = useState<DatabaseFolders | null>(
    null,
  );
  const {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    dropTargetId,
    isDragging,
  } = useDnd();

  if (folders.length === 0 && page === 1) {
    return null;
  }

  return (
    <>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-muted-foreground">Folders</h3>
          {pageCount > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="size-6"
                disabled={page <= 1}
                onClick={() => onPageChange(page - 1)}
              >
                <ChevronLeft className="size-3" />
              </Button>
              <span className="text-xs text-muted-foreground">
                {page} / {pageCount}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="size-6"
                disabled={page >= pageCount}
                onClick={() => onPageChange(page + 1)}
              >
                <ChevronRight className="size-3" />
              </Button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {folders.map((folder) => {
            const isDropTarget = dropTargetId === folder.id;

            return (
              <div
                key={folder.id}
                draggable
                onDragStart={(e) =>
                  handleDragStart(e, { type: "folder", ids: [folder.id] })
                }
                onDragEnd={handleDragEnd}
                onDragOver={(e) => handleDragOver(e, folder.id)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, folder.id)}
                className={cn(
                  "group relative flex items-center gap-2 rounded-lg border p-3 hover:bg-accent cursor-grab active:cursor-grabbing transition-all",
                  isDropTarget &&
                    "ring-2 ring-primary bg-primary/10 border-primary",
                  isDragging && !isDropTarget && "opacity-50",
                )}
              >
                <GripVertical className="size-4 shrink-0 text-muted-foreground" />
                <button
                  type="button"
                  onClick={() => onNavigate(folder.id)}
                  className="flex flex-1 items-center gap-2 overflow-hidden cursor-pointer"
                >
                  <Folder className="size-5 shrink-0 text-blue-500" />
                  <span className="truncate text-sm font-medium">
                    {folder.name}
                  </span>
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setRenameFolder(folder)}>
                      <Pencil className="mr-2 size-4" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteFolder(folder)}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 size-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>

      <Suspense fallback={<LoadingToast />}>
        {renameFolder && (
          <RenameFolderDialog
            folder={renameFolder}
            onClose={() => setRenameFolder(null)}
            onSuccess={() => {
              setRenameFolder(null);
              onUpdate();
            }}
          />
        )}

        {deleteFolder && (
          <DeleteFolderDialog
            folder={deleteFolder}
            onClose={() => setDeleteFolder(null)}
            onSuccess={() => {
              setDeleteFolder(null);
              onUpdate();
            }}
          />
        )}
      </Suspense>
    </>
  );
}
