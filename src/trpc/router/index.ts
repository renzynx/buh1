import { router } from "../init";
import { adminRouter } from "./admin";
import { userRouter } from "./user";

export const appRouter = router({
  user: userRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
