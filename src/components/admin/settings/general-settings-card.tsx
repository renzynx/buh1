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
import { useSettings } from "@/stores/settings-store";
import { useTRPC } from "@/trpc/client";

export function GeneralSettingsCard() {
  const trpc = useTRPC();
  const { settings, setSettings } = useSettings();

  const { mutate, isPending } = useMutation(
    trpc.admin.updateSettings.mutationOptions({
      onSuccess: ({ settings }) => {
        setSettings(settings);
        toast.success("Settings updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      signUpEnabled: settings.signUpEnabled,
      requireInvite: settings.requireInvite,
    },
    onSubmit: async ({ value }) => {
      const updates: Record<string, boolean> = {};

      const booleanFields = ["signUpEnabled", "requireInvite"] as const;

      for (const key of booleanFields) {
        const val = Boolean(value[key]);
        const original = Boolean(settings[key]);

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
          <CardTitle>General</CardTitle>
          <CardDescription>
            Basic application behavior and access control.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form.AppField name="signUpEnabled">
            {(field) => (
              <field.Switch
                label="Registration Enabled"
                description="Allow new users to sign up for an account."
              />
            )}
          </form.AppField>

          <form.AppField name="requireInvite">
            {(field) => (
              <field.Switch
                label="Require Invite"
                description="Only allow users with a valid invite code to register."
              />
            )}
          </form.AppField>

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
