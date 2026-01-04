"use client";

import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { TusClientProvider } from "use-tus";
import { SettingsProvider } from "@/hooks/use-settings";
import { UploadProvider } from "@/hooks/use-upload-store";
import type { AppSettings } from "@/lib/settings";
import { TRPCReactProvider } from "@/trpc/client";

interface ProvidersProps {
  children: ReactNode;
  settings: AppSettings;
}

export function Providers({ children, settings }: ProvidersProps) {
  return (
    <TRPCReactProvider>
      <SettingsProvider settings={settings}>
        <UploadProvider>
          <TusClientProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
            </ThemeProvider>
          </TusClientProvider>
        </UploadProvider>
      </SettingsProvider>
    </TRPCReactProvider>
  );
}
