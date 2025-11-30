import type { Config } from "vike/types";
import vikePhoton from "vike-photon/config";
import vikeReact from "vike-react/config";
import vikeReactQuery from "vike-react-query/config";
import vikeReactZustand from "vike-react-zustand/config";

export default {
  title: "Buh",
  description: "A file storage app",
  extends: [vikeReact, vikePhoton, vikeReactQuery, vikeReactZustand],
  photon: {
    server: "../server/entry.ts",
  },
  passToClient: ["session", "settings", "baseUrl", "appName"],
} satisfies Config;
