import { env } from '~/env.mjs';
import { createTRPCRouter, protectedSSHProcedure } from '~/server/api/trpc';
import { createTempScript } from '~/server/remote-job';
import { TRPCError } from '@trpc/server';
import fs from 'fs';
import { z } from 'zod';
import {
  datasetSchema,
  imageSchema,
} from '~/components/workboard/node-component-forms/dataset-form';
import { augmentationSchema } from '~/components/workboard/node-component-forms/augmentation-form';
import { inferenceSchema } from '~/components/workboard/node-component-forms/inference-form';
import { networkSchema } from '~/components/workboard/node-component-forms/network-form';
import { finetuneSchema } from '~/components/workboard/node-component-forms/finetune-form';

type logPathsProps = {
  workspacePath: string;
  query?: {
    jobId: string;
    jobName: string;
  };
};

export function logPaths(props: logPathsProps) {
  const { workspacePath, query } = props;
  const slurmFilename = query
    ? `log-${query.jobId}-${query.jobName}`
    : 'log-%j-%x';
  return {
    base: `${workspacePath}/logs`,
    out: `${workspacePath}/logs/${slurmFilename}.out`,
    err: `${workspacePath}/logs/${slurmFilename}.err`,
  };
}

const datasetJobSchema = z.object({
  workspacePath: z.string().min(1),
  formData: datasetSchema,
});

const augmentationJobSchema = z.object({
  workspacePath: z.string().min(1),
  sourceDatasetName: z.string().min(1),
  formData: augmentationSchema,
  baseDatasetFullImages: z.array(imageSchema),
});

const networkJobSchema = z.object({
  workspacePath: z.string().min(1),
  sourceDatasetName: z.string().min(1),
  trainingType: z.enum(['create', 'retry']),
  formData: networkSchema,
});

const finetuneJobSchema = z.object({
  workspacePath: z.string().min(1),
  sourceDatasetName: z.string().min(1),
  sourceNetworkLabel: z.string().min(1),
  sourceNetworkType: z.string().min(1),
  formData: finetuneSchema,
});

const inferenceJobSchema = z.object({
  workspacePath: z.string().min(1),
  sourceNetworkLabel: z.string().min(1),
  formData: inferenceSchema,
});

