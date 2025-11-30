import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-react/usePageContext";
import * as z from "zod";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient } from "@/lib/auth-client";

const signUpSchema = z
  .object({
    email: z.email("Please enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain an uppercase letter")
      .regex(/[a-z]/, "Password must contain a lowercase letter")
      .regex(/\d/, "Password must contain a number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    inviteCode: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

interface SignUpFormProps {
  redirectTo?: string;
}

export function SignUpForm({ redirectTo = "/dashboard" }: SignUpFormProps) {
  const { settings } = usePageContext();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      inviteCode: "",
    },
    validators: {
      // @ts-expect-error - Zod validator
      onSubmit: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      setError("");

      if (settings.requireInvite && !value.inviteCode) {
        setError("Invite code is required");
        return;
      }

      setIsLoading(true);

      try {
        const { error } = await authClient.signUp.email({
          email: value.email,
          password: value.password,
          name: "",
          callbackURL: redirectTo,
          ...(settings.requireInvite && { invite: value.inviteCode }),
        });

        if (error) {
          setError(error.message || "Failed to sign up");
          setIsLoading(false);
          return;
        }

        // Successful sign up
        await navigate(redirectTo);
      } catch {
        setError("An unexpected error occurred");
        setIsLoading(false);
      }
    },
  });

  // Subscribe to password changes
  useEffect(() => {
    const unsubscribe = form.store.subscribe(() => {
      const state = form.store.state;
      setPassword(state.values.password as string);
    });
    return unsubscribe;
  }, [form.store]);

  const passwordStrength = {
    hasMinLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /\d/.test(password),
  };

  const isPasswordStrong =
    passwordStrength.hasMinLength &&
    passwordStrength.hasUpperCase &&
    passwordStrength.hasLowerCase &&
    passwordStrength.hasNumber;

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
        {settings.requireInvite && (
          <form.AppField name="inviteCode">
            {(field) => (
              <field.TextField
                label="Invite Code"
                type="text"
                placeholder="Your invite code"
                required={settings.requireInvite}
                disabled={isLoading}
                className="h-11"
              />
            )}
          </form.AppField>
        )}

        <form.AppField name="email">
          {(field) => (
            <field.TextField
              label="Email"
              type="email"
              placeholder="you@example.com"
              required
              disabled={isLoading}
              autoComplete="email"
              className="h-11"
            />
          )}
        </form.AppField>

        <form.AppField name="password">
          {(field) => (
            <div className="space-y-2">
              <label
                htmlFor={field.name}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Password
              </label>
              <div className="relative">
                <field.TextField
                  label=""
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {password && (
                <div className="mt-3 space-y-2 text-xs">
                  <p className="text-muted-foreground font-medium">
                    Password must contain:
                  </p>
                  <div className="space-y-1.5">
                    <PasswordRequirement
                      met={passwordStrength.hasMinLength}
                      text="At least 8 characters"
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasUpperCase}
                      text="One uppercase letter"
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasLowerCase}
                      text="One lowercase letter"
                    />
                    <PasswordRequirement
                      met={passwordStrength.hasNumber}
                      text="One number"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </form.AppField>

        <form.AppField name="confirmPassword">
          {(field) => (
            <div className="space-y-2">
              <label
                htmlFor={field.name}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirm Password
              </label>
              <div className="relative">
                <field.TextField
                  label=""
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </form.AppField>
      </div>

      <form.AppForm>
        <form.SubscribeButton
          label="Create Account"
          isLoading={isLoading}
          disabled={!isPasswordStrong}
          className="w-full h-11 text-base font-medium"
        />
      </form.AppForm>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <a
          href="/auth/sign-in"
          className="text-primary hover:underline font-medium"
        >
          Sign in
        </a>
      </p>
    </form>
  );
}

function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2
        className={`h-4 w-4 ${
          met ? "text-green-500" : "text-muted-foreground/50"
        }`}
      />
      <span className={met ? "text-foreground" : "text-muted-foreground"}>
        {text}
      </span>
    </div>
  );
}
