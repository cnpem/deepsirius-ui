# Create T3 App

This is a [T3 Stack](https://create.t3.gg/) project bootstrapped with `create-t3-app`.

## What's next? How do I make an app with this?

We try to keep this project as simple as possible, so you can start with just the scaffolding we set up for you, and add additional things later when they become necessary.

If you are not familiar with the different technologies used in this project, please refer to the respective docs. If you still are in the wind, please join our [Discord](https://t3.gg/discord) and ask for help.

- [x] [Next.js](https://nextjs.org)
- [x] [NextAuth.js](https://next-auth.js.org)
- [x] [Prisma](https://prisma.io)
- [x] [Tailwind CSS](https://tailwindcss.com)
- [x] [tRPC](https://trpc.io)

## Learn More

To learn more about the [T3 Stack](https://create.t3.gg/), take a look at the following resources:

- [Documentation](https://create.t3.gg/)
- [Learn the T3 Stack](https://create.t3.gg/en/faq#what-learning-resources-are-currently-available) — Check out these awesome tutorials

You can check out the [create-t3-app GitHub repository](https://github.com/t3-oss/create-t3-app) — your feedback and contributions are welcome!

## How do I deploy this?

Follow our deployment guides for [Vercel](https://create.t3.gg/en/deployment/vercel), [Netlify](https://create.t3.gg/en/deployment/netlify) and [Docker](https://create.t3.gg/en/deployment/docker) for more information.

## How to Jira (from git commits through gitlab)

This publishes a comment to the issue identified by ISSUE-ID, but it comments with the user account set up in the gitlab repo.

This results in comments like:

> Comment:
> MATHEUS LUIS BERNARDI
> about 17 hours ago
> Bruno Vasco de Paula Carlos mentioned this issue in commit 4837d9eb of Matheus Luís Bernardi / deepsirius-ui:

### Commiting:

```shell
git commit -m "ISSUE-ID my awesome commit message!!"
```

Can also close issues!

```shell
git commit -m "Closes / Resolves / Fixes ISSUE-ID"
```

### Usage with docker

You should create a `.env-docker` file with different variables that should be passed to the docker compose cli as an option, so that the compose cli doesn't use the default .env file in the build.

Threre is a `.env-docker.example` file that you can use as a template, with public variables already suggested for a docker deployment i.e. `NEXT_PUBLIC_TREE_PATH` set to "/mnt", given its the suggested path for the docker volume mount for the fs mount for the tree view.

The docker-compose.yml file is then responsible to separate the env variables available to the client and to the server.

```shell
   docker compose --env-file .env-docker up
```
