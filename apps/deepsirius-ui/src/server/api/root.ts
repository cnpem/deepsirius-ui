import { createTRPCRouter } from "~/server/api/trpc";
import { dbRouter } from "./routers/db";
import { deepsiriusJobRouter } from "./routers/deepsirius-job";
import { jobRouter } from "./routers/job";
import { sshRouter } from "./routers/ssh";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  ssh: sshRouter,
  db: dbRouter,
  job: jobRouter,
  deepsiriusJob: deepsiriusJobRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
