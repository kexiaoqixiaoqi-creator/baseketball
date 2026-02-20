# ==============================================================================
# Fantasy NBA — Nginx 反向代理容器（对外唯一入口）
# Build context: monorepo root
# ==============================================================================

FROM nginx:1.27-alpine

COPY nginx/fantasy-nba.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
