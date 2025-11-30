import { AlertTriangle, Home, MoveLeft, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface GeneralErrorProps {
  error?: Error & { digest?: string };
  reset?: () => void;
  title?: string;
  description?: string;
}

export function GeneralError({
  error,
  reset,
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again later or contact support if the problem persists.",
}: GeneralErrorProps) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center space-y-6 pb-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-4 ring-8 ring-destructive/5">
              <AlertTriangle className="h-12 w-12 text-destructive" />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              {title}
            </CardTitle>
            <CardDescription className="text-balance">
              {error?.message || description}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          <Separator className="my-2" />
          {error?.digest && (
            <div className="mt-6 flex flex-col gap-2 text-center text-sm text-muted-foreground">
              <p className="font-mono text-xs">Error ID: {error.digest}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            className="w-full sm:w-auto gap-2 cursor-pointer"
            onClick={() => window.history.back()}
          >
            <MoveLeft className="h-4 w-4" />
            Go Back
          </Button>

          {reset && (
            <Button onClick={() => reset()} className="w-full sm:w-auto gap-2">
              <RotateCcw className="h-4 w-4" />
              Try Again
            </Button>
          )}

          {!reset && (
            <Button asChild className="w-full sm:w-auto gap-2">
              <a href="/">
                <Home className="h-4 w-4" />
                Back to Home
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
