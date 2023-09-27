FROM node:18-alpine

WORKDIR /app

ARG NEXTAUTH_URL
ARG NEXTAUTH_SECRET
ARG LDAP_URI
ARG SSH_HOST
ARG CA_CERT
ARG CA_CERT_HOST
ARG NEXT_PUBLIC_TREE_PATH
ARG DATABASE_URL
ARG PRIVATE_KEY_PASSPHRASE

# Copying cert
ARG CA_CERT
ARG CA_CERT_HOST
COPY $CA_CERT_HOST $CA_CERT

# copying prisma schema and generating prisma client
COPY prisma ./prisma
ENV NEXT_TELEMETRY_DISABLED 1
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copying config files
COPY next.config.mjs postcss.config.cjs tailwind.config.ts tsconfig.json ./

# Install dependencies 
COPY package.json  package-lock.json* ./
RUN SKIP_ENV_VALIDATION=1 && npm ci


# Installing open-ssh keygen
RUN apk update && apk add --no-cache openssh-keygen

# Next.js collects completely anonymous telemetry data about general usage. Learn more here: https://nextjs.org/telemetry
# Uncomment the following line to disable telemetry at run time
ENV NEXT_TELEMETRY_DISABLED 1

# Note: Don't expose ports here, Compose will handle that for us

# Start Next.js in development mode based on the preferred package manager
CMD npm run dev
