import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  folder: ["create", "read", "update", "delete", "share", "move"],
  file: ["create", "read", "update", "delete", "share", "move", "download"],
} as const;

export const ac = createAccessControl(statement);

export const superadmin = ac.newRole({
  ...adminAc.statements,
  folder: ["create", "read", "update", "delete", "share", "move"],
  file: ["create", "read", "update", "delete", "share", "move", "download"],
});

export const admin = ac.newRole({
  user: ["list", "impersonate", "delete", "set-password"],
  session: ["list", "revoke", "delete"],
  folder: ["read", "delete"],
  file: ["read", "delete", "download"],
});

export const user = ac.newRole({
  user: [],
  session: [],
  folder: ["create", "read", "update", "delete", "share", "move"],
  file: ["create", "read", "update", "delete", "share", "move", "download"],
});
