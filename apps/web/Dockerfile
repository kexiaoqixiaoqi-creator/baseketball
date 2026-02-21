# ==============================================================================
# Fantasy NBA — Web 容器（React 静态文件服务）
# Build context: monorepo root
# ==============================================================================

# ── Stage 1: 构建 React 前端 ──────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# VITE_API_URL 构建时注入，生产使用相对路径 /api（同域，无 CORS）
ARG VITE_API_URL=/api
ENV VITE_API_URL=${VITE_API_URL}

COPY package*.json ./
COPY packages/shared/package*.json ./packages/shared/
COPY apps/web/package*.json ./apps/web/

RUN npm ci

# Vite 将 @fantasy-nba/shared 解析为 TypeScript 源码，需一并复制
COPY packages/shared/ ./packages/shared/
COPY apps/web/ ./apps/web/

RUN npm run build --workspace=apps/web

# ── Stage 2: Nginx 静态服务 ───────────────────────────────────────────────────
FROM  nginx:1.27-alpine

COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
