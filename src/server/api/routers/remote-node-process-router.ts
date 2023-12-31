// this router contains the routes for all remote process related to the node components of the application workspace
// the routes are protected by the authentication middleware and use environment variables to connect to the remote processing server
// using slurm and ssh so they can be run with the user's credentials
// some process require running apptainer/singularity containers on the server, while others can run simple bash scripts for creating and moving files and directories
import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import { datasetSchema } from '~/components/workboard/node-component-forms/dataset-form';
import { inferenceSchema } from '~/components/workboard/node-component-forms/inference-form';
import { networkSchema } from '~/components/workboard/node-component-forms/network-form';
import { env } from '~/env.mjs';
import { createTRPCRouter, protectedProcedure } from '~/server/api/trpc';
import { submitJob } from '~/server/remote-job';

const datasetJobSchema = z.object({
  workspacePath: z.string(),
  formData: datasetSchema,
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

export const remoteProcessRouter = createTRPCRouter({
  submitNewWorkspace: protectedProcedure
    .input(z.object({ workspacePath: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // context info
      const privateKey = ctx.privateKey ?? '';
      const username = ctx.session.user.name ?? '';
      // job configuration
      const jobName = 'deepsirius-workspace';
      const ntasks = 1;
      const partition = 'proc2';
      // defining the container script
      const containerScript = `singularity run --nv --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      // defining the full command
      const command = `${containerScript} ssc-deepsirius create_workspace ${input.workspacePath}`;
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${jobName}-output.txt`,
        `#SBATCH --error=${jobName}-error.txt`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `${command}`,
      ].join('\n');
      // submit the job and get the jobId
      const jobId = await submitJob(
        privateKey,
        env.PRIVATE_KEY_PASSPHRASE,
        username,
        env.SSH_HOST,
        sbatchContent,
      )
        .finally(() => {
          console.log('finally');
        })
        .catch((err) => {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: `Failed to create Workspace. ${err as string}`,
          });
        });
      if (!jobId) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: `Failed to create Workspace. Job wasnt created.`,
        });
      }
      return { jobId: jobId };
    }),
  submitDataset: protectedProcedure
    .input(datasetJobSchema)
    .mutation(async ({ ctx, input }) => {
      // context info
      const privateKey = ctx.privateKey ?? '';
      const username = ctx.session.user.name ?? '';
      // job configuration
      const jobName = 'deepsirius-dataset';
      const ntasks = 1;
      const partition = 'proc2';
      // parsing args ssc-deepsirius package cli args
      const argsString = `${input.workspacePath} ${input.formData.datasetName}`;
      const defaultKwargs = {
        'n-samples': 2,
        'sampling-size': '64 64 64',
      };
      const defaultKwargsString = Object.entries(defaultKwargs)
        .map(([key, value]) => `--${key} ${value as string}`)
        .join(' ');
      const inputImgagesKwArgs = input.formData.data
        .map(({ image }) => `--input-imgs ${image}`)
        .join(' ');
      const inputLabelsKwArgs = input.formData.data
        .map(({ label }) => `--input-labels ${label}`)
        .join(' ');
      // search if theres a true value in the augmentation object
      const augmentationKwArgs = Object.values(
        input.formData.augmentation,
      ).includes(true)
        ? {
            'vertical-flip': input.formData.augmentation.vflip,
            'horizontal-flip': input.formData.augmentation.hflip,
            'rotate-90-degrees': input.formData.augmentation.rotateCClock,
            'rotate-less-90-degrees': input.formData.augmentation.rotateClock,
            contrast: input.formData.augmentation.contrast,
            'linear-contrast': input.formData.augmentation.linearContrast,
            dropout: input.formData.augmentation.dropout,
            'gaussian-blur': input.formData.augmentation.gaussianBlur,
            'average-blur': input.formData.augmentation.averageBlur,
            'additive-poisson-noise': input.formData.augmentation.poissonNoise,
            'elastic-deformation':
              input.formData.augmentation.elasticDeformation,
          }
        : {};
      // filter object keys that are true and join them with a space in a single string
      const augmentationKwArgsString = Object.values(
        input.formData.augmentation,
      ).includes(true)
        ? '--aug-params ' +
          Object.entries(augmentationKwArgs)
            .map(([key, value]) => {
              if (value) {
                return `${key}`;
              }
            })
            .join(' ')
        : '';
      // if there is, add the augmentation kwargs in the form "--aug-params arg-name-1 arg-name-2 ... arg-name-N" and use the augmented_dataset function on the cli
      const cliFunction = Object.values(input.formData.augmentation).includes(
        true,
      )
        ? 'augmented_dataset'
        : 'create_dataset';
      // creating the full command line script
      const cliScript = `ssc-deepsirius ${cliFunction} ${argsString} ${defaultKwargsString} ${augmentationKwArgsString} ${inputImgagesKwArgs} ${inputLabelsKwArgs}`;
      // defining the container script
      const containerScript = `singularity run --nv --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
      // defining the full command
      const command = `${containerScript} ${cliScript}`;
      const sbatchContent = [
        '#!/bin/bash',
        `#SBATCH --job-name=${jobName}`,
        `#SBATCH --output=${jobName}-output.txt`,
        `#SBATCH --error=${jobName}-error.txt`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `${command}`,
      ].join('\n');
      const jobId = await submitJob(
        privateKey,
        env.PRIVATE_KEY_PASSPHRASE,
        username,
        env.SSH_HOST,
        sbatchContent,
      );
      return { jobId: jobId };
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // console.log(sbatchContent);
      // return { jobId: '1' };
    }),
  submitNetwork: protectedProcedure
    .input(networkJobSchema)
    .mutation(async ({ ctx, input }) => {
      // context info
      const privateKey = ctx.privateKey ?? '';
      const username = ctx.session.user.name ?? '';
      // job configuration
      const jobName = 'deepsirius-network';
      const ntasks = 1;
      const partition = 'proc2';
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
        `#SBATCH --output=${jobName}-output.txt`,
        `#SBATCH --error=${jobName}-error.txt`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `#SBATCH --gres=gpu:1`,
        `${command}`,
      ].join('\n');
      const jobId = await submitJob(
        privateKey,
        env.PRIVATE_KEY_PASSPHRASE,
        username,
        env.SSH_HOST,
        sbatchContent,
      );
      return { jobId: jobId };
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // console.log(sbatchContent);
      // return { jobId: '2' };
    }),
  submitInference: protectedProcedure
    .input(inferenceJobSchema)
    .mutation(async ({ ctx, input }) => {
      // context info
      const privateKey = ctx.privateKey ?? '';
      const username = ctx.session.user.name ?? '';
      // job configuration
      const jobName = 'deepsirius-inference';
      const ntasks = 1;
      const partition = 'proc2';
      // defining the container script
      const containerScript = `singularity run --nv --bind ${env.PROCESSING_CONTAINER_STORAGE_BIND} ${env.PROCESSING_CONTAINER_PATH}`;
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
        `#SBATCH --output=${jobName}-output.txt`,
        `#SBATCH --error=${jobName}-error.txt`,
        `#SBATCH --ntasks=${ntasks}`,
        `#SBATCH --partition=${partition}`,
        `#SBATCH --gres=gpu:1`,
        `${command}`,
      ].join('\n');
      const jobId = await submitJob(
        privateKey,
        env.PRIVATE_KEY_PASSPHRASE,
        username,
        env.SSH_HOST,
        sbatchContent,
      );
      return { jobId: jobId };
      // await new Promise((resolve) => setTimeout(resolve, 1000));
      // console.log(sbatchContent);
      // return { jobId: '3' };
    }),
});

// TODO: create the routes for reading the output files of the jobs and returning them to the client which would be called by the node state machine depending on the status of the job
