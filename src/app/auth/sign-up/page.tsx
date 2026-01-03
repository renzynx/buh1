import { AlertCircleIcon } from "lucide-react";
import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { getSettings } from "@/lib/settings";

interface SignUpPageProps {
  searchParams: Promise<{ message?: string; redirectTo?: string }>;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const [{ message, redirectTo }, settings] = await Promise.all([
    searchParams,
    getSettings(),
  ]);

  if (!settings.signUpEnabled) {
    return (
      <main className="flex flex-col items-center justify-center h-screen w-screen">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircleIcon />
          <AlertTitle className="pt-1">
            Sign up is currently disabled
          </AlertTitle>
        </Alert>
      </main>
    );
  }

  return (
    <main className="min-h-screen w-screen">
      {message && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert
            variant="destructive"
            className="flex items-center shadow-lg backdrop-blur-sm bg-destructive/95"
          >
            <AlertCircleIcon />
            <AlertTitle className="pt-1">{message}</AlertTitle>
          </Alert>
        </div>
      )}
      <AuthCard
        title="Create an account"
        description="Get started with your new account"
      >
        <SignUpForm redirectTo={redirectTo} />
      </AuthCard>
    </main>
  );
}
