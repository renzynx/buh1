"use client";

import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export const SESSION_QUERY_KEY = ["session"] as const;

export function useSession() {
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    data: query.data,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}

export function useSuspenseSession() {
  const query = useSuspenseQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    data: query.data,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
