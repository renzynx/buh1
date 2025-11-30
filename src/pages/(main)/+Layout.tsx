import {
  Folder,
  Home,
  Mail,
  Settings,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { usePageContext } from "vike-react/usePageContext";
import Sidebar, { type NavItem } from "@/components/ui/sidebar";
import { useSession } from "@/hooks/use-session";

const items: NavItem[] = [
  { name: "Dashboard", icon: Home, to: "/dashboard" },
  { name: "Files Manager", icon: Folder, to: "/dashboard/files-manager" },
  { name: "Uploads", icon: Upload, to: "/dashboard/uploads" },
  { name: "Invites", icon: Mail, to: "/dashboard/invites" },
  { name: "Settings", icon: Settings, to: "/dashboard/settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const { appName } = usePageContext();
  const isAdmin =
    session?.user?.role === "admin" || session?.user?.role === "superadmin";

  return (
    <Sidebar
      title={appName}
      items={items}
      storageKey="sidebar-collapsed"
      useTooltips
      separatorButton={
        isAdmin
          ? {
              label: "Management",
              icon: ShieldCheck,
              href: "/admin",
            }
          : undefined
      }
    >
      {children}
    </Sidebar>
  );
}
