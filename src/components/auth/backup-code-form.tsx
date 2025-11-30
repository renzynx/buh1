import { AlertCircle } from "lucide-react";
import { useState } from "react";
import { navigate } from "vike/client/router";
import * as z from "zod";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient } from "@/lib/auth-client";

const backupCodeSchema = z.object({
  code: z.string().min(1, "Backup code is required"),
});

interface BackupCodeFormProps {
  redirectTo?: string;
}

export function BackupCodeForm({
  redirectTo = "/dashboard",
}: BackupCodeFormProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useAppForm({
    defaultValues: {
      code: "",
    },
    validators: {
      onSubmit: backupCodeSchema,
    },
    onSubmit: async ({ value }) => {
      setError("");
      setIsLoading(true);

      try {
        const { error } = await authClient.twoFactor.verifyBackupCode({
          code: value.code,
        });

        if (error) {
          setError(error.message || "Invalid backup code");
          setIsLoading(false);
          return;
        }

        // Successful verification
        await navigate(redirectTo);
      } catch {
        setError("An unexpected error occurred");
        setIsLoading(false);
      }
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-3 text-sm text-destructive border border-destructive/20">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      <div className="space-y-4">
        <form.AppField name="code">
          {(field) => (
            <field.TextField
              label="Backup Code"
              type="text"
              placeholder="Enter your backup code"
              required
              disabled={isLoading}
              autoComplete="off"
              className="h-11 font-mono"
            />
          )}
        </form.AppField>

        <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">
            About backup codes:
          </p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Each code can only be used once</li>
            <li>Codes are case-sensitive</li>
            <li>Keep your remaining codes safe</li>
          </ul>
        </div>
      </div>

      <form.AppForm>
        <form.SubscribeButton
          label="Verify Backup Code"
          isLoading={isLoading}
          className="w-full h-11 text-base font-medium"
        />
      </form.AppForm>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          <a
            href="/auth/two-factor"
            className="text-primary hover:underline font-medium"
          >
            Use authenticator app instead
          </a>
        </p>
        <p className="text-sm text-muted-foreground">
          <button
            type="button"
            onClick={() => navigate("/auth/sign-in")}
            className="text-primary hover:underline font-medium"
          >
            Back to sign in
          </button>
        </p>
      </div>
    </form>
  );
}
