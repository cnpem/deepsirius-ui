import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '~/env.mjs';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

const TensorboardResponseSchema = z.object({
  logdir: z.string(),
  name: z.string(),
  url: z.string(),
  pid: z.number(),
});

export const tbConsumerRouter = createTRPCRouter({
  start: protectedProcedure
    .input(
      z.object({
        logdir: z.string(),
        name: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const url = `${env.TENSORBOARD_API_URL}/api/tensorboard/start`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.TENSORBOARD_API_KEY,
        },
        body: JSON.stringify(input),
      });

      const data: unknown = await res.json();

      if (!res.ok) {
        const error = z
          .object({
            status: z.string(),
            message: z.string(),
          })
          .parse(data);

        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        });
      }
      const parsed = TensorboardResponseSchema.parse(data);

      return parsed;
    }),
  hello: protectedProcedure.query(async () => {
    const url = `${env.TENSORBOARD_API_URL}/api/`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-api-key': env.TENSORBOARD_API_KEY,
      },
    });

    const data: unknown = await res.json();
    return data;
  }),
});
