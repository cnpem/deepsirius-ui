import { exampleRouter } from '~/server/api/routers/example';
import { createTRPCRouter } from '~/server/api/trpc';

import { remoteJobRouter } from './routers/remote-job';
import { workspaceRouter } from './routers/workspace-router';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  remotejob: remoteJobRouter,
  workspace: workspaceRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
