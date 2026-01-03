"use client";

import { AccountSettingsCards } from "@/components/account/account-settings-cards";
import { DeleteAccountCard } from "@/components/account/delete-account-card";
import { TabsContent } from "@/components/ui/tabs";

export default function AccountSettingsPage() {
  return (
    <TabsContent value="settings" className="space-y-6" forceMount>
      <AccountSettingsCards />
      <DeleteAccountCard />
    </TabsContent>
  );
}
