import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

export function DeleteFilesDialog({
  fileIds,
  onClose,
  onDeleted,
}: {
  fileIds: string[];
  onClose: () => void;
  onDeleted?: () => void;
}) {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { mutateAsync, isPending } = useMutation(
    trpc.admin.deleteFiles.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: ({ deleted, success }) => {
        onClose();

        if (!success) {
          toast.error("Failed to delete files");
          return;
        }

        queryClient.invalidateQueries({
          queryKey: trpc.admin.getAllFiles.queryKey(),
          exact: false,
        });

        toast.success(
          fileIds.length === 1
            ? "File deleted successfully."
            : `${deleted} file(s) deleted successfully.`,
        );
      },
      onSettled: () => {
        onDeleted?.();
      },
    }),
  );

  const handleDelete = async () => {
    await mutateAsync({ ids: fileIds });
  };

  return (
    <AlertDialog
      open={fileIds.length > 0}
      onOpenChange={(o) => !o && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {fileIds.length > 1 ? "Delete Multiple Files?" : "Delete File?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete{" "}
            {fileIds.length > 1 ? `these ${fileIds.length} files` : "this file"}
            ? This action cannot be undone and will remove the files from user
            storage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              variant="destructive"
              isLoading={isPending}
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
