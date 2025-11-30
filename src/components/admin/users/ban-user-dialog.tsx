import { useMutation } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient } from "@/lib/auth-client";

const banUserSchema = z.object({
  banReason: z.string().optional(),
  banDuration: z.number().optional(),
});

interface BanUserDialogProps {
  userId: string | null;
  userEmail?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function BanUserDialog({
  userId,
  userEmail,
  open,
  onOpenChange,
  onSuccess,
}: BanUserDialogProps) {
  const { mutate: banUser, isPending } = useMutation({
    mutationFn: async (data: { banReason: string; banExpires?: Date }) => {
      if (!userId) return;

      return await authClient.admin.banUser({
        userId,
        banReason: data.banReason,
        banExpiresIn: data.banExpires
          ? Math.floor((data.banExpires.getTime() - Date.now()) / 1000)
          : undefined,
      });
    },
    onError: (error) => {
      toast.error(error.message);
    },
    onSuccess: (result) => {
      if (!result) return;

      if ("error" in result && result.error) {
        toast.error(result.error.message ?? "Failed to ban user");
        return;
      }

      toast.warning(`User ${userEmail ?? ""} has been banned 🔨`);
      onOpenChange(false);
      form.reset();
      onSuccess?.();
    },
  });

  const form = useAppForm({
    defaultValues: {
      banReason: "",
      banDuration: undefined as number | undefined,
    },
    validators: {
      // @ts-expect-error
      onSubmit: banUserSchema,
    },
    onSubmit: async ({ value }) => {
      let banExpires: Date | undefined;

      if (typeof value.banDuration === "number") {
        // Convert days back to a Date object for the mutation
        const msPerDay = 24 * 60 * 60 * 1000;
        const date = new Date(Date.now() + value.banDuration * msPerDay);
        // Set to end of day to be generous/consistent
        date.setHours(23, 59, 59, 999);
        banExpires = date;
      }

      banUser({
        banReason: value.banReason ?? "",
        banExpires,
      });
    },
  });

  const minDate = useMemo(() => {
    return new Date();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Ban User</DialogTitle>
          <DialogDescription>
            {userEmail
              ? `Ban ${userEmail} from accessing the application.`
              : "Ban this user from accessing the application."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.AppField name="banReason">
            {(field) => (
              <field.TextArea
                label="Ban Reason"
                placeholder="Violating community guidelines..."
                rows={3}
              />
            )}
          </form.AppField>

          <form.AppField name="banDuration">
            {(field) => (
              <field.Calendar
                label="Ban Duration (Optional)"
                minDate={minDate}
                description="User will be banned permanently if no date is selected."
              />
            )}
          </form.AppField>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <form.AppForm>
              <form.SubscribeButton
                label="Ban User"
                variant="destructive"
                isLoading={isPending}
              />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
