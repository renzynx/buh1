import type { PageContext } from "vike/types";

export function title(pageContext: PageContext) {
  const { is404 } = pageContext;

  if (is404) {
    return "404 - Page Not Found";
  }

  return "Error - Something went wrong";
}
