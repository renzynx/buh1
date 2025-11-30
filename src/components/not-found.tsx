import { FileQuestion, Home, MoveLeft } from "lucide-react";
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

export function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-none shadow-none sm:border sm:shadow-sm">
        <CardHeader className="text-center space-y-6 pb-2">
          <div className="flex justify-center">
            <div className="rounded-full bg-muted p-4 ring-8 ring-muted/30">
              <FileQuestion className="h-12 w-12 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <CardTitle className="text-3xl font-bold tracking-tight">
              Page not found
            </CardTitle>
            <CardDescription className="text-balance">
              Sorry, we couldn't find the page you're looking for. It might have
              been removed, renamed, or doesn't exist.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="pb-6">
          <Separator className="my-2" />
          <div className="mt-6 flex flex-col gap-2 text-center text-sm text-muted-foreground">
            <p>Error Code: 404</p>
          </div>
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

          <Button asChild className="w-full sm:w-auto gap-2">
            <a href="/">
              <Home className="h-4 w-4" />
              Back to Home
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
