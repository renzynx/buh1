import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FolderSelector } from "@/components/uploader/folder-selector";
import { useTRPC } from "@/trpc/client";

interface MoveFilesDialogProps {
  fileIds: string[];
  onClose: () => void;
  onMoved: () => void;
}

export function MoveFilesDialog({
  fileIds,
  onClose,
  onMoved,
}: MoveFilesDialogProps) {
  const trpc = useTRPC();
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    trpc.user.moveFiles.mutationOptions({
      onSuccess: (data) => {
        toast.success(
          `Successfully moved ${data.movedCount} file${
            data.movedCount === 1 ? "" : "s"
          }`,
        );

        queryClient.invalidateQueries({
          queryKey: trpc.user.getFiles.queryKey(),
          exact: false,
        });

        onMoved();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const handleMove = () => {
    mutate({
      fileIds,
      targetFolderId,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Files</DialogTitle>
          <DialogDescription>
            Select a destination folder for {fileIds.length} file
            {fileIds.length === 1 ? "" : "s"}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <FolderSelector value={targetFolderId} onChange={setTargetFolderId} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleMove} disabled={isPending}>
            {isPending ? "Moving..." : "Move"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
