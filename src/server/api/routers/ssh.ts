import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '~/env.mjs';
import {
  createTRPCRouter,
  protectedProcedure,
  protectedSSHProcedure,
} from '~/server/api/trpc';

export const sshRouter = createTRPCRouter({
  ls: protectedProcedure
    .input(
      z
        .object({
          path: z.string(),
        })
        .transform((data) => {
          return {
            path: data.path.replace(/^\/ibira/, ''),
          };
        }),
    )
    .query(async ({ ctx, input }) => {
      const cookie = ctx.storageApiCookie;
      if (!cookie) throw new TRPCError({ code: 'UNAUTHORIZED' });

      const path = input.path;
      const params = new URLSearchParams({
        key: env.STORAGE_API_KEY,
        path: path || '/',
      });
      const url = `${env.STORAGE_API_URL}/api/files/ls?${params.toString()}`;

      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Cookie: cookie,
        },
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

      const files = z
        .object({
          status: z.string(),
          results: z.array(
            z.object({
              name: z.string(),
              type: z.string(),
              size: z.number(),
              time: z.number(),
            }),
          ),
        })
        .parse(data);

      const noHiddenFiles = files.results.filter(
        (file) => !file.name.startsWith('.'),
      );

      return { files: noHiddenFiles };
    }),
  rmWorkspace: protectedSSHProcedure
    .input(
      z.object({
        path: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const prisma = ctx.prisma;
      const connection = ctx.connection;
      const path = input.path;

      const { stderr } = await connection.execCommand(`rm -r ${path}`);

      if (!!stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      const workspace = await prisma.workspaceState.delete({
        where: {
          path: path,
        },
      });
      return { workspace: workspace };
    }),
});
