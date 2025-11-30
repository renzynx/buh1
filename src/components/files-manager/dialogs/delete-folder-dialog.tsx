import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { DatabaseFolders } from "@/database/schema";
import { useTRPC } from "@/trpc/client";

export function DeleteFolderDialog({
  folder,
  onClose,
  onSuccess,
}: {
  folder: DatabaseFolders;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation(
    trpc.user.deleteFolder.mutationOptions(),
  );

  const handleDelete = async () => {
    try {
      await mutateAsync({ id: folder.id });

      queryClient.invalidateQueries({
        queryKey: trpc.user.getFolders.queryKey(),
        exact: false,
      });

      toast.success("Folder deleted successfully");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete folder",
      );
    }
  };

  return (
    <AlertDialog open onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Folder</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{folder.name}"? This will also
            delete all subfolders and files inside. This action cannot be
            undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleDelete}
            isLoading={isPending}
          >
            Delete
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
