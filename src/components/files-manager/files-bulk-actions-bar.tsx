import { Download, Trash2 } from "lucide-react";
import React, { lazy, Suspense } from "react";
import { LoadingToast } from "../loading-toast";
import { Button } from "../ui/button";

const DeleteFilesDialog = lazy(() =>
  import("./dialogs/delete-files-dialog").then((module) => ({
    default: module.DeleteFilesDialog,
  })),
);

export function FilesBulkActionsBar({
  selectedIds,
  onClear,
  onDeleted,
}: {
  selectedIds: string[];
  onClear: () => void;
  onDeleted?: () => void;
}) {
  const [deleteIds, setDeleteIds] = React.useState<string[]>([]);

  return (
    <div className="mb-3">
      <div className="flex flex-col items-center md:flex-row md:items-center md:justify-between gap-3">
        <div className="text-sm text-center md:text-left font-medium">
          {selectedIds.length > 0 ? (
            <span>{selectedIds.length} selected</span>
          ) : (
            <span className="text-muted-foreground">No rows selected</span>
          )}
        </div>

        <div className="flex flex-col md:flex-row items-center gap-2 w-full md:w-auto">
          <div className="flex gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              className="flex-1 md:flex-none"
              disabled={selectedIds.length === 0}
              onClick={() => {
                const now = new Date();
                const timestamp = `${now.getFullYear()}-${String(
                  now.getMonth() + 1,
                ).padStart(2, "0")}-${String(now.getDate()).padStart(
                  2,
                  "0",
                )}-${String(now.getHours()).padStart(2, "0")}-${String(
                  now.getMinutes(),
                ).padStart(2, "0")}`;
                const filename = `archive-${timestamp}.zip`;

                const link = document.createElement("a");
                link.href = `/api/files/bulk-download?ids=${selectedIds.join(",")}`;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                onClear();
              }}
            >
              <Download className="mr-2 size-4" />
              <span>Download</span>
            </Button>
            <Button
              variant="destructive"
              className="flex-1 md:flex-none"
              onClick={() => setDeleteIds(selectedIds)}
              disabled={selectedIds.length === 0}
            >
              <Trash2 className="mr-2 size-4" />
              <span>Delete</span>
            </Button>
          </div>

          <div className="w-full md:w-auto">
            <Button
              variant="ghost"
              className="w-full md:w-auto"
              onClick={onClear}
              disabled={selectedIds.length === 0}
            >
              <span>Clear</span>
            </Button>
          </div>
        </div>
      </div>

      <Suspense fallback={<LoadingToast />}>
        {deleteIds.length > 0 && (
          <DeleteFilesDialog
            fileIds={deleteIds}
            onClose={() => setDeleteIds([])}
            onDeleted={() => {
              setDeleteIds([]);
              onClear();
              onDeleted?.();
            }}
          />
        )}
      </Suspense>
    </div>
  );
}
