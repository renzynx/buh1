"use client";

import { Settings, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const currentTab = pathname.includes("/security") ? "security" : "settings";

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Account</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and security preferences.
        </p>
      </div>

      <Tabs value={currentTab} className="w-full">
        <div className="flex justify-center mb-6">
          <TabsList className="max-w-sm w-full">
            <TabsTrigger value="settings" className="w-full" asChild>
              <Link
                href="/account/settings"
                className={cn(
                  "flex items-center gap-2",
                  currentTab === "settings" && "text-primary",
                )}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </TabsTrigger>
            <TabsTrigger value="security" className="w-full" asChild>
              <Link
                href="/account/security"
                className={cn(
                  "flex items-center gap-2",
                  currentTab === "security" && "text-primary",
                )}
              >
                <ShieldCheck className="h-4 w-4" />
                Security
              </Link>
            </TabsTrigger>
          </TabsList>
        </div>
        {children}
      </Tabs>
    </div>
  );
}
