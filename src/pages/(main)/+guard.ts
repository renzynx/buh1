import { render } from "vike/abort";
import type { PageContextServer } from "vike/types";

export const guard = (pageContext: PageContextServer) => {
  const { session } = pageContext;

  if (session === null) {
    throw render("/auth/sign-in", {
      message: "You must be signed in to access this page!",
      redirectTo: pageContext.urlPathname,
    });
  }
};
