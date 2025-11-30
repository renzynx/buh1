FROM node:24-bookworm-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV HUSKY=0
RUN corepack enable
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build

FROM base AS pruner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json pnpm-lock.yaml ./
RUN pnpm prune --prod --no-optional --ignore-scripts
RUN node -e "const pkg=require('./package.json'); delete pkg.scripts.prepare; require('fs').writeFileSync('package.json', JSON.stringify(pkg, null, 2))"
RUN pnpm rebuild

FROM base AS dir-creator
WORKDIR /app
RUN mkdir -p /app/storage /app/db

FROM gcr.io/distroless/nodejs24-debian12
WORKDIR /app
ENV NODE_ENV=production

COPY --from=dir-creator /app/storage /app/storage
COPY --from=dir-creator /app/db /app/db

COPY --from=pruner /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src/database/migrations ./src/database/migrations
COPY --from=builder /app/package.json ./package.json

EXPOSE 3000
VOLUME ["/app/storage", "/app/db"]
CMD ["dist/server/index.mjs", "--migrate"]