"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export interface UserButtonLink {
  href: string;
  label: string;
  icon?: ReactNode;
}

interface UserButtonProps {
  additionalLinks?: UserButtonLink[];
  size?: "default" | "icon";
  className?: string;
  disableDefaultLinks?: boolean;
}

export function UserButton({
  additionalLinks = [],
  size = "default",
  className,
}: UserButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user) return null;

  const user = session.user;
  const initials = getInitials(user.name ?? user.email ?? "U");

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/auth/sign-in");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            size === "icon" ? "h-9 w-9 rounded-full p-0" : "gap-2",
            className,
          )}
        >
          <Avatar className={size === "icon" ? "h-8 w-8" : "h-7 w-7"}>
            {user.image && (
              <AvatarImage src={user.image} alt={user.name ?? ""} />
            )}
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          {size !== "icon" && (
            <span className="max-w-[100px] truncate text-sm">
              {user.name ?? user.email}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {additionalLinks.map((link) => (
          <DropdownMenuItem
            key={link.href}
            className="cursor-pointer"
            onClick={() => router.push(link.href)}
          >
            {link.icon}
            <span>{link.label}</span>
          </DropdownMenuItem>
        ))}
        {additionalLinks.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="h-4 w-4" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
