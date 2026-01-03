import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Camera, Check, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { SESSION_QUERY_KEY, useSession } from "@/hooks/use-session";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
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

export function AccountSettingsCards() {
  return (
    <div className="space-y-6">
      <ProfileCard />
      <EmailCard />
    </div>
  );
}

function ProfileCard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [name, setName] = useState(session?.user?.name ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const user = session?.user;

  const handleUpdateName = async () => {
    if (!name.trim() || name === user?.name) return;

    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const { error } = await authClient.updateUser({ name: name.trim() });
      if (error) {
        setError(error.message ?? "Failed to update name");
      } else {
        setSuccess(true);
        await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageLoading(true);
    setError("");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        const { error } = await authClient.updateUser({ image: base64 });
        if (error) {
          setError(error.message ?? "Failed to update avatar");
        } else {
          await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
        }
        setImageLoading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError("Failed to upload image");
      setImageLoading(false);
    }
  };

  const initials = getInitials(user?.name ?? user?.email ?? "U");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Update your profile information</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-3 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="flex items-center gap-6">
          <div className="relative">
            <Avatar className="h-20 w-20">
              {user?.image && (
                <AvatarImage src={user.image} alt={user.name ?? ""} />
              )}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <Button
              size="icon"
              variant="secondary"
              className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={imageLoading}
            >
              {imageLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Display Name</Label>
          <div className="flex gap-2">
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              disabled={isLoading}
            />
            <Button
              onClick={handleUpdateName}
              disabled={isLoading || !name.trim() || name === user?.name}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : success ? (
                <Check className="h-4 w-4" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmailCard() {
  const { data: session } = useSession();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState(session?.user?.email ?? "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const user = session?.user;

  const handleUpdateEmail = async () => {
    if (!email.trim() || email === user?.email) return;

    setError("");
    setSuccess(false);
    setIsLoading(true);

    try {
      const { error } = await authClient.changeEmail({
        newEmail: email.trim(),
      });
      if (error) {
        setError(error.message ?? "Failed to update email");
      } else {
        setSuccess(true);
        await queryClient.invalidateQueries({ queryKey: SESSION_QUERY_KEY });
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
        <CardTitle>Email</CardTitle>
        <CardDescription>Update your email address</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-3 text-sm text-destructive border border-destructive/20">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="flex gap-2">
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={isLoading}
            />
            <Button
              onClick={handleUpdateEmail}
              disabled={isLoading || !email.trim() || email === user?.email}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : success ? (
                <Check className="h-4 w-4" />
              ) : (
                "Save"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}
