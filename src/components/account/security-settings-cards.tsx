import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  EyeOff,
  Key,
  Loader2,
  LogOut,
  Monitor,
  RefreshCw,
  Shield,
  ShieldCheck,
  ShieldOff,
  Smartphone,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";
import { SESSION_QUERY_KEY, useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "../ui/input-otp";
import { Label } from "../ui/label";
import { Separator } from "../ui/separator";

export function SecuritySettingsCards() {
  return (
    <div className="space-y-6">
      <PasswordCard />
      <TwoFactorCard />
      <SessionsCard />
    </div>
  );
}

function PasswordCard() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      if (error) {
        setError(error.message ?? "Failed to change password");
      } else {
        setSuccess(true);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Password
        </CardTitle>
        <CardDescription>Change your account password</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-3 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="rounded-lg bg-green-500/10 p-3 flex items-start gap-3 text-sm text-green-600 border border-green-500/20">
            <Check className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>Password changed successfully</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="current-password">Current Password</Label>
          <div className="relative">
            <Input
              id="current-password"
              type={showCurrent ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowCurrent(!showCurrent)}
            >
              {showCurrent ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Input
              id="new-password"
              type={showNew ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
              onClick={() => setShowNew(!showNew)}
            >
              {showNew ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirm New Password</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <Button
          onClick={handleChangePassword}
          disabled={
            isLoading || !currentPassword || !newPassword || !confirmPassword
          }
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          Change Password
        </Button>
      </CardContent>
    </Card>
  );
}

function TwoFactorCard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [isEnabling, setIsEnabling] = useState(false);
  const [showEnableDialog, setShowEnableDialog] = useState(false);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [showBackupCodesDialog, setShowBackupCodesDialog] = useState(false);
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const is2FAEnabled = session?.user?.twoFactorEnabled;

  const handleEnable2FA = async () => {
    if (!password) return;
    setError("");
    setIsLoading(true);

    try {
      const { data, error } = await authClient.twoFactor.enable({
        password,
      });
      if (error) {
        setError(error.message ?? "Failed to enable 2FA");
        setIsLoading(false);
        return;
      }
      if (data) {
        setTotpURI(data.totpURI);
        setBackupCodes(data.backupCodes);
        setIsEnabling(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (code.length !== 6) return;
    setError("");
    setIsLoading(true);

    try {
      const { error } = await authClient.twoFactor.verifyTotp({ code });
      if (error) {
        setError(error.message ?? "Invalid code");
        setCode("");
        setIsLoading(false);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      setShowEnableDialog(false);
      setShowBackupCodesDialog(true);
      resetState();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!password) return;
    setError("");
    setIsLoading(true);

    try {
      const { error } = await authClient.twoFactor.disable({ password });
      if (error) {
        setError(error.message ?? "Failed to disable 2FA");
        setIsLoading(false);
        return;
      }
      await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
      setShowDisableDialog(false);
      resetState();
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegenerateBackupCodes = async () => {
    setError("");
    setIsLoading(true);

    try {
      const { data, error } = await authClient.twoFactor.generateBackupCodes({
        password,
      });
      if (error) {
        setError(error.message ?? "Failed to generate backup codes");
        setIsLoading(false);
        return;
      }
      if (data) {
        setBackupCodes(data.backupCodes);
        setShowBackupCodesDialog(true);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setPassword("");
    setCode("");
    setTotpURI(null);
    setError("");
    setIsEnabling(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {is2FAEnabled ? (
                <ShieldCheck className="h-8 w-8 text-green-500" />
              ) : (
                <ShieldOff className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {is2FAEnabled ? "2FA is enabled" : "2FA is not enabled"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {is2FAEnabled
                    ? "Your account is protected with an authenticator app"
                    : "Enable 2FA for enhanced security"}
                </p>
              </div>
            </div>
            {is2FAEnabled ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBackupCodesDialog(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Backup Codes
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDisableDialog(true)}
                >
                  Disable
                </Button>
              </div>
            ) : (
              <Button onClick={() => setShowEnableDialog(true)}>
                Enable 2FA
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showEnableDialog}
        onOpenChange={(open) => {
          setShowEnableDialog(open);
          if (!open) resetState();
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              {isEnabling
                ? "Scan the QR code with your authenticator app"
                : "Enter your password to continue"}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-3 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {!isEnabling ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="2fa-password">Password</Label>
                <Input
                  id="2fa-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <Button
                className="w-full"
                onClick={handleEnable2FA}
                disabled={isLoading || !password}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Continue
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {totpURI && (
                <div className="flex justify-center">
                  <div className="p-4 bg-white rounded-lg">
                    <QRCodeSVG value={totpURI} size={180} />
                  </div>
                </div>
              )}
              <div className="space-y-3">
                <Label className="text-center block">
                  Enter the 6-digit code
                </Label>
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={(value) => {
                      setCode(value);
                      if (value.length === 6) {
                        setTimeout(handleVerify2FA, 100);
                      }
                    }}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showDisableDialog}
        onOpenChange={(open) => {
          setShowDisableDialog(open);
          if (!open) resetState();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Disable Two-Factor Authentication?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the extra security layer from your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-3 text-sm text-destructive border border-destructive/20">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="disable-2fa-password">Enter your password</Label>
            <Input
              id="disable-2fa-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDisable2FA}
              disabled={isLoading || !password}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Disable 2FA
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BackupCodesDialog
        open={showBackupCodesDialog}
        onOpenChange={setShowBackupCodesDialog}
        codes={backupCodes}
        onRegenerate={is2FAEnabled ? handleRegenerateBackupCodes : undefined}
        password={password}
        setPassword={setPassword}
        isLoading={isLoading}
        error={error}
      />
    </>
  );
}

function BackupCodesDialog({
  open,
  onOpenChange,
  codes,
  onRegenerate,
  password,
  setPassword,
  isLoading,
  error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  codes: string[];
  onRegenerate?: () => void;
  password: string;
  setPassword: (password: string) => void;
  isLoading: boolean;
  error: string;
}) {
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(codes.join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
          setShowRegenerate(false);
          setPassword("");
        }
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Backup Codes</DialogTitle>
          <DialogDescription>
            Save these codes in a safe place. Each code can only be used once.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-3 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        {codes.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {codes.map((code, i) => (
                <div key={i} className="text-center py-1">
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleCopy}>
                {copied ? (
                  <Check className="h-4 w-4 mr-2" />
                ) : (
                  <Copy className="h-4 w-4 mr-2" />
                )}
                {copied ? "Copied!" : "Copy All"}
              </Button>
              {onRegenerate && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowRegenerate(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              )}
            </div>
          </>
        ) : showRegenerate && onRegenerate ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="regen-password">Enter your password</Label>
              <Input
                id="regen-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button
              className="w-full"
              onClick={onRegenerate}
              disabled={isLoading || !password}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Generate New Codes
            </Button>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p>No backup codes available.</p>
            {onRegenerate && (
              <Button
                variant="link"
                onClick={() => setShowRegenerate(true)}
                className="mt-2"
              >
                Generate backup codes
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SessionsCard() {
  const { data: currentSession } = useSession();
  const queryClient = useQueryClient();

  interface SessionItem {
    id: string;
    token: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    updatedAt: Date;
  }

  const sessionsQuery = useQuery({
    queryKey: ["sessions"],
    queryFn: async (): Promise<SessionItem[]> => {
      const { data, error } = await authClient.listSessions();
      if (error) throw error;
      return (data ?? []) as SessionItem[];
    },
  });

  const revokeSessionMutation = useMutation({
    mutationFn: async (token: string) => {
      await authClient.revokeSession({ token });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const revokeOthersMutation = useMutation({
    mutationFn: async () => {
      await authClient.revokeOtherSessions();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });

  const sessions = sessionsQuery.data ?? [];
  const isLoading = sessionsQuery.isPending;
  const revoking = revokeSessionMutation.isPending
    ? revokeSessionMutation.variables
    : revokeOthersMutation.isPending
      ? "others"
      : null;

  const getDeviceIcon = (userAgent?: string | null) => {
    if (!userAgent) return <Monitor className="h-5 w-5" />;
    const ua = userAgent.toLowerCase();
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    ) {
      return <Smartphone className="h-5 w-5" />;
    }
    return <Monitor className="h-5 w-5" />;
  };

  const getDeviceName = (userAgent?: string | null) => {
    if (!userAgent) return "Unknown Device";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Safari")) return "Safari";
    if (userAgent.includes("Edge")) return "Edge";
    return "Browser";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>
              Manage your active sessions across devices
            </CardDescription>
          </div>
          {sessions.length > 1 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => revokeOthersMutation.mutate()}
              disabled={revoking === "others"}
            >
              {revoking === "others" ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <LogOut className="h-4 w-4 mr-2" />
              )}
              Sign out others
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">
            No active sessions found
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session, index) => {
              const isCurrent =
                session.token === currentSession?.session?.token;
              return (
                <div key={session.id}>
                  {index > 0 && <Separator className="mb-3" />}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {getDeviceIcon(session.userAgent)}
                      </div>
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          {getDeviceName(session.userAgent)}
                          {isCurrent && (
                            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {session.ipAddress ?? "Unknown IP"} &bull;{" "}
                          {new Date(session.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {!isCurrent && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          revokeSessionMutation.mutate(session.token)
                        }
                        disabled={revoking === session.token}
                      >
                        {revoking === session.token ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <LogOut className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
