import { createTRPCRouter } from '~/server/api/trpc';
import { jobRouter } from './routers/job';
import { deepsiriusJobRouter } from './routers/deepsirius-job';
import { sshRouter } from './routers/ssh';
import { dbRouter } from './routers/db';
import { tbConsumerRouter } from './routers/tb_consumer';

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
  tbConsumer: tbConsumerRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
