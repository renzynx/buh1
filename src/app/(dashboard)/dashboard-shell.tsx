"use client";

import {
  Folder,
  Home,
  Mail,
  Settings,
  ShieldCheck,
  Upload,
} from "lucide-react";
import Header from "@/components/header";
import Sidebar, {
  type NavItem,
  type SessionData,
} from "@/components/ui/sidebar";
import { GlobalUploader } from "@/components/uploader/global-uploader";

const items: NavItem[] = [
  { name: "Dashboard", icon: Home, to: "/dashboard" },
  { name: "Files Manager", icon: Folder, to: "/dashboard/files-manager" },
  { name: "Uploads", icon: Upload, to: "/dashboard/uploads" },
  { name: "Invites", icon: Mail, to: "/dashboard/invites" },
  { name: "Settings", icon: Settings, to: "/dashboard/settings" },
];

interface DashboardShellProps {
  children: React.ReactNode;
  appName: string;
  isAdmin: boolean;
  session: SessionData;
}

export function DashboardShell({
  children,
  appName,
  isAdmin,
  session,
}: DashboardShellProps) {
  return (
    <>
      <Sidebar
        title={appName}
        items={items}
        storageKey="sidebar-collapsed"
        useTooltips
        session={session}
        header={<Header session={session} />}
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
      <GlobalUploader />
    </>
  );
}
