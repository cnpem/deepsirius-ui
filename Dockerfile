# ----
#syntax=docker/dockerfile:1.4
FROM node:18-alpine AS base


# ----
# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app
# Install Prisma Client - remove if not using Prisma
COPY prisma ./
# Install dependencies based on the preferred package manager
COPY --link package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN npm ci


# ----
# Rebuild the source code only when needed
FROM base AS builder
# These are the environment variables lodaded in the docker compose file
ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG LDAP_URI
ARG SSH_HOST
ARG CA_CERT
ARG NEXT_PUBLIC_TREE_PATH
ARG DATABASE_URL
ARG PRIVATE_KEY_PASSPHRASE
ARG PROCESSING_CONTAINER_STORAGE_BIND
ARG PROCESSING_CONTAINER_PATH

WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY prisma ./prisma
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate --schema=./prisma/schema.prisma
RUN SKIP_ENV_VALIDATION=1 npm run build


# ----
# Production image, copy all the files and run next
FROM base AS runner
ARG CA_CERT
ARG CA_CERT_HOST
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
# Install openssh-keygen for writing the ssh host key in remotejob
RUN apk update && apk add --no-cache openssh-keygen
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
WORKDIR /app
COPY --chown=nextjs:nodejs $CA_CERT_HOST $CA_CERT
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/.next/server/edge-chunks ./.next/server/edge-chunks

# # for being able to run migrations
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
ENV PORT 3000

CMD ["node", "server.js"]
# CMD ["npm", "run", "start:migrate:prod"]