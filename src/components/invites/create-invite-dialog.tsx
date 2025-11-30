import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useMemo, useState } from "react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAppForm } from "@/hooks/use-app-form";
import { useClipboard } from "@/hooks/use-clipboard";
import { useSettings } from "@/stores/settings-store";
import { useTRPC } from "@/trpc/client";

const formSchema = z.object({
  expiresInDays: z.number().int().min(0),
});

export function CreateInviteDialog() {
  const [open, setOpen] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { copyToClipboard } = useClipboard();
  const {
    settings: { maxInviteAge },
  } = useSettings();

  const { mutate, isPending } = useMutation(
    trpc.user.createInvite.mutationOptions({
      onError: (error) => {
        toast.error(error?.message ?? "Failed to create invite");
      },
      onSuccess: (data) => {
        try {
          copyToClipboard(data.code, "Invite code copied to clipboard");
        } catch {}
        setOpen(false);
        queryClient.invalidateQueries({
          queryKey: trpc.user.getInvites.queryKey(),
          exact: false,
        });
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      expiresInDays: undefined as number | undefined,
    },
    onSubmit: async ({ value }) => {
      // Ensure we have a value before parsing if it's strictly required by UI now
      if (typeof value.expiresInDays === "undefined") {
        toast.error("Expiry date is required");
        return;
      }

      const parsed = formSchema.safeParse({
        expiresInDays: value.expiresInDays,
      });

      if (!parsed.success) {
        const first = parsed.error.issues?.[0];
        const msg = first?.message ?? "Validation failed";
        toast.error(msg);
        return;
      }

      mutate({ expiresInDays: parsed.data.expiresInDays });
    },
  });

  const minDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const maxDate = useMemo(() => {
    if (!maxInviteAge) return undefined;
    const max = new Date(Date.now() + maxInviteAge);
    max.setHours(23, 59, 59, 999);
    return max;
  }, [maxInviteAge]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Invite</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Invite</DialogTitle>
          <DialogDescription>
            Generate an invite code users can use to register.
          </DialogDescription>
        </DialogHeader>
        <form
          id="create-invite-form"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div className="space-y-4">
            <form.AppField name="expiresInDays">
              {(field) => (
                <field.Calendar
                  label="Expires"
                  minDate={minDate}
                  maxDate={maxDate}
                  description={
                    field.state.value
                      ? `Invite will expire on ${format(
                          new Date(
                            Date.now() +
                              field.state.value * 24 * 60 * 60 * 1000,
                          ),
                          "PPP",
                        )}`
                      : "Expiry date is required."
                  }
                />
              )}
            </form.AppField>
          </div>
          <DialogFooter>
            <form.AppForm>
              <form.SubscribeButton label="Create" isLoading={isPending} />
            </form.AppForm>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
