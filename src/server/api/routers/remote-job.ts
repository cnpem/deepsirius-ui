import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '~/env.mjs';
import {
  createTRPCRouter,
  protectedProcedure,
  protectedSSHProcedure,
} from '~/server/api/trpc';
import { sbatchDummyContent, submitJob } from '~/server/remote-job';

export const remoteJobRouter = createTRPCRouter({
  test: protectedProcedure.mutation(async ({ ctx }) => {
    const privateKey = ctx.privateKey ?? '';
    const username = ctx.session.user.name ?? '';
    const jobId = await submitJob(
      privateKey,
      env.PRIVATE_KEY_PASSPHRASE,
      username,
      env.SSH_HOST,
      sbatchDummyContent,
    );
    return { jobId: jobId };
  }),
  create: protectedProcedure
    .input(
      z.object({
        jobName: z.string(),
        output: z.string(),
        error: z.string(),
        ntasks: z.number(),
        partition: z.string(),
        command: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${input.jobName}`,
        `#SBATCH --output=${input.output}`,
        `#SBATCH --error=${input.error}`,
        `#SBATCH --ntasks=${input.ntasks}`,
        `#SBATCH --partition=${input.partition}`,
        `${input.command}`,
      ].join('\n');

      // console.log('data: ', sbatchContent);

      const privateKey = ctx.privateKey ?? '';
      const username = ctx.session.user.name ?? '';

      const jobId = await submitJob(
        privateKey,
        env.PRIVATE_KEY_PASSPHRASE,
        username,
        env.SSH_HOST,
        sbatchContent,
      );
      return { jobId: jobId };
    }),
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
