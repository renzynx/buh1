import { skipToken, useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DatabaseUser } from "@/database/schema";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient } from "@/lib/auth-client";
import { formatBytes, parseBytes } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";

interface EditUserDialogProps {
  user: DatabaseUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const editUserSchema = z.object({
  name: z
    .union([
      z.string().length(0),
      z.string().min(1, "Name must be at least 1 character"),
      z.string().max(100, "Name must be at most 100 characters"),
    ])
    .optional()
    .transform((e) => (e === "" ? undefined : e)),
  email: z.email("Invalid email address"),
  quota: z
    .union([z.literal(-1), z.number().int().min(0)])
    .optional()
    .nullable(),
  fileCountQuota: z
    .union([z.literal(-1), z.number().int().min(0)])
    .optional()
    .nullable(),
  inviteQuota: z
    .union([z.literal(-1), z.number().int().min(0)])
    .optional()
    .nullable(),
});

function getQuotaChange(
  newValue: number | null | undefined,
  currentValue: number | null | undefined,
) {
  if (newValue === undefined || newValue === null) return undefined;
  return newValue !== (currentValue ?? null) ? newValue : undefined;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditUserDialogProps) {
  const trpc = useTRPC();
  const { data: quotaData, refetch } = useQuery(
    trpc.admin.getUserQuota.queryOptions(
      user ? { userId: user.id } : skipToken,
    ),
  );

  const { mutateAsync: updateUserQuotaAsync, isPending: isUpdatingQuota } =
    useMutation(
      trpc.admin.updateUserQuota.mutationOptions({
        onError: (error) => toast.error(error.message),
        onSuccess: async () => {
          toast.success("User quota updated successfully");
          await refetch();
        },
      }),
    );

  const { mutateAsync: updateUserAsync, isPending: isUpdatingProfile } =
    useMutation({
      mutationFn: async ({ name, email }: { name: string; email: string }) => {
        if (!user) return;
        return await authClient.admin.updateUser({
          userId: user.id,
          data: { name, email },
        });
      },
      onError: (error) => toast.error(error.message),
      onSuccess: (res) => {
        if (res?.error) {
          toast.error(res.error.message ?? "Failed to update user");
        }
      },
    });

  const form = useAppForm({
    defaultValues: {
      name: user?.name ?? "",
      email: user?.email ?? "",
      quota: quotaData?.quota ?? null,
      fileCountQuota: quotaData?.fileCountQuota ?? null,
      inviteQuota: quotaData?.inviteQuota ?? null,
    },
    validators: {
      // @ts-expect-error - complex zod transformation types
      onSubmit: editUserSchema,
    },
    onSubmit: async ({ value }) => {
      if (!user) return;

      const promises: Promise<unknown>[] = [];

      const newName = value.name ?? user.name;
      const newEmail = value.email;
      const hasProfileChanges =
        newName !== user.name || newEmail !== user.email;

      if (hasProfileChanges) {
        promises.push(updateUserAsync({ name: newName, email: newEmail }));
      }

      const quotaChanges = {
        quota: getQuotaChange(value.quota, quotaData?.quota),
        fileCountQuota: getQuotaChange(
          value.fileCountQuota,
          quotaData?.fileCountQuota,
        ),
        inviteQuota: getQuotaChange(value.inviteQuota, quotaData?.inviteQuota),
      };

      const hasQuotaChanges = Object.values(quotaChanges).some(
        (v) => v !== undefined,
      );

      if (hasQuotaChanges) {
        promises.push(
          updateUserQuotaAsync({
            userId: user.id,
            ...quotaChanges,
          }),
        );
      }

      if (promises.length === 0) {
        toast.error("No changes to save");
        return;
      }

      try {
        await Promise.all(promises);
        onOpenChange(false);
        form.reset();
        onSuccess?.();
      } catch (error) {
        console.error("Update failed", error);
      }
    },
  });

  const isSaving = isUpdatingProfile || isUpdatingQuota;

  // Sync form values when data is loaded or dialog opens
  useEffect(() => {
    if (open && user) {
      form.reset({
        name: user.name,
        email: user.email,
        quota: quotaData?.quota ?? null,
        fileCountQuota: quotaData?.fileCountQuota ?? null,
        inviteQuota: quotaData?.inviteQuota ?? null,
      });
    }
  }, [user, quotaData, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user information. Click save when you're done.
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
          <Tabs defaultValue="profile">
            <TabsList className="mb-5">
              <TabsTrigger className="w-full" value="profile">
                Profile
              </TabsTrigger>
              <TabsTrigger className="w-full" value="quota">
                Quota
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <form.AppField name="name">
                {(field) => (
                  <field.TextField label="Name" placeholder="John Doe" />
                )}
              </form.AppField>

              <form.AppField name="email">
                {(field) => (
                  <field.TextField
                    label="Email"
                    placeholder="john@example.com"
                  />
                )}
              </form.AppField>
            </TabsContent>

            <TabsContent value="quota">
              <div className="space-y-2">
                <form.AppField name="quota">
                  {(field) => (
                    <field.FormattedTextInput
                      label="Quota (bytes)"
                      description={`You can type numbers (e.g. "1024"), use units (e.g. "1.5 GB"), or enter "Unlimited".`}
                      format={(v) =>
                        v === -1 ? "Unlimited" : formatBytes(v ?? 0)
                      }
                      parse={parseBytes}
                    />
                  )}
                </form.AppField>

                <form.AppField name="fileCountQuota">
                  {(field) => (
                    <field.TextField
                      label="File Count Quota"
                      description="Set to -1 for unlimited quota"
                      type="number"
                    />
                  )}
                </form.AppField>

                <form.AppField name="inviteQuota">
                  {(field) => (
                    <field.TextField
                      label="Invite Quota"
                      description="Set to -1 for unlimited quota"
                      type="number"
                    />
                  )}
                </form.AppField>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <form.AppForm>
              <form.SubscribeButton label="Save changes" isLoading={isSaving} />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
