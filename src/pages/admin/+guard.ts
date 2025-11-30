import { redirect } from "vike/abort";
import type { PageContextServer } from "vike/types";

export const guard = (pageContext: PageContextServer) => {
  const { session } = pageContext;

  if (session === null) {
    throw redirect("/auth/sign-in");
  }

  if (session.user.role !== "admin" && session.user.role !== "superadmin") {
    throw redirect("/dashboard");
  }
};
