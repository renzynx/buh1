import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { SESSION_QUERY_KEY, useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export function DeleteAccountCard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const userEmail = session?.user?.email ?? "";
  const expectedConfirm = "delete my account";

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== expectedConfirm) {
      setError(`Please type "${expectedConfirm}" to confirm`);
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      const { error } = await authClient.deleteUser({ password });
      if (error) {
        setError(error.message ?? "Failed to delete account");
        setIsLoading(false);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      router.push("/auth/sign-in");
    } catch {
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setPassword("");
    setConfirmText("");
    setError("");
  };

  return (
    <Card className="border-destructive/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" />
          Delete Account
        </CardTitle>
        <CardDescription>
          Permanently delete your account and all associated data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
          <p className="text-sm text-destructive font-medium mb-2">
            Warning: This action is irreversible
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>All your files will be permanently deleted</li>
            <li>Your account data will be removed</li>
            <li>Any active sessions will be terminated</li>
          </ul>
        </div>

        <AlertDialog
          open={open}
          onOpenChange={(open) => {
            setOpen(open);
            if (!open) resetState();
          }}
        >
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="mt-4">
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete your account ({userEmail}) and all
                your data. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>

            {error && (
              <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-3 text-sm text-destructive border border-destructive/20">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="delete-password">Your Password</Label>
                <Input
                  id="delete-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="delete-confirm">
                  Type{" "}
                  <span className="font-mono font-bold">{expectedConfirm}</span>{" "}
                  to confirm
                </Label>
                <Input
                  id="delete-confirm"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder={expectedConfirm}
                  disabled={isLoading}
                />
              </div>
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={
                  isLoading ||
                  !password ||
                  confirmText.toLowerCase() !== expectedConfirm
                }
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Delete Account
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
