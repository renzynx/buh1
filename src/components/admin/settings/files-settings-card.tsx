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
import { COMMON_FILE_EXTENSIONS } from "@/lib/constants";
import { formatBytes, parseBytes } from "@/lib/utils";
import { useSettings } from "@/stores/settings-store";
import { useTRPC } from "@/trpc/client";

export function FilesSettingsCard() {
  const trpc = useTRPC();
  const { settings, setSettings } = useSettings();

  const { mutate, isPending } = useMutation(
    trpc.admin.updateSettings.mutationOptions({
      onSuccess: ({ settings }) => {
        setSettings(settings);
        toast.success("Files settings updated successfully");
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useAppForm({
    defaultValues: {
      blacklistedExtensions: settings.blacklistedExtensions,
      defaultUserQuota: settings.defaultUserQuota,
      defaultUserFileCountQuota: settings.defaultUserFileCountQuota,
      uploadFileChunkSize: settings.uploadFileChunkSize,
      uploadFileMaxSize: settings.uploadFileMaxSize,
      cdnUrl: settings.cdnUrl,
    },
    onSubmit: async ({ value }) => {
      const updates: Record<string, string | number | null | undefined> = {};

      const numericFields = [
        "defaultUserQuota",
        "defaultUserFileCountQuota",
        "uploadFileChunkSize",
        "uploadFileMaxSize",
      ] as const;

      for (const key of numericFields) {
        const val = Number(value[key] ?? 0);
        const original = Number(settings[key] ?? 0);
        if (val !== original) {
          updates[key] = val;
        }
      }

      if (
        String(value.blacklistedExtensions ?? "") !==
        String(settings.blacklistedExtensions ?? "")
      ) {
        updates.blacklistedExtensions = value.blacklistedExtensions;
      }

      if (value.cdnUrl !== settings.cdnUrl) {
        updates.cdnUrl = value.cdnUrl;
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
          <CardTitle>Files & Storage</CardTitle>
          <CardDescription>
            Configure file upload limits and storage quotas.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <form.AppField name="cdnUrl">
            {(field) => (
              <field.TextField
                label="CDN URL"
                description="Base URL for serving files (e.g. https://cdn.example.com). Leave empty to use the default domain."
                placeholder="https://cdn.example.com"
              />
            )}
          </form.AppField>

          <form.AppField name="defaultUserQuota">
            {(field) => (
              <div className="space-y-2">
                <field.FormattedTextInput
                  label="Default User Quota"
                  description="Default storage quota for new users. e.g. 1 GB, 500 MB"
                  format={(v) => formatBytes(v ?? 0)}
                  parse={(s) => parseBytes(s) ?? 0}
                />
              </div>
            )}
          </form.AppField>

          <form.AppField name="defaultUserFileCountQuota">
            {(field) => (
              <field.TextField
                label="Default User File Count Quota"
                description="Total number of files a user can upload."
                placeholder="e.g. 1000"
                type="number"
              />
            )}
          </form.AppField>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form.AppField name="uploadFileMaxSize">
              {(field) => (
                <field.FormattedTextInput
                  label="Max Upload Size"
                  format={(v) => formatBytes(v ?? 0)}
                  parse={(s) => parseBytes(s) ?? 0}
                />
              )}
            </form.AppField>

            <form.AppField name="uploadFileChunkSize">
              {(field) => (
                <field.FormattedTextInput
                  label="Upload Chunk Size"
                  format={(v) => formatBytes(v ?? 0)}
                  parse={(s) => parseBytes(s) ?? 0}
                />
              )}
            </form.AppField>
          </div>

          <form.AppField name="blacklistedExtensions">
            {(field) => (
              <field.MultiSelect
                label="Blacklisted Extensions"
                items={COMMON_FILE_EXTENSIONS}
                search={{
                  placeholder: "Type extension (e.g. exe) and press Enter",
                  emptyMessage: "No extensions",
                }}
                triggerClassName="w-full text-left"
                valuePlaceholder="exe, bat, sh"
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
