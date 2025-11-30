import "dotenv/config";
import type { PageContextServer } from "vike/types";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export async function onCreatePageContext(pageContext: PageContextServer) {
  const isPrerendering = !pageContext.runtime;

  let settings: Awaited<ReturnType<typeof getSettings>>;
  let session: Awaited<ReturnType<typeof auth.api.getSession>> | null;

  if (isPrerendering) {
    try {
      settings = await getSettings();
    } catch (_error) {
      console.warn(
        "[prerender] Database not available, using default settings",
      );
      settings = {
        requireInvite: false,
        signUpEnabled: true,
        blacklistedExtensions: "",
        defaultUserFileCountQuota: 1000,
        defaultUserQuota: 1024 * 1024 * 1024,
        maxInviteAge: 1000 * 60 * 60 * 24 * 7,
        allowUserCreateInvites: true,
        defaultInvitesQuota: 10,
        uploadFileChunkSize: 1024 * 1024 * 25,
        uploadFileMaxSize: 1024 * 1024 * 1024 * 5,
        cdnUrl: "",
      };
    }
    session = null;
  } else {
    [settings, session] = await Promise.all([
      getSettings(),
      auth.api.getSession({
        headers: new Headers(
          pageContext.runtime.req!.headers as Record<string, string>,
        ),
      }),
    ]);
  }

  pageContext.session = session ? session : null;
  pageContext.settings = settings;
  pageContext.baseUrl = process.env.AUTH_BASE_URL!;
  pageContext.appName = process.env.APP_NAME || "Buh";
}
