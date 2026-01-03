"use client";

import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import * as z from "zod";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useAppForm } from "@/hooks/use-app-form";
import { authClient } from "@/lib/auth-client";

const signInSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

interface SignInFormProps {
  redirectTo?: string;
}

export function SignInForm({ redirectTo = "/dashboard" }: SignInFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const form = useAppForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: signInSchema,
    },
    onSubmit: async ({ value }) => {
      setError("");
      setIsLoading(true);

      try {
        const { error } = await authClient.signIn.email(
          {
            email: value.email,
            password: value.password,
            callbackURL: redirectTo,
          },
          {
            onSuccess: async (context: { data: { twoFactorRedirect?: boolean } }) => {
              if (context.data.twoFactorRedirect) {
                router.push("/auth/two-factor");
                return;
              }
            },
          }
        );

        if (error) {
          setError(error.message || "Failed to sign in");
          setIsLoading(false);
          return;
        }

        router.push(redirectTo);
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
              <div className="flex items-center justify-between">
                <label
                  htmlFor={field.name}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Password
                </label>
                <a
                  href="/auth/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <InputGroup className="h-11">
                <InputGroupInput
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <InputGroupAddon align="inline-end" className="pr-1">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {field.state.meta.isTouched &&
                field.state.meta.errors.length > 0 && (
                  <div className="text-sm text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </div>
                )}
            </div>
          )}
        </form.AppField>
      </div>

      <form.AppForm>
        <form.SubscribeButton
          label="Sign In"
          isLoading={isLoading}
          className="w-full h-11 text-base font-medium"
        />
      </form.AppForm>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <a
          href="/auth/sign-up"
          className="text-primary hover:underline font-medium"
        >
          Sign up
        </a>
      </p>
    </form>
  );
}
