import { ChevronsLeft, ChevronsRight, InfinityIcon, Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { usePageContext } from "vike-react/usePageContext";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useSession } from "@/hooks/use-session";
import { cn, formatBytes } from "@/lib/utils";

export type NavItem = {
  name: string;
  icon: React.ElementType;
  to: string;
};

type SidebarProps = {
  title: string;
  items: NavItem[];
  storageKey: string;
  children: React.ReactNode;
  useTooltips?: boolean;
  separatorButton?: {
    label: string;
    icon: React.ElementType;
    href: string;
  };
};

function SidebarLink({
  item,
  collapsed,
  isActive,
  useTooltips,
}: {
  item: NavItem;
  collapsed?: boolean;
  isActive: boolean;
  useTooltips?: boolean;
}) {
  const link = (
    <a
      href={item.to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2",
      )}
      title={!useTooltips && collapsed ? item.name : undefined}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.name}</span>}
    </a>
  );

  if (collapsed && useTooltips) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.name}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return link;
}

export default function Sidebar({
  title,
  items,
  storageKey,
  children,
  useTooltips,
  separatorButton,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage<boolean>(
    storageKey,
    false,
  );
  const [mounted, setMounted] = useState(false);
  const { data: session } = useSession();
  const { urlPathname: pathname, settings } = usePageContext();
  const quotaUsed = session?.user?.quota?.usedQuota ?? 0;
  const quotaTotal =
    session?.user?.quota?.quota === -1
      ? Infinity
      : (session?.user?.quota?.quota ?? settings.defaultUserQuota);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
  };

  const sidebarWidth = isCollapsed ? "w-[60px]" : "w-[240px]";
  const mainMargin = isCollapsed ? "md:ml-[60px]" : "md:ml-[240px]";

  if (!mounted) return null;

  return (
    <Drawer>
      <div className="min-h-screen bg-background flex flex-col">
        <aside
          className={cn(
            "fixed top-0 left-0 z-30 h-screen border-r bg-card transition-all duration-300 ease-in-out hidden md:flex flex-col",
            sidebarWidth,
          )}
        >
          <div
            className={cn(
              "flex h-16 items-center border-b px-3",
              isCollapsed ? "justify-center" : "justify-between",
            )}
          >
            {!isCollapsed && (
              <span className="font-bold text-lg px-2">{title}</span>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={toggleCollapse}
              className="h-8 w-8"
            >
              {isCollapsed ? (
                <ChevronsRight className="h-4 w-4" />
              ) : (
                <ChevronsLeft className="h-4 w-4" />
              )}
            </Button>
          </div>

          <nav className="flex flex-col gap-1 p-2 mt-4">
            {items.map((item) => (
              <SidebarLink
                key={item.name}
                item={item}
                collapsed={isCollapsed}
                isActive={pathname === item.to}
                useTooltips={useTooltips}
              />
            ))}

            {separatorButton && (
              <>
                <div className="my-2 border-t" />
                {isCollapsed && useTooltips ? (
                  <TooltipProvider>
                    <Tooltip delayDuration={0}>
                      <TooltipTrigger asChild>
                        <a
                          href={separatorButton.href}
                          className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        >
                          <separatorButton.icon className="h-5 w-5 shrink-0" />
                        </a>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>{separatorButton.label}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <a
                    href={separatorButton.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    title={isCollapsed ? separatorButton.label : undefined}
                  >
                    <separatorButton.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && (
                      <span className="truncate">{separatorButton.label}</span>
                    )}
                  </a>
                )}
              </>
            )}
          </nav>

          {quotaTotal !== undefined && (
            <div className="mt-auto border-t p-3">
              {!isCollapsed ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Storage Used</span>
                    <span>
                      {formatBytes(quotaUsed)}
                      {quotaTotal !== Infinity && (
                        <> / {formatBytes(quotaTotal)}</>
                      )}
                    </span>
                  </div>
                  {quotaTotal === Infinity ? (
                    <div className="text-xs text-center text-muted-foreground py-1">
                      Unlimited Storage
                    </div>
                  ) : (
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${Math.min((quotaUsed / quotaTotal) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex justify-center">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div>
                        {quotaTotal === Infinity ? (
                          <div className="text-xs text-muted-foreground">
                            <InfinityIcon />
                          </div>
                        ) : (
                          <div className="relative w-8 h-8">
                            <svg className="w-8 h-8 transform -rotate-90">
                              <circle
                                cx="16"
                                cy="16"
                                r="14"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                className="text-secondary"
                              />
                              <circle
                                cx="16"
                                cy="16"
                                r="14"
                                stroke="currentColor"
                                strokeWidth="3"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 14}`}
                                strokeDashoffset={`${2 * Math.PI * 14 * (1 - Math.min(quotaUsed / quotaTotal, 1))}`}
                                className="text-primary transition-all duration-300"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent side="right">
                      <div className="space-y-2 w-56">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Storage Used</span>
                          <span>
                            {formatBytes(quotaUsed)}
                            {quotaTotal !== Infinity && (
                              <> / {formatBytes(quotaTotal)}</>
                            )}
                          </span>
                        </div>
                        {quotaTotal === Infinity ? (
                          <div className="text-xs text-center text-muted-foreground py-1">
                            Unlimited Storage
                          </div>
                        ) : (
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-300"
                              style={{
                                width: `${Math.min((quotaUsed / quotaTotal) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              )}
            </div>
          )}
        </aside>

        <div
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out",
            mainMargin,
          )}
        >
          <Header
            leftSection={
              <div className="md:hidden mr-2">
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    size="icon"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
              </div>
            }
          />

          <main className="flex-1 p-4">{children}</main>
        </div>

        <DrawerContent>
          <div className="mx-auto w-full max-w-sm">
            <DrawerHeader>
              <DrawerTitle>Navigation</DrawerTitle>
            </DrawerHeader>
            <div className="p-4 pb-8">
              <nav className="flex flex-col gap-2">
                {items.map((item) => (
                  <SidebarLink
                    key={item.name}
                    item={item}
                    isActive={pathname === item.to}
                    useTooltips={useTooltips}
                  />
                ))}

                {separatorButton && (
                  <>
                    <div className="my-2 border-t" />
                    {useTooltips ? (
                      <TooltipProvider>
                        <Tooltip delayDuration={0}>
                          <TooltipTrigger asChild>
                            <a
                              href={separatorButton.href}
                              className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            >
                              <separatorButton.icon className="h-5 w-5 shrink-0" />
                              <span className="truncate">
                                {separatorButton.label}
                              </span>
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{separatorButton.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <a
                        href={separatorButton.href}
                        className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      >
                        <separatorButton.icon className="h-5 w-5 shrink-0" />
                        <span className="truncate">
                          {separatorButton.label}
                        </span>
                      </a>
                    )}
                  </>
                )}
              </nav>

              {quotaTotal !== undefined && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>Storage Used</span>
                    <span>
                      {formatBytes(quotaUsed)}
                      {quotaTotal !== Infinity && (
                        <> / {formatBytes(quotaTotal)}</>
                      )}
                    </span>
                  </div>

                  {quotaTotal === Infinity ? (
                    <div className="text-sm text-center text-muted-foreground py-1">
                      Unlimited Storage
                    </div>
                  ) : (
                    <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                          width: `${Math.min((quotaUsed / quotaTotal) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </DrawerContent>
      </div>
    </Drawer>
  );
}
