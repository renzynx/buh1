import "server-only";

import type { QueryKey } from "@tanstack/react-query";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { cache } from "react";
import { db } from "@/database";
import { auth } from "@/lib/auth";
import { makeQueryClient } from "./query-client";
import { appRouter } from "./router";

export async function createTRPCContext(headersOrRequest: Headers | Request) {
  const headers =
    headersOrRequest instanceof Request
      ? headersOrRequest.headers
      : headersOrRequest;

  const session = await auth.api.getSession({
    headers,
  });

  return { db, session };
}

export const getQueryClient = cache(makeQueryClient);

export const getHeaders = cache(async () => {
  const { headers } = await import("next/headers");
  return headers();
});

export const trpc = createTRPCOptionsProxy({
  ctx: async () => {
    const h = await getHeaders();
    return createTRPCContext(h);
  },
  router: appRouter,
  queryClient: getQueryClient,
});

export function HydrateClient(props: { children: React.ReactNode }) {
  const queryClient = getQueryClient();
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {props.children}
    </HydrationBoundary>
  );
}

// biome-ignore lint/suspicious/noExplicitAny: prefetch accepts various query option types
export function prefetch(queryOptions: {
  queryKey: QueryKey;
  [key: string]: any;
}) {
  const queryClient = getQueryClient();
  const key = queryOptions.queryKey as [unknown, { type?: string }?];
  if (key[1]?.type === "infinite") {
    void queryClient.prefetchInfiniteQuery(queryOptions as any);
  } else {
    void queryClient.prefetchQuery(queryOptions as any);
  }
}

export const createCaller = appRouter.createCaller;

export const SESSION_QUERY_KEY = ["session"] as const;

export async function prefetchSession() {
  const queryClient = getQueryClient();
  const h = await getHeaders();

  const session = await queryClient.fetchQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: () => auth.api.getSession({ headers: h }),
    staleTime: 1000 * 60 * 5,
  });

  return session;
}
