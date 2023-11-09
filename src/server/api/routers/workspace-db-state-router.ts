import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const workspaceDbStateRouter = createTRPCRouter({
  createWorkspace: protectedProcedure
    .input(
      z.object({
        path: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      // checking if the user is registered in the user table
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: uid,
        },
      });
      // if the user is not registered, register the user
      if (user === null) {
        await ctx.prisma.user
          .create({
            data: {
              id: uid,
              name: uid,
            },
          })
          .catch((err: ErrorOptions | undefined) => {
            throw new Error("Coudn't register the user in the database", err);
          });
      }
      // creating the workspace
      const newWorkspace = await ctx.prisma.workspaceState.create({
        data: {
          path: input.path,
          state: '',
          user: {
            connect: {
              id: uid,
            },
          },
        },
      });
      return newWorkspace;
    }),
  updateWorkspace: protectedProcedure
    .input(
      z.object({
        path: z.string(),
        state: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      // checking if the user is registered in the user table
      const user = await ctx.prisma.user.findUnique({
        where: {
          id: uid,
        },
      });
      // if the user is not registered, register the user
      if (user === null) {
        throw new Error("Coudn't find the user in the database");
      }
      // updating the workspace
      const updatedWorkspace = await ctx.prisma.workspaceState.update({
        where: {
          path: input.path,
        },
        data: {
          state: input.state,
        },
      });
      return updatedWorkspace;
    }),
  getUserWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id ?? '';
    if (uid === '') {
      throw new Error('User not found');
    }
    const userWorkspaces = await ctx.prisma.workspaceState.findMany({
      where: {
        userId: uid,
      },
    });
    return userWorkspaces;
  }),
});
