import { createTRPCRouter } from '~/server/api/trpc';

import { remoteFilesRouter } from './routers/remote-files';
import { remoteJobRouter } from './routers/remote-job';
import { remoteProcessRouter } from './routers/remote-node-process-router';
import { workspaceDbStateRouter } from './routers/workspace-db-state-router';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  remotejob: remoteJobRouter,
  remotefiles: remoteFilesRouter,
  workspaceDbState: workspaceDbStateRouter,
  remoteProcess: remoteProcessRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
