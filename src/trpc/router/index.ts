import { router } from "../server";
import { adminRouter } from "./admin";
import { userRouter } from "./user";

export const appRouter = router({
  user: userRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
