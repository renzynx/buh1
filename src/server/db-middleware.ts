import { enhance, type UniversalMiddleware } from "@universal-middleware/core";
import { db } from "../database";

declare global {
  namespace Universal {
    interface Context {
      db: typeof db;
    }
  }
}

export const dbMiddleware: UniversalMiddleware = enhance(
  async (_request, context, _runtime) => {
    return {
      ...context,
      db,
    };
  },
  {
    name: "buh:db-middleware",
    immutable: false,
  },
);
