# ==============================================================================
# Fantasy NBA — API Dockerfile
# Build context: monorepo root
# ==============================================================================

# ---- Builder Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace manifests first for layer caching
COPY package*.json ./
COPY packages/db/package*.json ./packages/db/
COPY packages/shared/package*.json ./packages/shared/
COPY apps/api/package*.json ./apps/api/

# Install all dependencies (dev included for build tools)
RUN npm ci

# Copy source code
COPY packages/ ./packages/
COPY apps/api/ ./apps/api/

# Build API — NestJS + Webpack bundles @fantasy-nba/* workspace packages
RUN npm run build --workspace=apps/api

# Remove devDependencies to slim down node_modules
RUN npm prune --omit=dev

# ---- Runner Stage ----
FROM node:20-alpine
WORKDIR /app

# Copy pruned node_modules (external runtime deps: mysql2, passport, etc.)
COPY --from=builder /app/node_modules ./node_modules
# Copy webpack bundle (includes @fantasy-nba/* workspace packages inlined)
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3001
CMD ["node", "dist/main"]
