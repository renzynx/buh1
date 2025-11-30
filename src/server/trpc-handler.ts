import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import {
  enhance,
  type Get,
  type UniversalHandler,
} from "@universal-middleware/core";
import { auth } from "@/lib/auth";
import { appRouter } from "../trpc/router";

export const trpcHandler = ((endpoint) =>
  enhance(
    (request, context, runtime) => {
      return fetchRequestHandler({
        endpoint,
        req: request,
        router: appRouter,
        createContext: async ({ req, resHeaders }) => {
          return {
            ...context,
            ...runtime,
            req,
            resHeaders,
            session: await auth.api.getSession({ headers: req.headers }),
          };
        },
      });
    },
    {
      name: "buh:trpc-handler",
      path: `${endpoint}/**`,
      method: ["GET", "POST"],
      immutable: false,
    },
  )) satisfies Get<[endpoint: string], UniversalHandler>;
