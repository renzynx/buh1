import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { DatabaseFolders } from "@/database/schema";
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
  onNavigate,
  onUpdate,
}: {
  folders: DatabaseFolders[];
  onNavigate: (folderId: string) => void;
  onUpdate: () => void;
}) {
  const [renameFolder, setRenameFolder] = useState<DatabaseFolders | null>(
    null,
  );
  const [deleteFolder, setDeleteFolder] = useState<DatabaseFolders | null>(
    null,
  );

  if (folders.length === 0) {
    return null;
  }

  return (
    <>
      <div className="mb-4">
        <h3 className="mb-2 text-sm font-medium text-muted-foreground">
          Folders
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className="group relative flex items-center gap-2 rounded-lg border p-3 hover:bg-accent"
            >
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
          ))}
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
