import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '~/server/api/trpc';

export const sillyRouter = createTRPCRouter({
  // Create procedure at path 'login'
  // The syntax is identical to creating queries
  login: publicProcedure
    // using zod schema to validate and infer input values
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .mutation(({ input }) => {
      // Here some login stuff would happen
      return {
        user: {
          name: input.name,
          role: 'SOMEROLE',
        },
      };
    }),
});
