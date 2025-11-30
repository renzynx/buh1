import { create, withPageContext } from "vike-react-zustand";

interface Store {
  settings: Vike.PageContext["settings"];
  setSettings: (settings: Store["settings"]) => void;
}

export const useSettings = create<Store>()(
  withPageContext((pageContext) => (set) => ({
    settings: pageContext.settings,
    setSettings: (settings: Store["settings"]) => set({ settings }),
  })),
);
