import { z } from 'zod';
import { env } from '~/env.mjs';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import {
  cancelJob,
  checkJobState,
  sbatchDummyContent,
  submitJob,
} from '~/server/remote-job';

export const remoteJobRouter = createTRPCRouter({
  submit: protectedProcedure.query(async ({ ctx }) => {
    const sshKeyPath = ctx.sshKeyPath ?? '';
    const username = ctx.session.user.name ?? '';

    const jobId = await submitJob(
      sshKeyPath,
      username,
      env.SSH_HOST,
      sbatchDummyContent,
    );
    return { jobId: jobId };
  }),
});
