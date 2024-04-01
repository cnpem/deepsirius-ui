// this router contains the routes for all remote process related to the node components of the application workspace
// the routes are protected by the authentication middleware and use environment variables to connect to the remote processing server
// using slurm and ssh so they can be run with the user's credentials
// some process require running apptainer/singularity containers on the server, while others can run simple bash scripts for creating and moving files and directories
import { TRPCError } from '@trpc/server';
import fs from 'fs';
import { z } from 'zod';
import { datasetSchema } from '~/components/workboard/node-component-forms/dataset-form';
import { augmentationSchema } from '~/components/workboard/node-component-forms/augmentation-form';
import { inferenceSchema } from '~/components/workboard/node-component-forms/inference-form';
import { networkSchema } from '~/components/workboard/node-component-forms/network-form';
import { env } from '~/env.mjs';
import { createTRPCRouter, protectedSSHProcedure } from '~/server/api/trpc';
import { createTempScript } from '~/server/remote-job';

export const slurmOutFilename = 'log-%j-%x.out';
export const slurmErrFilename = 'log-%j-%x.err';

const datasetJobSchema = z.object({
  workspacePath: z.string(),
  formData: datasetSchema,
});

const augmentationJobSchema = z.object({
  workspacePath: z.string(),
  datasetName: z.string().min(1),
  formData: augmentationSchema,
});

const networkJobSchema = z.object({
  workspacePath: z.string(),
  datasetPath: z.string().min(1),
  trainingType: z.enum(['create', 'retry', 'finetune']), // 'create': creates a new network and start training, 'retry': start training an existing network, 'finetune': start training a network from a checkpoint
  formData: networkSchema,
});

const inferenceJobSchema = z.object({
  workspacePath: z.string(),
  networkName: z.string().min(1),
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
      const containerScript = `singularity run --nv --no-home --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      // defining the full command
      const command = `${containerScript} ssc-deepsirius create_workspace ${input.workspacePath}`;
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${slurmOutFilename}`,
        `#SBATCH --error=${slurmErrFilename}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `${command}`,
      ].join('\n');

      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepSirius-workspace.sbatch';

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
        .map(({ weightMap }) =>
          weightMap ? `--input-weights ${weightMap}` : '',
        )
        .join(' ')
        .replace(/\s+/g, ' ');
      const cliScript = `ssc-deepsirius create_dataset ${argsString} ${samplingKwargsString} ${inputImgagesKwArgs} ${inputLabelsKwArgs} ${inputWeightsKwArgs}`;
      const containerScript = `singularity run --nv --no-home --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      const command = `${containerScript} ${cliScript}`;
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${input.workspacePath}/jobs/${slurmOutFilename}`,
        `#SBATCH --error=${input.workspacePath}/jobs/${slurmErrFilename}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `${command}`,
      ].join('\n');

      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepSirius-dataset.sbatch';

      // console.log('sbatchContent', sbatchContent);
      // throw new TRPCError({
      //   code: 'INTERNAL_SERVER_ERROR',
      //   message: 'hue',
      // });

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
      // defining the container script
      const containerScript = `singularity run --nv --no-home --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      // parsing formData
      const augmentationParams = {
        flip_vertical: input.formData.vflip,
        flip_horizontal: input.formData.hflip,
        rotate_90: input.formData.rotateCClock,
        'rotate_-90': input.formData.rotateClock,
        contrast: input.formData.contrast,
        linear_contrast: input.formData.linearContrast,
        dropout: input.formData.dropout,
        gaussian_blur: input.formData.gaussianBlur,
        avg_blur: input.formData.averageBlur,
        additive_poisson: input.formData.poissonNoise,
        elastic_deformation: input.formData.elasticDeformation,
      };
      // filter object keys that are true and join them with a space in a single string
      const augmentationParamsString = Object.entries(augmentationParams)
        .map(([key, value]) => {
          if (value) return `--aug-params ${key}`;
        })
        .join(' ');
      // defining the full command
      const command = `${containerScript} ssc-deepsirius augment_dataset ${input.workspacePath} ${input.datasetName} ${augmentationParamsString}`;
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${slurmOutFilename}`,
        `#SBATCH --error=${slurmErrFilename}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `${command}`,
      ].join('\n');

      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepSirius-augmentation.sbatch';

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
      const argsString = `${input.workspacePath} ${input.formData.networkTypeName} ${input.formData.networkUserLabel} ${input.datasetPath}`;
      // mapping formData to cli kwargs
      const kwArgs = {
        'max-iter': input.formData.iterations,
        // batch-size: formData.batchSize,
        'learning-rate': input.formData.learningRate,
        optimiser: input.formData.optimizer,
        'drop-classifier': input.formData.dropClassifier,
        // this is a silly way to get around the fact that the cli expects 3 values for patch size
        'net-patch-size': (input.formData.patchSize + ' ').repeat(3),
      };
      const kwArgsString =
        Object.entries(kwArgs)
          .map(([key, value]) => `--${key} ${value as string}`)
          .join(' ') +
        (input.trainingType === 'finetune' ? ' --use-finetune' : '');
      // full strings for the cli scripts
      const trainingScript = `ssc-deepsirius train_model ${kwArgsString} ${argsString}`;
      // defining the container script
      const containerScript = `singularity run --nv --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      const command = `${containerScript} ${trainingScript}`;
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${slurmOutFilename}`,
        `#SBATCH --error=${slurmErrFilename}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `#SBATCH --gres=gpu:${gpus}`,
        `${command}`,
      ].join('\n');
      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepSirius-network.sbatch';

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
      const argsString = `${input.workspacePath} ${input.networkName} ${input.formData.outputDir}`;
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
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${slurmOutFilename}`,
        `#SBATCH --error=${slurmErrFilename}`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `#SBATCH --gres=gpu:${gpus}`,
        `${command}`,
      ].join('\n');
      const connection = ctx.connection;

      const { tempDir, scriptPath } = createTempScript(sbatchContent);
      const scriptName = 'deepSirius-inference.sbatch';

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
