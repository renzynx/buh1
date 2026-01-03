"use client";

import { LayoutDashboard, ShieldUser, UserCog } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { UserButton } from "@/components/auth/user-button";
import type { SessionData } from "@/components/ui/sidebar";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";

interface HeaderProps {
  leftSection?: ReactNode;
  session?: SessionData;
}

export default function Header({ leftSection, session }: HeaderProps) {
  const links = useMemo(() => {
    const baseLinks = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard className="h-4 w-4" />,
      },
    ];

    if (
      session?.user?.role === "admin" ||
      session?.user?.role === "superadmin"
    ) {
      baseLinks.push({
        href: "/admin",
        label: "Management",
        icon: <ShieldUser className="h-4 w-4" />,
      });
    }

    baseLinks.push({
      href: "/account/settings",
      label: "Account Settings",
      icon: <UserCog className="h-4 w-4" />,
    });

    return baseLinks;
  }, [session?.user?.role]);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-4">
        {leftSection}
        <div className="ml-auto flex items-center gap-4">
          <ModeToggle />
          <div className="flex items-center gap-2">
            {session ? (
              <UserButton
                size="icon"
                className="size-9"
                disableDefaultLinks
                additionalLinks={links}
              />
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <a href="/auth/sign-in">Sign In</a>
                </Button>
                <Button asChild size="sm">
                  <a href="/auth/sign-up">Sign Up</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
