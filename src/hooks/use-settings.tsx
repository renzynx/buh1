"use client";

import { createContext, type ReactNode, useContext } from "react";
import type { AppSettings } from "@/lib/settings";

export interface RootLoaderData {
  settings: AppSettings;
  baseUrl: string;
  appName: string;
}

const SettingsContext = createContext<RootLoaderData | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
  settings: AppSettings;
  baseUrl: string;
  appName: string;
}

export function SettingsProvider({
  children,
  settings,
  baseUrl,
  appName,
}: SettingsProviderProps) {
  return (
    <SettingsContext.Provider value={{ settings, baseUrl, appName }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): RootLoaderData {
  const data = useContext(SettingsContext);
  if (!data) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return data;
}
