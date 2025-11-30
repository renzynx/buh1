import {
  ArrowLeft,
  DatabaseZap,
  FileIcon,
  Settings,
  Users,
} from "lucide-react";
import Sidebar, { type NavItem } from "@/components/ui/sidebar";

const items: NavItem[] = [
  { name: "Analytics", icon: DatabaseZap, to: "/admin" },
  { name: "Users", icon: Users, to: "/admin/users" },
  { name: "Files", icon: FileIcon, to: "/admin/files" },
  { name: "Settings", icon: Settings, to: "/admin/settings" },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Sidebar
      title="Admin"
      items={items}
      storageKey="sidebar-collapsed"
      useTooltips
      separatorButton={{
        label: "Back to Website",
        icon: ArrowLeft,
        href: "/dashboard",
      }}
    >
      {children}
    </Sidebar>
  );
}
