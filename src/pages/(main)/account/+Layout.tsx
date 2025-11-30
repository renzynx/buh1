import type { ReactNode } from "react";
import { navigate } from "vike/client/router";
import { usePageContext } from "vike-react/usePageContext";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Layout({ children }: { children: ReactNode }) {
  const { urlPathname } = usePageContext();
  return (
    <Tabs
      defaultValue={urlPathname.includes("/security") ? "security" : "settings"}
      className="w-full"
    >
      <div className="flex justify-center mb-4">
        <TabsList className="max-w-sm w-full">
          <TabsTrigger
            className="w-full"
            value="settings"
            onClick={() => {
              navigate("/account/settings");
            }}
          >
            Settings
          </TabsTrigger>
          <TabsTrigger
            className="w-full"
            value="security"
            onClick={() => {
              navigate("/account/security");
            }}
          >
            Security
          </TabsTrigger>
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
