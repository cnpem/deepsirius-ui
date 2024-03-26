import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

export const dbRouter = createTRPCRouter({
  createWorkspace: protectedProcedure
    .input(
      z.object({
        path: z.string(),
        name: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id;

      // creating the workspace
      const newWorkspace = await ctx.prisma.workspaceState.create({
        data: {
          path: input.path,
          name: input.name,
          favorite: false,
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
      const uid = ctx.session.user.id;

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
    const uid = ctx.session.user.id;
    const userWorkspaces = await ctx.prisma.workspaceState.findMany({
      where: {
        userId: uid,
      },
    });
    return userWorkspaces;
  }),
  getWorkspaceByName: protectedProcedure
    .input(
      z.object({
        name: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      console.log('searching workspace by name. input: ', input);
      const workspace = await ctx.prisma.workspaceState.findFirst({
        where: {
          name: input.name,
          userId: ctx.session.user.id,
        },
      });

      if (!workspace) {
        throw new Error('Workspace not found');
      }
      return workspace;
    }),
  updateFavoriteWorkspace: protectedProcedure
    .input(
      z.object({
        path: z.string(),
        favorite: z.boolean(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const workspace = await ctx.prisma.workspaceState.update({
        where: {
          path: input.path,
        },
        data: {
          favorite: input.favorite,
        },
      });
      return workspace;
    }),
});
