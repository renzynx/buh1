import { useMutation, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { reload } from "vike/client/router";
import { useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { BetterAuthIcon } from "./ui/better-auth-icon";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export const ImpersonatingMenu = () => {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: async () => {
      return authClient.admin.stopImpersonating();
    },
    onSuccess: async ({ error, data }) => {
      if (error) {
        toast.error(`Error stopping impersonation: ${error.message}`);
        return;
      }

      queryClient.clear();

      await reload();

      toast.success(`Logged back in to ${data.user.email}`);
    },
  });

  const handleStopImpersonating = () => {
    mutate();
  };

  return (
    session?.session?.impersonatedBy && (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            className="fixed right-6 bottom-6 rounded-full"
            size="icon-lg"
          >
            <BetterAuthIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="left">
          <DropdownMenuItem onSelect={handleStopImpersonating}>
            <LogOut className="mr-2 size-4" />
            Stop Impersonating
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  );
};
