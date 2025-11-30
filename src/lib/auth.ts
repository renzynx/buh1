import "dotenv/config";
import fs from "node:fs/promises";
import { APIError, type BetterAuthOptions } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { betterAuth } from "better-auth/minimal";
import {
  admin as betterAuthAdmin,
  createAuthMiddleware,
  customSession,
  twoFactor,
} from "better-auth/plugins";
import { count, eq } from "drizzle-orm";
import { db } from "@/database";
import * as schema from "@/database/schema";
import { ac, admin, superadmin, user } from "./permissions";
import { getSettings } from "./settings";

const options = {
  appName: process.env.APP_NAME || "Buh",
  secret: process.env.AUTH_SECRET,
  baseURL: process.env.AUTH_BASE_URL,
  trustedOrigins: process.env.AUTH_BASE_URL
    ? [process.env.AUTH_BASE_URL]
    : undefined,
  experimental: {
    joins: true,
  },
  advanced: {
    cookiePrefix: "__bauth",
    ipAddress: {
      ipAddressHeaders: [
        "x-forwarded-for",
        "x-real-ip",
        "cf-connecting-ip",
        "true-client-ip",
      ],
    },
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
  },
  hooks: {
    before: createAuthMiddleware(async ({ path, request }) => {
      if (path === "/sign-up/email") {
        const settings = await getSettings();

        if (!settings.signUpEnabled) {
          throw new APIError("FORBIDDEN", {
            message: "User sign-up is disabled at the moment.",
          });
        }
      }

      if (path.includes("/delete-user")) {
        const session = await auth.api.getSession({
          headers: request!.headers,
        });

        if (!session) {
          throw new APIError("UNAUTHORIZED");
        }

        // Prevent deleting the last admin or superadmin user
        if (
          session.user.role === "admin" ||
          session.user.role === "superadmin"
        ) {
          const result = await db
            .select({
              count: count(schema.user.id),
            })
            .from(schema.user)
            .where(eq(schema.user.role, session.user.role))
            .get();

          if (result!.count <= 1) {
            throw new APIError("FORBIDDEN", {
              message: `Cannot delete the only ${session.user.role} user.`,
            });
          }
        }
      }
    }),
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          const [settings, result] = await Promise.all([
            getSettings(),
            db
              .select()
              .from(schema.configStore)
              .where(eq(schema.configStore.key, "admin_onboarded"))
              .get(),
          ]);

          const isOnboarded = result?.value === "true";

          if (settings.requireInvite) {
            const invite = ctx?.body?.invite as string | undefined;

            if (!invite) {
              throw new APIError("BAD_REQUEST", {
                message: "Invite code is required for registration.",
              });
            }

            const inviteRecord = await db
              .select()
              .from(schema.invites)
              .where(eq(schema.invites.code, invite))
              .get();

            if (
              !inviteRecord ||
              (inviteRecord.expiresAt && inviteRecord.expiresAt < new Date()) ||
              inviteRecord.usedBy !== null
            ) {
              throw new APIError("BAD_REQUEST", {
                message: "Invite code is invalid or has expired.",
              });
            }
          }

          return {
            data: {
              ...user,
              role: isOnboarded ? "user" : "superadmin",
            },
          };
        },
        after: async (user, ctx) => {
          const updates: Promise<unknown>[] = [];
          const inviteCode = ctx?.body?.invite as string | undefined;

          if (inviteCode) {
            updates.push(
              db
                .update(schema.invites)
                .set({
                  usedBy: user.id,
                  usedAt: new Date(),
                })
                .where(eq(schema.invites.code, inviteCode))
                .execute(),
            );
          }

          if (user.role === "superadmin") {
            updates.push(
              db
                .insert(schema.configStore)
                .values({
                  key: "admin_onboarded",
                  value: "true",
                })
                .onConflictDoNothing()
                .execute(),
            );
          }

          updates.push(
            getSettings().then((settings) =>
              db.insert(schema.userQuota).values({
                userId: user.id,
                quota:
                  user.role === "superadmin" ? -1 : settings.defaultUserQuota,
                fileCountQuota:
                  user.role === "superadmin"
                    ? -1
                    : settings.defaultUserFileCountQuota,
                inviteQuota:
                  user.role === "superadmin"
                    ? -1
                    : settings.defaultInvitesQuota,
              }),
            ),
          );

          await Promise.all(updates);
        },
      },
      delete: {
        before: async (user) => {
          const userFiles = await db
            .select({ id: schema.files.id })
            .from(schema.files)
            .where(eq(schema.files.userId, user.id));

          // Run in background to avoid blocking the request
          setImmediate(async () => {
            const BATCH_SIZE = 20;
            for (let i = 0; i < userFiles.length; i += BATCH_SIZE) {
              const batch = userFiles.slice(i, i + BATCH_SIZE);
              await Promise.allSettled(
                batch.map((file) =>
                  fs.unlink(`./storage/${file.id}`).catch(() => {
                    // Ignore missing files or permission errors
                  }),
                ),
              );
            }
          });
        },
      },
    },
  },
  user: {
    deleteUser: {
      enabled: true,
    },
    additionalFields: {
      apiKey: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    betterAuthAdmin({
      ac,
      roles: {
        superadmin,
        admin,
        user,
      },
      adminRoles: ["superadmin"],
    }),
    twoFactor(),
  ],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }) => {
      const userQuota = await db.query.userQuota.findFirst({
        where: (userQuota, { eq }) => eq(userQuota.userId, user.id),
      });

      return {
        session,
        user: {
          ...user,
          quota: userQuota,
        },
      };
    }, options),
  ],
});
