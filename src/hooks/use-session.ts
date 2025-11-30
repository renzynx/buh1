import { useQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";

export function useSession() {
  const { data, isPending, refetch, isRefetching } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await authClient.getSession();

      return data;
    },
  });

  return {
    data,
    isPending,
    refetch,
    isRefetching,
  };
}
