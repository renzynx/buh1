import type { getSettings } from "@/lib/settings";
import type { Session } from "@/lib/types";

declare global {
  namespace Vike {
    interface PageContext {
      session: Session | null;
      settings: Awaited<ReturnType<typeof getSettings>>;
      baseUrl: string;
      appName: string;
    }
    interface Photon {
      server: "hono";
    }
  }
}
