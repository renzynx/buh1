import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DatabaseFolders } from "@/database/schema";
import { useTRPC } from "@/trpc/client";

export function RenameFolderDialog({
  folder,
  onClose,
  onSuccess,
}: {
  folder: DatabaseFolders;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState(folder.name);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { mutateAsync, isPending } = useMutation(
    trpc.user.renameFolder.mutationOptions(),
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      await mutateAsync({
        id: folder.id,
        name: name.trim(),
      });

      queryClient.invalidateQueries({
        queryKey: trpc.user.getFolders.queryKey(),
        exact: false,
      });

      toast.success("Folder renamed successfully");
      onSuccess();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to rename folder",
      );
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-3">
              <Label htmlFor="folder-name">Name</Label>
              <Input
                id="folder-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter folder name"
                disabled={isPending}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button" disabled={isPending}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" isLoading={isPending}>
              Rename
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
