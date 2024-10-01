import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { createTRPCRouter, protectedSSHProcedure } from '~/server/api/trpc';
import { userPartitionsResponseSchema } from '~/lib/schemas/user-partitions';
import fs from 'fs/promises';

// from the query format State,Submit,Start,End,Elapsed,Partition,NodeList,AllocGRES,NCPUS,Reason,ExitCode
const reportSacctFormatSchema = z.object({
  state: z.string(),
  submit: z.string().optional(),
  start: z.string().optional(),
  end: z.string().optional(),
  elapsed: z.string().optional(),
  partition: z.string().optional(),
  nodeList: z.string().optional(),
  allocGRES: z.string().optional(),
  nCPUS: z.string().optional(),
  reason: z.string().optional(),
  exitCode: z.string().optional(),
});


export const jobRouter = createTRPCRouter({
  checkStatus: protectedSSHProcedure
    .input(
      z.object({
        jobId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const jobId = input.jobId;
      const connection = ctx.connection;

      const command = `sacct -j ${jobId}.batch --format=State --parsable2`;
      const { stdout, stderr } = await connection.execCommand(command);

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      // The output of the sacct command comes in two lines, the first line is the header and the second is the actual state: i.e. State\nRUNNING, State\nCOMPLETED, etc.
      const lines = stdout.trim().split('\n');
      const status = lines[1];
      if (!status) {
        // If the status is empty, it means the job.batch wasn't found, but the job might be PENDING
        const command = `sacct -j ${jobId} --format=State --parsable2`;
        const { stdout, stderr } = await connection.execCommand(command);
        if (stderr) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: stderr,
          });
        }
        const lines = stdout.trim().split('\n');
        const status = lines[1];
        return { jobStatus: status };
      }
      return { jobStatus: status };
    }),
  cancel: protectedSSHProcedure
    .input(
      z.object({
        jobId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const jobId = input.jobId;
      const connection = ctx.connection;

      const command = `scancel ${jobId}`;
      const { stderr } = await connection.execCommand(command);

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      return { cancelStatus: 'CANCELLED' };
    }),
  report: protectedSSHProcedure
    .input(
      z.object({
        jobId: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const jobId = input.jobId;

      const connection = ctx.connection;

      const command = `sacct --format="State,Submit,Start,End,Elapsed,Partition,NodeList,AllocGRES,NCPUS,Reason,ExitCode" --parsable2 --job ${jobId} --noheader`;
      const { stdout, stderr } = await connection.execCommand(command);

      if (stderr) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: stderr,
        });
      }

      const data = stdout.trim();
      if (data.length === 0) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Job data not found",
        });
      }

      const firstline = data.split("\n")[0];
      if (!firstline) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Error parsing job data for jobId ${jobId}`,
        });
      }

      const [
        state,
        submit,
        start,
        end,
        elapsed,
        partition,
        nodeList,
        allocGRES,
        nCPUS,
        reason,
        exitCode,
      ] = data.split("|");

      const report = reportSacctFormatSchema.safeParse({
        state: state?.split(" ")[0] ?? state, // the state comes with a suffix that we don't need, so we split it and get the first part
        submit,
        start,
        end,
        elapsed,
        partition,
        nodeList,
        allocGRES,
        nCPUS,
        reason,
        exitCode,
      });

      if (report.error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Error parsing job data:" + report.error.message,
        });
      }

      return {
        ...report.data
      };
    }),
  userPartitions: protectedSSHProcedure.query(async ({ ctx }) => {
    const connection = ctx.connection;

    const templatePath = "public/templates/user-partitions.sh";
    const scriptTemplate = await fs.readFile(templatePath, "utf-8");

    const content = scriptTemplate.replace(
      "${INPUT_USERNAME}",
      ctx.username,
    );

    const { stdout, stderr } = await connection.execCommand(content);

    if (stderr) {
      throw new Error(stderr);
    }

    if (stdout.trim().length === 0) {
      throw new Error("Empty response from user partitions script.");
    }

    const parsed = userPartitionsResponseSchema.safeParse(
      JSON.parse(stdout.trim()),
    );
    if (parsed.error) {
      throw new Error(parsed.error.message);
    }

    function parseNumberOrUndefined(value: string | null | undefined) {
      if (value === null || value === undefined) {
        return undefined;
      }
      if (value === "null") {
        return undefined;
      }
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        return undefined;
      }
      return parsed;
    }

    const partitions = parsed.data.partitions.map((partition) => {
      // if the groupQoSLimit is set for a limit it overrides the partition limit from cpusState and total gpus from gresTotal
      const maxGpus =
        parseNumberOrUndefined(partition.groupQoSLimit?.gpu) ??
        parseNumberOrUndefined(partition.gresTotal) ??
        0;
      const maxCpus =
        parseNumberOrUndefined(partition.groupQoSLimit?.cpu) ??
        parseNumberOrUndefined(partition.cpusState.total) ??
        0;
      const usedCpus =
        parseNumberOrUndefined(partition.cpusState.allocated) ?? 0;
      const usedGpus = parseNumberOrUndefined(partition.gresUsed) ?? 0;
      const freeCpus = maxCpus > 0 ? maxCpus - usedCpus : 0;
      const freeGpus = maxGpus > 0 ? maxGpus - usedGpus : 0;

      return {
        partition: partition.partitionName,
        nodeList: partition.nodeList,
        cpus: {
          free: freeCpus,
          max: maxCpus,
        },
        gpus: {
          free: freeGpus,
          max: maxGpus,
        },
      };
    });

    return { partitions };
  })
});

