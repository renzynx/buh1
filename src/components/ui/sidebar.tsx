"use client";

import { ChevronsLeft, ChevronsRight, InfinityIcon, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
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
import { cn, formatBytes } from "@/lib/utils";

export type NavItem = {
  name: string;
  icon: React.ElementType;
  to: string;
};

export type SessionData = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    role?: string | null;
    quota?: {
      usedQuota: number;
      quota: number;
    } | null;
  };
  session: Record<string, unknown>;
} | null;

type SidebarContextValue = {
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
};

const SidebarContext = createContext<SidebarContextValue | null>(null);

function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebarContext must be used within SidebarProvider");
  }
  return context;
}

type SidebarProps = {
  title: string;
  items: NavItem[];
  storageKey: string;
  children: React.ReactNode;
  header?: React.ReactNode;
  useTooltips?: boolean;
  separatorButton?: {
    label: string;
    icon: React.ElementType;
    href: string;
  };
  session?: SessionData;
  defaultUserQuota?: number;
};

const SidebarLink = forwardRef<
  HTMLAnchorElement,
  {
    item: NavItem;
    collapsed?: boolean;
    isActive: boolean;
    useTooltips?: boolean;
  } & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">
>(({ item, collapsed, isActive, useTooltips, ...props }, ref) => {
  const link = (
    <Link
      ref={ref}
      href={item.to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
        collapsed && "justify-center px-2",
      )}
      title={!useTooltips && collapsed ? item.name : undefined}
      {...props}
    >
      <item.icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span className="truncate">{item.name}</span>}
    </Link>
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
});
SidebarLink.displayName = "SidebarLink";

function SidebarCollapseButton() {
  const { isCollapsed, setIsCollapsed } = useSidebarContext();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsCollapsed(!isCollapsed)}
      className="h-8 w-8"
    >
      {isCollapsed ? (
        <ChevronsRight className="h-4 w-4" />
      ) : (
        <ChevronsLeft className="h-4 w-4" />
      )}
    </Button>
  );
}

function QuotaDisplay({
  quotaUsed,
  quotaTotal,
  isCollapsed,
}: {
  quotaUsed: number;
  quotaTotal: number;
  isCollapsed: boolean;
}) {
  const isUnlimited = quotaTotal === -1 || quotaTotal === Infinity;

  if (!isCollapsed) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Storage Used</span>
          <span>
            {formatBytes(quotaUsed)}
            {!isUnlimited && <> / {formatBytes(quotaTotal)}</>}
          </span>
        </div>
        {isUnlimited ? (
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
    );
  }

  return (
    <div className="flex justify-center">
      <HoverCard>
        <HoverCardTrigger asChild>
          <div className="cursor-pointer">
            {isUnlimited ? (
              <div className="text-xs text-muted-foreground">
                <InfinityIcon className="h-5 w-5" />
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
                {!isUnlimited && <> / {formatBytes(quotaTotal)}</>}
              </span>
            </div>
            {isUnlimited ? (
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
  );
}

function SidebarNav({
  items,
  isCollapsed,
  useTooltips,
  separatorButton,
  pathname,
}: {
  items: NavItem[];
  isCollapsed: boolean;
  useTooltips?: boolean;
  separatorButton?: SidebarProps["separatorButton"];
  pathname: string;
}) {
  return (
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
                  <Link
                    href={separatorButton.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground justify-center"
                  >
                    <separatorButton.icon className="h-5 w-5 shrink-0" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{separatorButton.label}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Link
              href={separatorButton.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                isCollapsed && "justify-center",
              )}
              title={isCollapsed ? separatorButton.label : undefined}
            >
              <separatorButton.icon className="h-5 w-5 shrink-0" />
              {!isCollapsed && (
                <span className="truncate">{separatorButton.label}</span>
              )}
            </Link>
          )}
        </>
      )}
    </nav>
  );
}

