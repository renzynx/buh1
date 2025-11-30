import {
  adminClient,
  customSessionClient,
  twoFactorClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";
import { ac, admin, superadmin, user } from "./permissions";

export const authClient = createAuthClient({
  plugins: [
    adminClient({
      ac,
      roles: {
        superadmin,
        admin,
        user,
      },
      adminRoles: ["superadmin"],
    }),
    twoFactorClient(),
    customSessionClient<typeof auth>(),
  ],
  user: {
    additionalFields: {
      apiKey: {
        type: "string",
        required: false,
        input: false,
      },
    },
  },
});
