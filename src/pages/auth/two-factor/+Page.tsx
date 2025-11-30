import { AlertCircleIcon } from "lucide-react";
import { usePageContext } from "vike-react/usePageContext";
import { AuthCard } from "@/components/auth/auth-card";
import { TwoFactorForm } from "@/components/auth/two-factor-form";
import { Alert, AlertTitle } from "@/components/ui/alert";

export default function Page() {
  const { abortReason, urlParsed } = usePageContext();
  const abort = abortReason as Record<string, string> | null;
  const totpURI = urlParsed.search.totpURI;

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
        title="Two-Factor Authentication"
        description="Enter your authentication code to continue"
        className={totpURI ? "max-w-2xl" : undefined}
      >
        <TwoFactorForm redirectTo={abort?.redirectTo} totpURI={totpURI} />
      </AuthCard>
    </main>
  );
}