function MobileDrawer({
  items,
  pathname,
  separatorButton,
  quotaUsed,
  quotaTotal,
}: {
  items: NavItem[];
  pathname: string;
  separatorButton?: SidebarProps["separatorButton"];
  quotaUsed: number;
  quotaTotal: number;
}) {
  const isUnlimited = quotaTotal === -1 || quotaTotal === Infinity;

  return (
    <DrawerContent>
      <div className="mx-auto w-full max-w-sm">
        <DrawerHeader>
          <DrawerTitle>Navigation</DrawerTitle>
        </DrawerHeader>
        <div className="p-4 pb-8">
          <nav className="flex flex-col gap-2">
            {items.map((item) => (
              <DrawerClose key={item.name} asChild>
                <SidebarLink item={item} isActive={pathname === item.to} />
              </DrawerClose>
            ))}

            {separatorButton && (
              <>
                <div className="my-2 border-t" />
                <DrawerClose asChild>
                  <Link
                    href={separatorButton.href}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  >
                    <separatorButton.icon className="h-5 w-5 shrink-0" />
                    <span className="truncate">{separatorButton.label}</span>
                  </Link>
                </DrawerClose>
              </>
            )}
          </nav>

          <div className="mt-6 border-t pt-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Storage Used</span>
              <span>
                {formatBytes(quotaUsed)}
                {!isUnlimited && <> / {formatBytes(quotaTotal)}</>}
              </span>
            </div>

            {isUnlimited ? (
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
        </div>
      </div>
    </DrawerContent>
  );
}

export default function Sidebar({
  title,
  items,
  storageKey,
  children,
  header,
  useTooltips,
  separatorButton,
  session,
  defaultUserQuota = 0,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : false;
    } catch {
      return false;
    }
  });

  const pathname = usePathname();
  const quotaUsed = session?.user?.quota?.usedQuota ?? 0;
  const quotaTotal =
    session?.user?.quota?.quota === -1
      ? Infinity
      : (session?.user?.quota?.quota ?? defaultUserQuota);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(isCollapsed));
    } catch {
      // Ignore localStorage errors
    }
  }, [isCollapsed, storageKey]);

  const sidebarWidth = isCollapsed ? "w-[60px]" : "w-[240px]";
  const mainMargin = isCollapsed ? "md:ml-[60px]" : "md:ml-[240px]";

  return (
    <SidebarContext.Provider value={{ isCollapsed, setIsCollapsed }}>
      <Drawer>
        <div className="min-h-screen bg-background flex flex-col">
          {/* Desktop Sidebar */}
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
              <SidebarCollapseButton />
            </div>

            <SidebarNav
              items={items}
              isCollapsed={isCollapsed}
              useTooltips={useTooltips}
              separatorButton={separatorButton}
              pathname={pathname}
            />

            {quotaTotal !== undefined && (
              <div className="mt-auto border-t p-3">
                <QuotaDisplay
                  quotaUsed={quotaUsed}
                  quotaTotal={quotaTotal === Infinity ? -1 : quotaTotal}
                  isCollapsed={isCollapsed}
                />
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div
            className={cn(
              "flex-1 flex flex-col transition-all duration-300 ease-in-out",
              mainMargin,
            )}
          >
            {/* Mobile Header with Drawer Trigger */}
            <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
              <div className="flex h-16 items-center px-4">
                <DrawerTrigger asChild>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    size="icon"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </DrawerTrigger>
                <span className="ml-3 font-bold text-lg">{title}</span>
              </div>
            </header>

            {/* Desktop Header */}
            <div className="hidden md:block">{header}</div>

            <main className="flex-1 p-4">{children}</main>
          </div>

          {/* Mobile Drawer */}
          <MobileDrawer
            items={items}
            pathname={pathname}
            separatorButton={separatorButton}
            quotaUsed={quotaUsed}
            quotaTotal={quotaTotal === Infinity ? -1 : quotaTotal}
          />
        </div>
      </Drawer>
    </SidebarContext.Provider>
  );
}
