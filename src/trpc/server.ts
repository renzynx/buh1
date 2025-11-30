import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { db } from "@/database";
import type { auth } from "@/lib/auth";

const t = initTRPC
  .context<{
    db: typeof db;
    session: Awaited<ReturnType<typeof auth.api.getSession>>;
  }>()
  .create({
    transformer: superjson,
  });

export const router = t.router;
export const publicProcedure = t.procedure;

export const authenticatedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

export const adminProcedure = authenticatedProcedure.use(
  async ({ ctx, next }) => {
    if (
      !ctx.session.user.role ||
      (ctx.session.user.role !== "admin" &&
        ctx.session.user.role !== "superadmin")
    ) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  },
);

export const superAdminProcedure = authenticatedProcedure.use(
  async ({ ctx, next }) => {
    if (!ctx.session.user.role || ctx.session.user.role !== "superadmin") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You do not have permission to access this resource.",
      });
    }

    return next();
  },
);
