import { AuthQueryProvider } from "@daveyplate/better-auth-tanstack";
import { AuthUIProviderTanstack } from "@daveyplate/better-auth-ui/tanstack";
import { useQueryClient } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { TusClientProvider } from "use-tus";
import { navigate, reload } from "vike/client/router";
import { usePageContext } from "vike-react/usePageContext";
import { authClient } from "@/lib/auth-client";
import { TRPCProvider, trpc } from "@/trpc/client";

export const Providers = ({ children }: { children: ReactNode }) => {
  const { session, settings, abortReason } = usePageContext();
  const abort = abortReason as Record<string, string> | null;
  const queryClient = useQueryClient();

  return (
    <TRPCProvider queryClient={queryClient} trpcClient={trpc}>
      <TusClientProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <AuthQueryProvider
            sessionQueryOptions={{
              initialData: session ? session : undefined,
              staleTime: 1000 * 60 * 5, // 5 minutes
            }}
            sessionKey={["session"]}
          >
            <AuthUIProviderTanstack
              authClient={authClient}
              navigate={async (href) => await navigate(href)}
              replace={async (href) =>
                await navigate(href, { overwriteLastHistoryEntry: true })
              }
              redirectTo={abort ? abort.redirectTo : "/dashboard"}
              onSessionChange={async () => await reload()}
              persistClient={false}
              twoFactor={["totp"]}
              additionalFields={{
                invite: {
                  label: "Invite Code",
                  type: "string",
                  placeholder: "Your invite code",
                  required: settings.requireInvite,
                },
              }}
              signUp={{
                fields: settings.requireInvite ? ["invite"] : [],
              }}
            >
              {children}
            </AuthUIProviderTanstack>
          </AuthQueryProvider>
        </ThemeProvider>
      </TusClientProvider>
    </TRPCProvider>
  );
};
