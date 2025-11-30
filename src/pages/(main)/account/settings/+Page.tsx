import {
  AccountSettingsCards,
  DeleteAccountCard,
} from "@daveyplate/better-auth-ui";
import { TabsContent } from "@/components/ui/tabs";

export default function Page() {
  return (
    <TabsContent value="settings" className="space-y-6">
      <AccountSettingsCards />
      <DeleteAccountCard />
    </TabsContent>
  );
}
