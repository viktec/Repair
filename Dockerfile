# Multi-stage Dockerfile per Next.js (standalone output)
# Stages: deps → builder → runner

# ---- Stage 1: install dependencies ----
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# ---- Stage 2: build ----
FROM node:20-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Le migration sono nel repo (generate localmente e committate)
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---- Stage 3: runtime ----
FROM node:20-alpine AS runner
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Script di migrazione e seed (plain JS, nessuna compilazione necessaria)
COPY --from=builder --chown=nextjs:nodejs /app/src/db/migrate.mjs ./migrate.mjs
COPY --from=builder --chown=nextjs:nodejs /app/src/db/seed.mjs ./seed.mjs
COPY --from=builder --chown=nextjs:nodejs /app/src/db/migrations ./src/db/migrations
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts

# Pacchetti necessari per migration e seed (non sempre tracciati da Next.js standalone)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/bcryptjs ./node_modules/bcryptjs

# Entrypoint: esegue le migration poi avvia il server
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "/app/docker-entrypoint.sh"]
