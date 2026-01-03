"use client";

import { ApiKeyCard } from "@/components/account/api-key-card";
import { SecuritySettingsCards } from "@/components/account/security-settings-cards";
import { TabsContent } from "@/components/ui/tabs";

export default function AccountSecurityPage() {
  return (
    <TabsContent value="security" className="space-y-6" forceMount>
      <SecuritySettingsCards />
      <ApiKeyCard />
    </TabsContent>
  );
}
