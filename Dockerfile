# syntax=docker/dockerfile:1

# ── Builder ────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS builder
WORKDIR /app

# Native build tools required by better-sqlite3 + git required by vp config (prepare script)
RUN apk add --no-cache python3 make g++ git

# Enable pnpm via corepack (version pinned in package.json#packageManager)
RUN corepack enable

# Copy workspace manifests first for better layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY apps/website/package.json ./apps/website/
COPY packages/utils/package.json ./packages/utils/

RUN --mount=type=cache,id=pnpm,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# Copy all source code
COPY apps/api ./apps/api
COPY apps/website ./apps/website
COPY packages/utils ./packages/utils

# Build the frontend
RUN pnpm --filter=website run build

# ── Runner ─────────────────────────────────────────────────────────────────────
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV DB_PATH=/storage/db/db.sqlite
ENV UPLOADS_PATH=/storage/uploads

# Copy API deps and source
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api ./apps/api
COPY --from=builder /app/packages/utils ./packages/utils
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-workspace.yaml ./pnpm-workspace.yaml

# Copy frontend build output
COPY --from=builder /app/apps/website/dist ./apps/website/dist

# Create non-root user and storage directories
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nodejs \
    && mkdir -p /storage/db /storage/uploads \
    && chown -R nodejs:nodejs /storage

USER nodejs

EXPOSE 3001
CMD ["node", "apps/api/src/index.ts"]
