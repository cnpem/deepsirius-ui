# DeepSirius UI

This is a web interface for the ssc-deepsirius package, which is a deep learning based tool for segmentation analysis of tomographic image data generated by the Sirius synchrotron at the National Synchrotron Light Laboratory (LNLS) in Campinas, Brazil.

The interface is meant to be used as a client for the ssc-deepsirius package, which is a python package that runs on demand on the cluster when the deepsirius-ui server creates a slurm job in the appropriate queue of data processing of the Sirius cluster.

Its logic is based on the ssc-deepsirius structure, which divides the workflow in three main independent steps:

1. **Dataset creation**: This steps consists in the creation of a dataset from a set of tomographic images. The dataset is a set of numpy arrays that are saved in a hdf5 file. This step is meant to be run only once for a given set of images, and the dataset can be used for multiple analysis. The dataset creation is done by the `create_dataset` function in the ssc-deepsirius package cli.

   1.1. **Augmented dataset creation**: This step consists in the creation of data
   based on the original dataset, but with some transformations applied to the images. This is done to increase the size of the dataset and improve the generalization of the model. The augmented dataset creation is done by the `augmented_dataset` function in the ssc-deepsirius package cli.

2. **Network training**: This step consists in the training of a deep learning model for the segmentation of the dataset created in the previous step. The training is done by the `train_model` function in the ssc-deepsirius package cli.

   2.1. **Finetuning**: This step consists in the finetuning of a pre-trained model with a dataset, even if the dataset is different from the one used for the previous training. The finetuning is done by the `finetune_model` function in the ssc-deepsirius package cli.

3. **Inference**: This step consists in the segmentation of a set of tomographic images using the model trained in the previous step. The segmentation is done by the `run_inference` function in the ssc-deepsirius package cli.

These steps are meant to be run in sequence for a complete cycle of the deep learning process, but as the jobs associated with each step are independent and can take a long time to run, the user is able to run them independently, as long as the previous step has been run before without errors. This opens the possibility for the user to create more than one possible path of analysis, by creating multiple datasets, training multiple models with the same dataset of different training parameters, refining these models with new data and parameters, and then running inferences with more than one model for different sets of images.

To accomplish this, the interface is divided in the so called `workspaces`, which
are simply workflows that allow the user to create and connect many components that represent the steps of the analysis. The user can have multiple workspaces, which are saved in the database and can be loaded by the user at any time.

In a workspace, the user can create any number of components of each type, and connect them in any order, as long as the previous step is completed and the steps are in the right order (1 -> 2 -> 3).

When a component is created and focused by the user it displays a form with the parameters of the component, which the user can fill and submit to the server. The server will then create a slurm job in the Sirius cluster with the parameters of the component, and update the state of the component in the interface as the job runs. The user can check the status of the job as the component changes itself. All of these changes are reflected in the database, so that the user can logoff and close the browser, and the jobs will continue to run in the cluster.

When the user logs in again and opens its workspace, the previous state of the
components will be loaded from the database, compared to the current state of the jobs in the cluster, and then updated in the interface.

> Note: In order to use the app the user must be registered in the CNPEM LDAP server and have access to the Sirius cluster, with permissions to run slurm jobs in the appropriate queue.

For more information on how to use the app, please refer to the [documentation](https://deepsirius.lnls.br/dive). The documentation is hosted internally at the LNLS server and can be accessed only by users with access to the local network, but it is also available in the [docs](./apps/docs) folder of this repository.

Check the [#development](#development) section for more information on how to run the app/docs locally.

## Development

This interface was built using the [T3 Stack](https://create.t3.gg/), which is a set of tools and libraries that we use to build web applications at [T3](https://t3.gg/).

In this project, we chose to use [TypeScript](https://www.typescriptlang.org/) as our main language, [Next.js](https://nextjs.org) as our React framework, and [NextAuth.js](https://next-auth.js.org) for authentication. We also use [Prisma](https://prisma.io) to access our database, and [Tailwind CSS](https://tailwindcss.com) for styling.

For creating the workflow view of the client components, we use [React Flow](https://reactflow.dev/), which is a React library for creating flowcharts. The app main components are created as nodes in the flowchart, and the connections between represents connections beetween the representations of the components in the data processing workflow that will be triggered as a job in a cluster environment.

The state of the components is also reflected in the flowchart, so that the user can see the status of the components (and its jobs) in the workflow view and are managed by a [Zustand](https://zustand-demo.pmnd.rs/) store on the cliend with hooks that updates the state of the components in the flowchart and when necessary, updates the database and interacts with the server through [tRPC](https://trpc.io) queries and mutations.

_TRPC_ enables a type-safe API layer between the client and the server and managing state updates between them using hooks based in the powerful `useQuery` and `useMutation` from [TanStack Query](https://tanstack.com/query/latest). So the full state of the applications is a _Tug of war_ beetween the client store, the database state and the other server mutations.

### Run Locally

You can copy the `compose.registry.yaml` file from the [github repository](https://github.com/cnpem/deepsirius-ui) and pull the built app from the [github registry page](https://github.com/cnpem/deepsirius-ui/pkgs/container/cnpem%2Fdeepsirius-ui) and run it locally with:

```shell
   docker compose --file compose.registry.yaml --env-file ./apps/deepsirius-ui/.env up
```

Then, open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Or you can build the app yourself and run it locally by running the docker container with:

```shell
   docker compose --env-file ./apps/deepsirius-ui/.env up --build
```

> Note: One can generate the initial `init.sql` file for the database with the command `pnpm dlx prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > prisma/init.sql` from the deepsirius-ui app folder.

Then, open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Start development environment

To start the development environment, you should fill the apps .env files with the appropriate variables for each app to run by itself. There is a .env.example in the apps file that you can use as a template.

To run slurm jobs, the app service need to be able to connect via ssh to a slurm management node with the same credentials of the ldap client.

Requirements satisfied, you can start the development environment with:

```shell
   pnpm run dev --filter=app
```

Then, open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Documentation

The documentation for the app can be found in the [docs](./apps/docs) folder.
Start the documentation server with:

```shell
   pnpm run dev --filter=docs
```

Then, open [http://localhost:4321](http://localhost:4321) with your browser to see the result.

## License

This project is licensed under the terms of the GPL license version 3 or later.
