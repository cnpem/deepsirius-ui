import { exampleRouter } from '~/server/api/routers/example';
import { createTRPCRouter } from '~/server/api/trpc';

import { remoteFilesRouter } from './routers/remote-files';
import { remoteJobRouter } from './routers/remote-job';
import { workspaceStateRouter } from './routers/workspace-state-router';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  example: exampleRouter,
  remotejob: remoteJobRouter,
  remotefiles: remoteFilesRouter,
  workspaceState: workspaceStateRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
