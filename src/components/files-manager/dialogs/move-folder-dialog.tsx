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

interface MoveFolderDialogProps {
  folderId: string;
  onClose: () => void;
  onMoved: () => void;
}

export function MoveFolderDialog({
  folderId,
  onClose,
  onMoved,
}: MoveFolderDialogProps) {
  const trpc = useTRPC();
  const [targetFolderId, setTargetFolderId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation(
    trpc.user.moveFolder.mutationOptions({
      onSuccess: () => {
        toast.success("Folder moved successfully");

        queryClient.invalidateQueries({
          queryKey: trpc.user.getFolders.queryKey(),
          exact: false,
        });
        queryClient.invalidateQueries({
          queryKey: trpc.user.getFolder.queryKey(),
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
    if (targetFolderId === folderId) {
      toast.error("Cannot move a folder into itself");
      return;
    }
    mutate({
      folderId,
      targetParentId: targetFolderId,
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move Folder</DialogTitle>
          <DialogDescription>
            Select a destination folder to move this folder into.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <FolderSelector
            value={targetFolderId}
            onChange={setTargetFolderId}
            excludeFolderId={folderId}
          />
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
