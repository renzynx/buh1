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
import { useTRPC } from "@/trpc/client";

type UnifiedDeleteDialogProps = {
  fileIds: string[];
  onClose: () => void;
  onDeleted?: () => void;
};

export function DeleteFilesDialog({
  fileIds,
  onClose,
  onDeleted,
}: UnifiedDeleteDialogProps) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { mutateAsync, isPending } = useMutation(
    trpc.user.deleteFiles.mutationOptions(),
  );

  const handleDelete = async () => {
    const result = await mutateAsync({ ids: fileIds });

    if (!result) {
      onClose();
      return;
    }

    const { deleted, success } = result;

    onClose();

    if (!success) {
      toast.error("Failed to delete files");
      return;
    }

    queryClient.invalidateQueries({
      queryKey: trpc.user.getFiles.queryKey(),
      exact: false,
    });

    toast.success(
      fileIds.length === 1
        ? "File deleted successfully."
        : `${deleted} file(s) deleted successfully.`,
    );

    onDeleted?.();
  };

  const isOpen = fileIds.length > 0;
  const isBulk = fileIds.length > 1;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isBulk ? "Delete Multiple Files?" : "Delete File?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isBulk
              ? `Are you sure you want to delete ${fileIds.length} files? This action cannot be undone.`
              : "Are you sure you want to delete this file? This action cannot be undone."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
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
