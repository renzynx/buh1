import { SecuritySettingsCards } from "@daveyplate/better-auth-ui";
import { ApiKeyCard } from "@/components/account/api-key-card";
import { TabsContent } from "@/components/ui/tabs";

export default function Page() {
  return (
    <TabsContent value="security" className="space-y-6">
      <SecuritySettingsCards />
      <ApiKeyCard />
    </TabsContent>
  );
}