export const deepsiriusJobRouter = createTRPCRouter({
  submitNewWorkspace: protectedSSHProcedure
    .input(z.object({ workspacePath: z.string(), partition: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // job configuration
      const jobName = 'deepsirius-workspace';
      const ntasks = 1;
      const partition = input.partition;
      // defining the container script
      const containerScript = `singularity exec --nv --no-home --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      // defining the full command
      const command = `${containerScript} ssc-deepsirius create_workspace ${input.workspacePath}`;
      const { base, out, err } = logPaths({
        workspacePath: input.workspacePath,
      });
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${out}`,
        `#SBATCH --error=${err}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `${command}`,
      ].join('\n');

      const connection = ctx.connection;
      await connection.mkdir(base);

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepsirius-workspace.sbatch';

      await connection.putFile(scriptPath, scriptName);
      fs.rmdirSync(tempDir, { recursive: true });

      const { stdout, stderr } = await connection.execCommand(
        `sbatch --parsable ${scriptName}`,
      );

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      const jobId = stdout.trim();
      return { jobId: jobId };
    }),
  submitDataset: protectedSSHProcedure
    .input(datasetJobSchema)
    .mutation(async ({ ctx, input }) => {
      // job configuration
      const jobName = 'deepsirius-dataset';
      const ntasks = 1;
      const partition = input.formData.slurmOptions.partition;
      // parsing args ssc-deepsirius package cli args
      const argsString = `${input.workspacePath} ${input.formData.datasetName}`;
      const samplingKwargs = {
        'n-classes': input.formData.classes,
        'n-samples': input.formData.sampleSize,
        'sampling-size': `${input.formData.patchSize} `.repeat(3),
      };
      const samplingKwargsString = Object.entries(samplingKwargs)
        .map(([key, value]) => `--${key} ${value as string}`)
        .join(' ');
      const inputImgagesKwArgs = input.formData.data
        .map(({ image }) => `--input-imgs ${image}`)
        .join(' ');
      const inputLabelsKwArgs = input.formData.data
        .map(({ label }) => `--input-labels ${label}`)
        .join(' ');
      const inputWeightsKwArgs = input.formData.data
        .map(({ weightMap }) => (weightMap ? `--weight-map ${weightMap}` : ''))
        .join(' ')
        .replace(/\s+/g, ' ');
      const cliScript = `ssc-deepsirius create_dataset ${argsString} ${samplingKwargsString} ${inputImgagesKwArgs} ${inputLabelsKwArgs} ${inputWeightsKwArgs}`;
      const containerScript = `singularity exec --nv --no-home --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      const command = `${containerScript} ${cliScript}`;
      const { out, err } = logPaths({ workspacePath: input.workspacePath });
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${out}`,
        `#SBATCH --error=${err}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `${command}`,
      ].join('\n');

      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepsirius-dataset.sbatch';

      await connection.putFile(scriptPath, scriptName);
      fs.rmdirSync(tempDir, { recursive: true });

      const { stdout, stderr } = await connection.execCommand(
        `sbatch --parsable ${scriptName}`,
      );

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      const jobId = stdout.trim();
      return { jobId: jobId };
    }),
  submitAugmentation: protectedSSHProcedure
    .input(augmentationJobSchema)
    .mutation(async ({ ctx, input }) => {
      // job configuration
      const jobName = 'deepsirius-augmentation';
      const ntasks = 1;
      const partition = input.formData.slurmOptions.partition;
      const gpus = input.formData.slurmOptions.nGPU;
      // defining the container script
      const containerScript = `singularity exec --nv --no-home --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      // mapping formData to cli kwargs
      const formArgs = input.formData.augmentationArgs;
      function formatNamedTuple({
        name,
        tuple,
      }: {
        name: string;
        tuple: [number, number] | undefined;
      }) {
        if (!tuple) return '';
        return `${name} ${tuple.join(' ')}`;
      }
      const kwArgsArray = [
        `${formArgs.rot90.select ? '--rot90' : ''}`,
        `${formArgs.rot270.select ? '--rot270' : ''}`,
        `${formArgs.flipHorizontal.select ? '--flip-horizontal' : ''}`,
        `${formArgs.flipVertical.select ? '--flip-vertical' : ''}`,
        `${
          formArgs.elastic.select
            ? `${formatNamedTuple({
                name: '--elastic-alpha',
                tuple: formArgs.elastic.alpha,
              })} ${formatNamedTuple({
                name: '--elastic-sigma',
                tuple: formArgs.elastic.sigma,
              })}`
            : ''
        }`,
        `${
          formArgs.gaussianBlur.select
            ? `${formatNamedTuple({
                name: '--gaussian-blur',
                tuple: formArgs.gaussianBlur.sigma,
              })}`
            : ''
        }`,
        `${
          formArgs.contrast.select
            ? `${formatNamedTuple({
                name: '--contrast',
                tuple: formArgs.contrast.factor,
              })}`
            : ''
        }`,
        `${
          formArgs.averageBlur.select
            ? `${formatNamedTuple({
                name: '--average-blur',
                tuple: formArgs.averageBlur.kernelSize,
              })}`
            : ''
        }`,
        `${
          formArgs.linearContrast.select
            ? `${formatNamedTuple({
                name: '--linear-contrast',
                tuple: formArgs.linearContrast.factor,
              })}`
            : ''
        }`,
        `${
          formArgs.dropout.select
            ? `${formatNamedTuple({
                name: '--dropout',
                tuple: formArgs.dropout.factor,
              })}`
            : ''
        }`,
        `${
          formArgs.poissonNoise.select
            ? `${formatNamedTuple({
                name: '--poisson-noise',
                tuple: formArgs.poissonNoise.scale,
              })}`
            : ''
        }`,
      ];
      const kwArgsString = kwArgsArray.filter(Boolean).join(' ');

      const inputImgageArgs = input.baseDatasetFullImages
        .map((image) => `${image}`)
        .join(' ');

      // defining the full command
      const command = `${containerScript} ssc-deepsirius augment_dataset ${input.workspacePath} ${input.sourceDatasetName} ${input.formData.augmentedDatasetName} ${inputImgageArgs} ${kwArgsString}`;
      const { out, err } = logPaths({ workspacePath: input.workspacePath });
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${out}`,
        `#SBATCH --error=${err}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `#SBATCH --gres=gpu:${gpus}`,
        `${command}`,
      ].join('\n');

      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepsirius-augmentation.sbatch';

      await connection.putFile(scriptPath, scriptName);
      fs.rmdirSync(tempDir, { recursive: true });

      const { stdout, stderr } = await connection.execCommand(
        `sbatch --parsable ${scriptName}`,
      );

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      const jobId = stdout.trim();
      return { jobId: jobId };
    }),
  submitNetwork: protectedSSHProcedure
    .input(networkJobSchema)
    .mutation(async ({ ctx, input }) => {
      // job configuration
      const jobName = 'deepsirius-network';
      const ntasks = 1;
      const partition = input.formData.slurmOptions.partition;
      const gpus = input.formData.slurmOptions.nGPU;
      // parsing args ssc-deepsirius package cli args
      const argsString = `${input.workspacePath} ${input.formData.networkTypeName} ${input.formData.networkUserLabel} ${input.sourceDatasetName}`;
      // mapping formData to cli kwargs
      const kwArgs = {
        'max-iter': input.formData.iterations,
        'batch-size': input.formData.batchSize,
        'learning-rate': input.formData.learningRate,
        optimiser: input.formData.optimizer,
        // in the ui, theres a separation of concerns between the network form and the finetune component, but the cli uses the same function for both
        // so we need to pass this value as a boolean to the cli.
        'drop-classifier': false, 
        // this is a silly way to get around the fact that the cli expects 3 values for patch size
        'net-patch-size': (input.formData.patchSize + ' ').repeat(3),
      };
      const kwArgsString = Object.entries(kwArgs)
        .map(([key, value]) => `--${key} ${value as string}`)
        .join(' ');
      // full strings for the cli scripts
      const trainingScript = `ssc-deepsirius train_model ${kwArgsString} ${argsString}`;
      // defining the container script
      const containerScript = `singularity exec --nv --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      const command = `${containerScript} ${trainingScript}`;
      const { out, err } = logPaths({ workspacePath: input.workspacePath });
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${out}`,
        `#SBATCH --error=${err}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `#SBATCH --gres=gpu:${gpus}`,
        `${command}`,
      ].join('\n');
      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepsirius-network.sbatch';

      await connection.putFile(scriptPath, scriptName);
      fs.rmdirSync(tempDir, { recursive: true });

      const { stdout, stderr } = await connection.execCommand(
        `sbatch --parsable ${scriptName}`,
      );

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      const jobId = stdout.trim();
      return { jobId: jobId };
    }),
  submitFinetune: protectedSSHProcedure
    .input(finetuneJobSchema)
    .mutation(async ({ ctx, input }) => {
      // job configuration
      const jobName = 'deepsirius-finetune';
      const ntasks = 1;
      const partition = input.formData.slurmOptions.partition;
      const gpus = input.formData.slurmOptions.nGPU;
      // parsing args ssc-deepsirius package cli args
      const argsString = `${input.workspacePath} ${input.sourceNetworkType} ${input.sourceNetworkLabel} ${input.sourceDatasetName}`;
      // mapping formData to cli kwargs
      const kwArgs = {
        'max-iter': input.formData.iterations,
        'batch-size': input.formData.batchSize,
        'learning-rate': input.formData.learningRate,
        optimiser: input.formData.optimizer,
        'drop-classifier': input.formData.dropClassifier,
        // this is a silly way to get around the fact that the cli expects 3 values for patch size
        'net-patch-size': (input.formData.patchSize + ' ').repeat(3),
      };
      const kwArgsString =
        Object.entries(kwArgs)
          .map(([key, value]) => `--${key} ${value as string}`)
          .join(' ') + ' --use-finetune';
      // full strings for the cli scripts
      const trainingScript = `ssc-deepsirius train_model ${kwArgsString} ${argsString}`;
      // defining the container script
      const containerScript = `singularity exec --nv --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      const command = `${containerScript} ${trainingScript}`;
      const { out, err } = logPaths({ workspacePath: input.workspacePath });
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${out}`,
        `#SBATCH --error=${err}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `#SBATCH --gres=gpu:${gpus}`,
        `${command}`,
      ].join('\n');
      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepsirius-network.sbatch';

      await connection.putFile(scriptPath, scriptName);
      fs.rmdirSync(tempDir, { recursive: true });

      const { stdout, stderr } = await connection.execCommand(
        `sbatch --parsable ${scriptName}`,
      );

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      const jobId = stdout.trim();
      return { jobId: jobId };
    }),
  submitInference: protectedSSHProcedure
    .input(inferenceJobSchema)
    .mutation(async ({ ctx, input }) => {
      // job configuration
      const jobName = 'deepsirius-inference';
      const ntasks = 1;
      const partition = input.formData.slurmOptions.partition;
      const gpus = input.formData.slurmOptions.nGPU;
      // defining the container script
      const containerScript = `singularity run --nv --no-home --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      // defining output directory for the inference results
      // const outputDir = `${input.workspacePath}/inference/${input.networkName}`;
      // parsing args ssc-deepsirius package cli args
      const argsString = `${input.workspacePath} ${input.sourceNetworkLabel} ${input.formData.outputDir}`;
      // parsing input images list as cli kwargs string
      const inputImagesKwArgs = input.formData.inputImages
        .map((image) => `--list-imgs-infer ${image.path}`)
        .join(' ');
      // parsing form data as cli kwargs string
      const kwArgs = {
        padding: (input.formData.paddingSize + ' ').repeat(3),
        border: (input.formData.patchSize + ' ').repeat(3),
        'out-net-op': input.formData.saveProbMap
          ? 'save_prob_map'
          : 'save_label',
      };
      const KwArgsString =
        Object.entries(kwArgs)
          .map(([key, value]) => `--${key} ${value}`)
          .join(' ') +
        (input.formData.normalize ? ' --norm-data' : ' --no-norm-data');
      // creating the full command line script
      const command = `${containerScript} ssc-deepsirius run_inference ${argsString} ${KwArgsString} ${inputImagesKwArgs}`;
      const { out, err } = logPaths({ workspacePath: input.workspacePath });
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${out}`,
        `#SBATCH --error=${err}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `#SBATCH --gres=gpu:${gpus}`,
        `${command}`,
      ].join('\n');
      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepsirius-inference.sbatch';

      await connection.putFile(scriptPath, scriptName);
      fs.rmdirSync(tempDir, { recursive: true });

      const { stdout, stderr } = await connection.execCommand(
        `sbatch --parsable ${scriptName}`,
      );

      if (stderr) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: stderr,
        });
      }

      const jobId = stdout.trim();
      return { jobId: jobId };
    }),
});
