import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, CopyCheck } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { toast } from "sonner";
import { useClipboard } from "@/hooks/use-clipboard";
import { useSession } from "@/hooks/use-session";
import { useTRPC } from "@/trpc/client";
import { LoadingToast } from "../loading-toast";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";

const RemoveApiKeyDialog = lazy(() => import("./remove-apikey-dialog"));

export const ApiKeyCard = () => {
  const [showApiKey, setShowApiKey] = useState(false);
  const { copied, copyToClipboard } = useClipboard();
  const { data: session } = useSession();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation(
    trpc.user.createApiKey.mutationOptions({
      onError: (error) => toast.error(error.message),
      onSuccess: (data) =>
        queryClient.setQueryData(["session"], (old: typeof session) => {
          if (!old) return old;
          return {
            ...old,
            user: {
              ...old.user,
              apiKey: data.apiKey,
            },
          };
        }),
    }),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h1 className="lg:text-xl md:text-xl text-lg font-bold mb-2">
            API Key
          </h1>
        </CardTitle>
        <CardDescription className="lg:text-sm md:text-sm text-xs">
          Your API key allows you to authenticate with third-party tools like
          ShareX to upload files directly to your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {session?.user?.apiKey ? (
          <Input
            type={showApiKey ? "text" : "password"}
            value={session.user.apiKey}
            readOnly
            onClick={() => setShowApiKey((prev) => !prev)}
            className="cursor-pointer"
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            You do not have an API key yet. Click the button below to generate
          </p>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        {session?.user?.apiKey ? (
          <div className="flex gap-2">
            <Suspense fallback={<LoadingToast />}>
              <RemoveApiKeyDialog />
            </Suspense>

            <Button
              onClick={() =>
                copyToClipboard(
                  session?.user?.apiKey!,
                  "API Key copied to clipboard",
                )
              }
            >
              {copied ? (
                <>
                  <CopyCheck className="mr-2 h-4 w-4" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy API Key
                </>
              )}
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => mutate()}
            disabled={isPending}
            isLoading={isPending}
          >
            Generate API Key
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
