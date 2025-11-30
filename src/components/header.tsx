import { UserButton } from "@daveyplate/better-auth-ui";
import { LayoutDashboard, ShieldUser, UserCog } from "lucide-react";
import { type ReactNode, useMemo } from "react";
import { useSession } from "@/hooks/use-session";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";

export default function Header({ leftSection }: { leftSection?: ReactNode }) {
  const { data: session, isPending } = useSession();
  const links = useMemo(() => {
    const baseLinks = [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: <LayoutDashboard />,
      },
    ];

    if (
      session?.user?.role === "admin" ||
      session?.user?.role === "superadmin"
    ) {
      baseLinks.push({
        href: "/admin",
        label: "Management",
        icon: <ShieldUser />,
      });
    }

    baseLinks.push({
      href: "/account/settings",
      label: "Account Settings",
      icon: <UserCog />,
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
            {isPending ? (
              <Skeleton className="h-8 w-20 rounded-md" />
            ) : session ? (
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
