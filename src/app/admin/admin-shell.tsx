"use client";

import {
  ArrowLeft,
  DatabaseZap,
  FileIcon,
  Settings,
  Users,
} from "lucide-react";
import Header from "@/components/header";
import Sidebar, {
  type NavItem,
  type SessionData,
} from "@/components/ui/sidebar";

const items: NavItem[] = [
  { name: "Analytics", icon: DatabaseZap, to: "/admin" },
  { name: "Users", icon: Users, to: "/admin/users" },
  { name: "Files", icon: FileIcon, to: "/admin/files" },
  { name: "Settings", icon: Settings, to: "/admin/settings" },
];

interface AdminShellProps {
  children: React.ReactNode;
  session: SessionData;
}

export function AdminShell({ children, session }: AdminShellProps) {
  return (
    <Sidebar
      title="Admin"
      items={items}
      storageKey="admin-sidebar-collapsed"
      useTooltips
      session={session}
      header={<Header session={session} />}
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
