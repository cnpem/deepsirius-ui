import { TRPCError } from '@trpc/server';
import fs from 'fs';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import type { ErrnoException } from '~/server/remote-job';

type DirentMethods =
  | 'isBlockDevice'
  | 'isCharacterDevice'
  | 'isDirectory'
  | 'isFIFO'
  | 'isFile'
  | 'isSocket'
  | 'isSymbolicLink';

export const filesystemRouter = createTRPCRouter({
  ls: protectedProcedure
    .input(
      z.object({
        path: z.string(),
      }),
    )
    .query(async ({ input }) => {
      const path = input.path;
      let files: fs.Dirent[];
      try {
        files = await fs.promises.readdir(path, {
          withFileTypes: true,
        });
      } catch (e) {
        const error = e as ErrnoException;
        if (error.code === 'ENOENT') {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'No such file or directory',
          });
        }
        if (error.code === 'EACCES') {
          throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Permission denied',
          });
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        });
      }

      const visibleFiles = files.filter((file) => !file.name.startsWith('.'));
      const fileWithTypes: { name: string; type: 'directory' | 'file' }[] = [];
      // get file types
      for (const file of visibleFiles) {
        const methods = [
          'isBlockDevice',
          'isCharacterDevice',
          'isDirectory',
          'isFIFO',
          'isFile',
          'isSocket',
          'isSymbolicLink',
        ] as DirentMethods[];
        for (const method of methods) {
          if (file[method]()) {
            fileWithTypes.push({
              name: file.name,
              type: method === 'isDirectory' ? 'directory' : 'file',
            });
            break;
          }
        }
      }

      return { files: fileWithTypes };
    }),
});
