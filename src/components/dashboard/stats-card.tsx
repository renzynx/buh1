import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatAction {
  label: string;
  href: string;
  variant?: "default" | "outline" | "secondary";
  icon?: LucideIcon;
}

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  progress?: {
    percentage: number;
    label: string;
  };
  actions?: StatAction[];
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  progress,
  actions,
}: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>

        {progress && (
          <>
            <div className="mt-3 h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {progress.label}
            </p>
          </>
        )}

        {description && !progress && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}

        {actions && actions.length > 0 && (
          <div className="mt-4 flex flex-col gap-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant ?? "default"}
                className="w-full"
                asChild
              >
                <a href={action.href}>
                  {action.icon && <action.icon className="mr-2 h-3.5 w-3.5" />}
                  {action.label}
                </a>
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
