import { createTRPCRouter } from '~/server/api/trpc';
import { remoteJobRouter } from './routers/remote-job';
import { remoteProcessRouter } from './routers/remote-node-process-router';
import { sshRouter } from './routers/ssh';
import { workspaceDbStateRouter } from './routers/workspace-db-state-router';

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  ssh: sshRouter,
  remotejob: remoteJobRouter,
  workspaceDbState: workspaceDbStateRouter,
  remoteProcess: remoteProcessRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
