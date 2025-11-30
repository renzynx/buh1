import { AlertCircleIcon } from "lucide-react";
import { usePageContext } from "vike-react/usePageContext";
import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";
import { Alert, AlertTitle } from "@/components/ui/alert";

export default function Page() {
  const { abortReason } = usePageContext();
  const abort = abortReason as Record<string, string> | null;

  return (
    <main className="min-h-screen w-screen">
      {abort && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4">
          <Alert
            variant="destructive"
            className="flex items-center shadow-lg backdrop-blur-sm bg-destructive/95"
          >
            <AlertCircleIcon />
            <AlertTitle className="pt-1">{abort.message}</AlertTitle>
          </Alert>
        </div>
      )}
      <AuthCard
        title="Welcome back"
        description="Sign in to your account to continue"
      >
        <SignInForm redirectTo={abort?.redirectTo} />
      </AuthCard>
    </main>
  );
}
