// This router is responsible for handling request from node components that need to change the remote filesystem using ssh commands
import { z } from 'zod';
import { env } from '~/env.mjs';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { removeRemoteFiles } from '~/server/remote-job';

export const remoteFilesRouter = createTRPCRouter({
  remove: protectedProcedure
    .input(
      z.object({
        path: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const privateKey = ctx.privateKey ?? '';
      const username = ctx.session.user.name ?? '';
      const output = await removeRemoteFiles(
        privateKey,
        env.PRIVATE_KEY_PASSPHRASE,
        username,
        env.SSH_HOST,
        input.path,
      );
      return { output: output };
    }),
});
