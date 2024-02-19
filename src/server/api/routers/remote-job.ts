import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedSSHProcedure } from '~/server/api/trpc';

export const remoteJobRouter = createTRPCRouter({
  checkStatus: protectedSSHProcedure
    .input(
      z.object({
        jobId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const jobId = input.jobId;
      const connection = ctx.connection;

      const command = `sacct -j ${jobId}.batch --format=State --parsable2`;
      const { stdout, stderr } = await connection.execCommand(command);

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      // The output of the sacct command comes in two lines, the first line is the header and the second is the actual state: i.e. State\nRUNNING, State\nCOMPLETED, etc.
      const lines = stdout.trim().split('\n');
      const status = lines[1];
      return { jobStatus: status };
    }),
  cancel: protectedSSHProcedure
    .input(
      z.object({
        jobId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const jobId = input.jobId;
      const connection = ctx.connection;

      const command = `scancel ${jobId}`;
      const { stderr } = await connection.execCommand(command);

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      return { cancelStatus: 'CANCELLED' };
    }),
});
