import { cn } from "@/lib/utils";
import { ModeToggle } from "../mode-toggle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  description: string;
  className?: string;
}

export function AuthCard({
  children,
  title,
  description,
  className,
}: AuthCardProps) {
  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />

      {/* Theme toggle */}
      <div className="absolute top-4 right-4">
        <ModeToggle />
      </div>

      {/* Auth card */}
      <Card
        className={cn(
          "relative w-full max-w-md backdrop-blur-sm bg-card/95 shadow-2xl border-border/50",
          className,
        )}
      >
        <CardHeader className="space-y-3 text-center pb-6">
          <div className="mx-auto w-fit">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/20">
              <svg
                className="h-8 w-8 text-primary-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
            </div>
          </div>
          <div className="space-y-1.5">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-base">
              {description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pb-8">{children}</CardContent>
      </Card>
    </div>
  );
}
