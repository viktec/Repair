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

# Genera le migration Drizzle (non richiede DB) e compila Next.js
RUN mkdir -p src/db/migrations && pnpm db:generate 2>/dev/null || true
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# Bundla lo script di migrazione in un file JS autonomo
RUN node_modules/.bin/esbuild src/db/migrate.ts \
    --bundle --platform=node --format=cjs \
    --outfile=dist/migrate.js

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

# Script di migrazione + cartella con i file SQL
COPY --from=builder --chown=nextjs:nodejs /app/dist/migrate.js ./migrate.js
COPY --from=builder --chown=nextjs:nodejs /app/src/db/migrations ./src/db/migrations

# Entrypoint: esegue le migration poi avvia il server
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["sh", "/app/docker-entrypoint.sh"]
