import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { navigate } from "vike/client/router";
import { authClient } from "@/lib/auth-client";

export default function Page() {
  useQuery({
    queryKey: ["sign-out"],
    queryFn: async () => {
      try {
        await authClient.signOut();
      } finally {
        await navigate("/auth/sign-in");
      }
      return null;
    },
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex min-h-screen w-screen flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground animate-pulse">Signing out...</p>
    </div>
  );
}
