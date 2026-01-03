import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { tusServer } from "@/lib/tus/tus-server";

async function handler(req: Request) {
  const headersList = await headers();
  const session = await auth.api.getSession({
    headers: headersList,
  });

  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }

  return tusServer.handleWeb(req);
}

export {
  handler as GET,
  handler as POST,
  handler as PATCH,
  handler as HEAD,
  handler as DELETE,
  handler as OPTIONS,
};
