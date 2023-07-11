import type { Edge, Node, User, Workspace } from '@prisma/client';
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
  // Crud: Creates a new workspace and associates it with the user
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
  // cRud: Get all workspaces associated with the user
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
  createNewNode: protectedProcedure
    .input(
      z.object({
        workspacePath: z.string(),
        nodeId: z.string(),
        type: z.string(),
        label: z.string(),
        status: z.string(),
        xState: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const uid = ctx.session.user.id ?? '';
      if (uid === '') {
        throw new Error('User not found');
      }
      const node: Node = await ctx.prisma.node.create({
        data: {
          workspace: {
            connect: {
              path: input.workspacePath,
            },
          },
          nodeId: input.nodeId,
          type: input.type,
          label: input.label,
          status: input.status,
          xState: input.xState,
        },
      });
      return node;
    }),
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
      const nodes: Node[] = await ctx.prisma.node.findMany({
        where: {
          workspace: {
            path: input.workspacePath,
          },
        },
      });
      return nodes;
    }),
  // updateNode: protectedProcedure
  // .input(
  //   z.object({
  //     workspacePath: z.string(),
  //     nodeId: z.string(),
  //     label: z.string(),
  //     status: z.string(),
  //     xState: z.string(),
  //   }),
  // )
  // .mutation(async ({ ctx, input }) => {
  //   const uid = ctx.session.user.id ?? '';
  //   if (uid === '') {
  //     throw new Error('User not found');
  //   }
  //   await ctx.prisma.node.update({
  //     where: {
  //       nodeId: input.nodeId,
  //       and: {
  //         workspace: {
  //           path: input.workspacePath,
  //         },
  //     },
  //     data: {
  //       label: input.label,
  //       status: input.status,
  //       xState: input.xState,
  //     },
  //   });
  //   return true;
  // }),

  // TODO: continue this
});

//     const newUserWorkspace: UserWorkspaces = await ctx.prisma.userWorkspaces
//       .create({
//         data: {
//           userId: uid,
//           userName: uid,
//           workspace: {
//             connect: {
//               id: newWorkspace.id,
//           },
//         },
//       },
//     });
//     return newWorkspace;
//   }),
// // cRud: Get all workspaces associated with the user
// getUserWorkspaces: protectedProcedure.query(async ({ ctx }) => {
//   const uid = ctx.session.user.name ?? '';
//   if (uid === '') {
//     throw new Error('User not found');
//   }
//   const userWorkspaces: UserWorkspaces[] = await ctx.prisma.userWorkspaces
//     .findMany({
//       where: {
//         userId: uid,
//       },
//     });
//   return userWorkspaces;
// }),
// // TODO: crUd: Update a workspace
// updateWorkspace: protectedProcedure
//   .input(
//     z.object({
//       id: z.string(), // workspaceId
//       path: z.string(), // workspacePath
//       nodes: z.string(),
//       edges: z.string(),
//     }),
//   )
//   .mutation(async ({ ctx, input }) => {
//     // updating the nodes and edges associated with the workspace
//     console.log('input', input)
//     const updatedWorkspace: Workspace = await ctx.prisma.workspace.update({
//       where: {
//         path: input.path,
//       },
//       data: {
//         id: input.id,
//         path: input.path,
//         nodes:  input.nodes,
//         edges: input.edges,
//       },
//     });
//     return updatedWorkspace;
//   }),

// // TODO: cruD: Delete a workspace

// export const workspaceRouter = createTRPCRouter({
//   // Crud: Create a new workspace
//   createWorkspace: protectedProcedure
//   .input(z.object({
//     path: z.string(),
//   }))
//   .mutation(async ({ ctx, input }) => {
//     const uid = ctx.session.user.name;
//     if (uid === '') {
//       throw new Error('User not found');
//     }
//     const workspace = await ctx.prisma.userWorkspaces
//       .create({
//         data: {
//           path: input.path,
//           userId: uid,
//           userName: uid,
//         },
//       });
//     return workspace;
//   }),
//   // cRud: Get all workspaces associated with the user
//   getUserWorkspaces: protectedProcedure.query(async ({ ctx }) => {
//     const uid = ctx.session.user.name ?? '';
//     if (uid === '') {
//       throw new Error('User not found');
//     }
//     const userWorkspaces = await ctx.prisma.userWorkspaces
//       .findMany({
//         where: {
//           userId: uid,
//         },
//       });
//     return userWorkspaces;
//   }),
//   // TODO: crUd: Update a workspace
//   // updateWorkspace: protectedProcedure
//   //   .input(
//   //     z.object({
//   //       id: z.string(), // workspaceId
//   //       path: z.string(),
//   //       nodes: z.array(z.object({
//   //         workspaceId: z.string(), // workspaceId
//   //         nodeId: z.string(),
//   //         label: z.string(),
//   //         type: z.string(),
//   //         status: z.string(),
//   //         xState: z.string(),
//   //       })),
//   //       edges: z.array(z.object({
//   //         workspaceId: z.string(), // workspaceId
//   //         edgeId: z.string(),
//   //         source: z.string(),
//   //         target: z.string(),
//   //       })),
//   //     }),
//   //   )
//   //   .mutation(async ({ ctx, input }) => {
//   //     const uid = ctx.session.user.name ?? '';
//   //     if (uid === '') {
//   //       throw new Error('User not found');
//   //     }
//   //   }),
//   // TODO: cruD: Delete a workspace
// });
