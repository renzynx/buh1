FROM oven/bun:1.3.5-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN bun run build && bun build ./scripts/migrate.ts --outfile=./migrate.js --target=bun

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN apk add --no-cache su-exec
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/scripts/entrypoint.sh ./entrypoint.sh
COPY --from=builder --chown=nextjs:nodejs /app/scripts/start.sh ./start.sh
COPY --from=builder --chown=nextjs:nodejs /app/migrate.js ./migrate.js
COPY --from=builder --chown=nextjs:nodejs /app/src/database/migrations ./migrations

RUN chmod +x /app/entrypoint.sh /app/start.sh
RUN mkdir -p /app/db /app/storage

VOLUME ["/app/db", "/app/storage"]
ENV DATABASE_URL="/app/db/data.db"

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["./entrypoint.sh"]
