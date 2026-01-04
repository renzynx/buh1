"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import type { AppSettings } from "@/lib/settings";

export interface RootLoaderData {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const SettingsContext = createContext<RootLoaderData | null>(null);

interface SettingsProviderProps {
  children: ReactNode;
  settings: AppSettings;
}

export function SettingsProvider({
  children,
  settings: initialSettings,
}: SettingsProviderProps) {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);

  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings }}>
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
