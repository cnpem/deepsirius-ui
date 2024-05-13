import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { env } from '~/env.mjs';
import {
  createTRPCRouter,
  protectedProcedure,
  protectedSSHProcedure,
} from '~/server/api/trpc';
import JSZip from 'jszip';

const unzippedImage = z.object({
  name: z.string(),
  src: z.string(),
});

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
  catImage: protectedProcedure
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
      const url = `${env.STORAGE_API_URL}/api/files/cat?${params.toString()}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Cookie: cookie,
        },
      });
      const data = await res.arrayBuffer();
      const base64data = Buffer.from(data).toString('base64');
      return { src: `data:image/png;base64,${base64data}` };
    }),
  unzipImagesFromPath: protectedProcedure
    .input(
      z
        .object({
          dirPath: z.string(),
        })
        .transform((data) => {
          return {
            dirPath: data.dirPath.replace(/^\/ibira/, ''),
          };
        }),
    )
    .query(async ({ ctx, input }) => {
      const cookie = ctx.storageApiCookie;
      if (!cookie) throw new TRPCError({ code: 'UNAUTHORIZED' });
      const path = input.dirPath;
      const params = new URLSearchParams({
        key: env.STORAGE_API_KEY,
        path: path || '/',
      });
      const url = `${env.STORAGE_API_URL}/api/files/zip?${params.toString()}`;
      const res = await fetch(url, {
        method: 'GET',
        headers: {
          Cookie: cookie,
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch: ${res.statusText}`);
      }
      const buffer = await res.arrayBuffer().catch((err: Error) => {
        throw new Error(`Failed to fetch buffer file: ${err.message}`);
      });
      const zip = await JSZip.loadAsync(buffer).catch((err: Error) => {
        throw new Error(`Failed to load ZIP file: ${err.message}`);
      });
      // const imagesBase64: string[] = [];
      const unzippedImages: z.infer<typeof unzippedImage>[] = [];
      for (const [filename, fileData] of Object.entries(zip.files)) {
        if (filename.endsWith('.png')) {
          const fileContent = await fileData.async('nodebuffer'); // For Node.js environment
          const base64data = fileContent.toString('base64');
          const fname = filename.split('/')[1];
          if (!fname) {
            throw new Error(
              'Invalid file name. Expected format: path/to/file.png',
            );
          }
          const [name, extension] = fname.split('.');
          if (extension !== 'png') {
            throw new Error('Invalid file extension');
          }
          if (!name) {
            throw new Error('Could not extract file name');
          }
          unzippedImages.push({
            name,
            src: `data:image/png;base64,${base64data}`,
          });
        }
      }
      if (unzippedImages.length === 0) {
        throw new Error('No PNG images found in ZIP file');
      }
      return { srcList: unzippedImages };
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
  rmFile: protectedSSHProcedure
    .input(
      z.object({
        path: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const connection = ctx.connection;
      const path = input.path;

      const { stderr } = await connection.execCommand(`rm ${path}`);

      if (!!stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }
      return { path: path };
    }),
  rmDir: protectedSSHProcedure
    .input(
      z.object({
        path: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const connection = ctx.connection;
      const path = input.path;

      const { stderr } = await connection.execCommand(`rm -r ${path}`);

      if (!!stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }
      return { path: path };
    }),
});
