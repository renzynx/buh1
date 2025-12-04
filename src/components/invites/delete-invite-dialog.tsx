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
import { useTRPC } from "@/trpc/client";
import { Button } from "../ui/button";

interface DeleteInviteDialogProps {
  inviteCode: string | null;
  onClose: () => void;
  onDeleted: () => void;
}

export function DeleteInviteDialog({
  inviteCode,
  onClose,
  onDeleted,
}: DeleteInviteDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation(
    trpc.user.deleteInvite.mutationOptions({
      onError: (error) => {
        toast.error(error?.message ?? "Failed to delete invite");
      },
      onSuccess: () => {
        toast.success("Invite deleted successfully");
        queryClient.invalidateQueries({
          queryKey: trpc.user.getInvites.queryKey(),
          exact: false,
        });
        onClose();
      },
      onSettled: () => {
        onDeleted();
      },
    }),
  );

  const handleDelete = () => {
    if (!inviteCode) return;
    mutate({ code: inviteCode });
  };

  return (
    <AlertDialog
      open={Boolean(inviteCode)}
      onOpenChange={(open) => !open && onClose()}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Invite</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this invite code? This action cannot
            be undone.
            {inviteCode && (
              <div className="mt-2 font-mono text-sm bg-muted p-2 rounded">
                {inviteCode}
              </div>
            )}
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
              Delete Invite
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
