import { TRPCError } from '@trpc/server';
import { type FileEntryWithStats } from 'ssh2';
import { z } from 'zod';
import { createTRPCRouter, protectedSSHProcedure } from '~/server/api/trpc';
import { type ErrnoException } from '~/server/remote-job';

type DirentMethods =
  | 'isBlockDevice'
  | 'isCharacterDevice'
  | 'isDirectory'
  | 'isFIFO'
  | 'isFile'
  | 'isSocket'
  | 'isSymbolicLink';

export const sshRouter = createTRPCRouter({
  ls: protectedSSHProcedure
    .input(
      z.object({
        path: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const connection = ctx.connection;
      const path = input.path;

      const sftp = await connection.requestSFTP();

      const files = await new Promise<FileEntryWithStats[]>(
        (resolve, reject) => {
          sftp.readdir(path, (err, list) => {
            if (err) {
              const error = err as ErrnoException;
              connection.dispose();
              reject(
                new TRPCError({
                  code: 'UNAUTHORIZED',
                  message: error.message,
                }),
              );
            }
            resolve(list);
          });
        },
      );
      const noHiddenFiles = files.filter(
        (file) => !file.filename.startsWith('.'),
      );
      const filesWithTypes: { name: string; type: DirentMethods }[] = [];
      // get file types
      for (const file of noHiddenFiles) {
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
          if (file.attrs[method]()) {
            filesWithTypes.push({
              name: file.filename,
              type: method,
            });
          }
        }
      }
      return { files: filesWithTypes };
    }),
});
