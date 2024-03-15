# ----
#syntax=docker/dockerfile:1.4
FROM node:18-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable


# ----
# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN pnpm add --global turbo
COPY . .
RUN turbo prune @deepsirius-ui/app --docker



# ----
# Rebuild the source code only when needed
FROM deps AS builder
WORKDIR /app
COPY --from=deps /app/out/json/ .
COPY --from=deps /app/out/pnpm-lock.yaml .
COPY --from=deps /app/out/pnpm-workspace.yaml .
RUN pnpm install

# These are the environment variables lodaded in the docker compose file
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG LDAP_URI
ARG SSH_HOST
ARG CA_CERT
ARG NEXT_PUBLIC_STORAGE_PATH
ARG DATABASE_URL
ARG PRIVATE_KEY_PASSPHRASE
ARG PROCESSING_CONTAINER_STORAGE_BIND
ARG PROCESSING_CONTAINER_PATH
ARG STORAGE_API_URL
ARG STORAGE_API_KEY

COPY --from=deps /app/out/full .
COPY turbo.json .

ENV NEXT_TELEMETRY_DISABLED 1

RUN pnpm dlx prisma generate --schema=apps/deepsirius-ui/prisma/schema.prisma
RUN SKIP_ENV_VALIDATION=1 turbo build --filter=@deepsirius-ui/app... 

# ----
# Production image, copy all the files and run next
FROM base AS runner
RUN apk add --update --no-cache tzdata
ENV TZ=America/Sao_Paulo
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Install openssh-keygen for writing the ssh host key in remotejob
RUN apk update && apk add --no-cache openssh-keygen

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

WORKDIR /app

COPY --from=builder /app/apps/deepsirius-ui/next.config.mjs .
COPY --from=builder /app/apps/deepsirius-ui/package.json .

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/apps/deepsirius-ui/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/deepsirius-ui/.next/static ./apps/deepsirius-ui/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/deepsirius-ui/public ./apps/deepsirius-ui/public


# # for being able to run migrations
COPY --from=builder --chown=nextjs:nodejs /app/apps/deepsirius-ui/prisma ./apps/deepsirius-ui/prisma

# Create the ssh directory avoid double login 1st time
RUN mkdir -p /home/nextjs/.ssh

EXPOSE 3000
CMD ["node", "apps/deepsirius-ui/server.js"]