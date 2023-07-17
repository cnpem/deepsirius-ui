import type {
  EdgeRegistry,
  NodeRegistry,
  User,
  Workspace,
} from '@prisma/client';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';

/**
 * Workspace Router
 * This router is responsible for handling all requests related to workspaces
 * Workspaces are the main data structure of the application
 * Workspaces are associated with a user
 * Workspaces contain nodes and edges
 */
export const workspaceRouter = createTRPCRouter({
  // Create a new workspace and associate it with an user
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
      const user: User | null = await ctx.prisma.user.findUnique({
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
      // registering the workspace
      const newWorkspace: Workspace = await ctx.prisma.workspace.create({
        data: {
          path: input.path,
          users: {
            connect: {
              id: uid,
            },
          },
        },
      });
      return newWorkspace;
    }),
  // Get all workspaces associated with the user
  getUserWorkspaces: protectedProcedure.query(async ({ ctx }) => {
    const uid = ctx.session.user.id ?? '';
    if (uid === '') {
      throw new Error('User not found');
    }
    const userWorkspaces: Workspace[] = await ctx.prisma.workspace.findMany({
      where: {
        users: {
          some: {
            id: uid,
          },
        },
      },
    });
    return userWorkspaces;
  }),
  // Register a new node to the workspace
  createNewNode: protectedProcedure
    .input(
      z.object({
        workspacePath: z.string(),
        componentId: z.string(),
        type: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
        status: z.string(),
        xState: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      const node: NodeRegistry = await ctx.prisma.nodeRegistry.create({
        data: {
          workspace: {
            connect: {
              path: input.workspacePath,
            },
          },
          componentId: input.componentId,
          type: input.type,
          position: JSON.stringify(input.position),
          status: input.status,
          xState: input.xState,
        },
      });
      return node;
    }),
  // Get all nodes associated with the workspace
  getWorkspaceNodes: protectedProcedure
    .input(
      z.object({
        workspacePath: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      const nodes: NodeRegistry[] = await ctx.prisma.nodeRegistry.findMany({
        where: {
          workspace: {
            path: input.workspacePath,
          },
        },
      });
      return nodes;
    }),
  // Update the node data
  updateNodeData: protectedProcedure
    .input(
      z.object({
        registryId: z.string(),
        status: z.string(),
        xState: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      await ctx.prisma.nodeRegistry.update({
        where: {
          id: input.registryId,
        },
        data: {
          status: input.status,
          xState: input.xState,
        },
      });
      return true;
    }),
  // Update the node position
  updateNodePos: protectedProcedure
    .input(
      z.object({
        registryId: z.string(),
        position: z.object({
          x: z.number(),
          y: z.number(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      await ctx.prisma.nodeRegistry
        .update({
          where: {
            id: input.registryId,
          },
          data: {
            position: JSON.stringify(input.position),
          },
        })
        .catch((err: ErrorOptions | undefined) => {
          throw new Error(
            "Coudn't update the node position in the database",
            err,
          );
        });
      return true;
    }),

  // // Update all nodes positions (cant do that in bulk because of the way the nodes are stored in the database?)
  // updateAllNodesPos: protectedProcedure
  //   .input(
  //     z.object({
  //       nodes: z.array(
  //         z.object({
  //           registryId: z.string(),
  //           position: z.object({
  //             x: z.number(),
  //             y: z.number(),
  //           }),
  //         }),
  //       ),
  //     }),
  //   )
  //   .mutation(async ({ ctx, input }) => {
  //     const uid = ctx.session.user.id ?? '';
  //     if (uid === '') {
  //       throw new Error('User not found');
  //     }
  //     const promises = input.nodes.map((node) =>
  //       ctx.prisma.nodeRegistry.update({
  //         where: {
  //           id: node.registryId,
  //         },
  //         data: {
  //           position: JSON.stringify(node.position),
  //         },
  //       }),
  //     );
  //     await Promise.all(promises).then(() => {
  //       return true;
  //     }).catch((err) => { throw new Error(err as string) });
  //   }),
  // Delete a node
  deleteNode: protectedProcedure
    .input(
      z.object({
        registryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      await ctx.prisma.nodeRegistry.delete({
        where: {
          id: input.registryId,
        },
      });
      return true;
    }),
  // Register a new edge to the workspace
  createEdge: protectedProcedure
    .input(
      z.object({
        workspacePath: z.string(),
        sourceId: z.string(),
        targetId: z.string(),
        componentId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      const NewEdge = await ctx.prisma.edgeRegistry.create({
        data: {
          workspace: {
            connect: {
              path: input.workspacePath,
            },
          },
          source: input.sourceId,
          target: input.targetId,
          componentId: input.componentId,
        },
      });
      return NewEdge;
    }),
  // Get all edges associated with the workspace
  getWorkspaceEdges: protectedProcedure
    .input(
      z.object({
        workspacePath: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      const edges: EdgeRegistry[] = await ctx.prisma.edgeRegistry.findMany({
        where: {
          workspace: {
            path: input.workspacePath,
          },
        },
      });
      return edges;
    }),
  // Delete an edge
  deleteEdge: protectedProcedure
    .input(
      z.object({
        registryId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      await ctx.prisma.edgeRegistry.delete({
        where: {
          id: input.registryId,
        },
      });
      return true;
    }),
  // update the workspace TODO:
  // updateWorkspaceStore: protectedProcedure
  //   .input(
  //     z.object({
  //       nodeList: z.array(
  //         z.object({
  //           registryId: z.string(),
  //           status: z.string(),
  //           xState: z.string(),
  //           position: z.object({
  //             x: z.number(),
  //             y: z.number(),
  //           }),
  //         }),
});
