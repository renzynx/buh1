import { AlertCircle } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { navigate } from "vike/client/router";
import * as z from "zod";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient } from "@/lib/auth-client";

const twoFactorSchema = z.object({
  code: z.string().length(6, "Code must be 6 digits"),
  trustDevice: z.boolean().optional(),
});

interface TwoFactorFormProps {
  redirectTo?: string;
  totpURI?: string;
}

export function TwoFactorForm({
  redirectTo = "/dashboard",
  totpURI,
}: TwoFactorFormProps) {
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState("");

  const form = useAppForm({
    defaultValues: {
      code: "",
      trustDevice: false,
    },
    validators: {
      // @ts-expect-error
      onSubmit: twoFactorSchema,
    },
    onSubmit: async ({ value }) => {
      setError("");
      setIsLoading(true);

      try {
        const { error } = await authClient.twoFactor.verifyTotp({
          code: value.code,
          trustDevice: value.trustDevice,
        });

        if (error) {
          setError(error.message || "Invalid verification code");
          setIsLoading(false);
          setCode("");
          return;
        }

        // Successful verification
        await navigate(redirectTo);
      } catch {
        setError("An unexpected error occurred");
        setIsLoading(false);
        setCode("");
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

      <div
        className={
          totpURI ? "grid md:grid-cols-2 gap-8 items-center" : "space-y-6"
        }
      >
        {totpURI && (
          <div className="flex flex-col items-center justify-center space-y-4 order-first">
            <div className="p-4 bg-white rounded-lg shadow-sm border">
              <QRCodeSVG value={totpURI} size={180} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">Scan this QR code</p>
              <p className="text-xs text-muted-foreground">
                Use your authenticator app to scan the code
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          <div className="space-y-4">
            <form.AppField name="code">
              {(field) => (
                <div className="space-y-3">
                  <label
                    htmlFor={field.name}
                    className="block text-sm font-medium text-center"
                  >
                    Enter your 6-digit authentication code
                  </label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={code}
                      onChange={(value) => {
                        setCode(value);
                        field.handleChange(value);
                        // Auto-submit when 6 digits are entered
                        if (value.length === 6) {
                          setTimeout(() => {
                            form.handleSubmit();
                          }, 100);
                        }
                      }}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  {!totpURI && (
                    <p className="text-xs text-muted-foreground text-center">
                      Open your authenticator app to get your code
                    </p>
                  )}
                </div>
              )}
            </form.AppField>

            <form.AppField name="trustDevice">
              {(field) => (
                <field.Checkbox
                  label="Trust this device"
                  description="Skip two-factor authentication on this device for 30 days"
                />
              )}
            </form.AppField>
          </div>

          <form.AppForm>
            <form.SubscribeButton
              label={isLoading ? "Verifying..." : "Verify"}
              isLoading={isLoading}
              disabled={code.length !== 6}
              className="w-full h-11 text-base font-medium"
            />
          </form.AppForm>
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-muted-foreground">
          Lost your authenticator?{" "}
          <a
            href="/auth/backup-code"
            className="text-primary hover:underline font-medium"
          >
            Use backup code
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
