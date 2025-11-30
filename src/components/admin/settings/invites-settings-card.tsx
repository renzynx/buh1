import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAppForm } from "@/hooks/use-app-form";
import { formatDuration, parseDuration } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";
import { useTRPC } from "@/trpc/client";

export function InvitesSettingsCard() {
  const trpc = useTRPC();
  const { settings, setSettings } = useSettings();

  const { mutate, isPending } = useMutation(
    trpc.admin.updateSettings.mutationOptions({
      onSuccess: ({ settings }) => {
        setSettings(settings);
        toast.success("Invites settings updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      allowUserCreateInvites: settings.allowUserCreateInvites,
      defaultInvitesQuota: settings.defaultInvitesQuota,
      maxInviteAge: settings.maxInviteAge,
    },
    onSubmit: async ({ value }) => {
      const updates: Record<
        string,
        string | number | boolean | null | undefined
      > = {};

      if (
        Boolean(value.allowUserCreateInvites) !==
        Boolean(settings.allowUserCreateInvites)
      ) {
        updates.allowUserCreateInvites = value.allowUserCreateInvites;
      }

      const numericFields = ["defaultInvitesQuota", "maxInviteAge"] as const;

      for (const key of numericFields) {
        const val = Number(value[key] ?? 0);
        const original = Number(settings[key] ?? 0);
        if (val !== original) {
          updates[key] = val;
        }
      }

      if (Object.keys(updates).length === 0) {
        toast.error("No changes to save");
        return;
      }

      mutate(updates);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Invites</CardTitle>
          <CardDescription>Configure invite system behavior.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form.AppField name="allowUserCreateInvites">
            {(field) => (
              <field.Switch
                label="Allow User Invites"
                description="Allow regular users to create and manage invites."
              />
            )}
          </form.AppField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form.AppField name="defaultInvitesQuota">
              {(field) => (
                <field.TextField
                  label="Default Invites Quota"
                  description="The default number of invites a user can create. Set to 0 for unlimited invites."
                  type="number"
                />
              )}
            </form.AppField>

            <form.AppField name="maxInviteAge">
              {(field) => (
                <field.FormattedTextInput
                  label="Max Invite Age"
                  description="The maximum invite age. e.g. 7d, 24h"
                  format={(ms) => formatDuration(ms ?? 0)}
                  parse={(s) => parseDuration(s) ?? 0}
                />
              )}
            </form.AppField>
          </div>

          <div className="flex justify-end">
            <form.AppForm>
              <form.SubscribeButton label="Save" isLoading={isPending} />
            </form.AppForm>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
