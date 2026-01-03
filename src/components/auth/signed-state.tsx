"use client";

import type { ReactNode } from "react";
import { useSession } from "@/hooks/use-session";

interface AuthStateProps {
  children: ReactNode;
}

export function SignedIn({ children }: AuthStateProps) {
  const { data: session, isPending } = useSession();

  if (isPending || !session) return null;

  return <>{children}</>;
}

export function SignedOut({ children }: AuthStateProps) {
  const { data: session, isPending } = useSession();

  if (isPending || session) return null;

  return <>{children}</>;
}
