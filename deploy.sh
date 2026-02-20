#!/bin/bash
# ==============================================================================
# Fantasy NBA — 生产部署脚本（全容器化，Alibaba Cloud Linux 3）
# 用法：bash deploy.sh [--skip-pull] [--no-cache]
# ==============================================================================
set -euo pipefail

# ── 颜色输出 ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log()   { echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"; }
warn()  { echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠  $1${NC}"; }
error() { echo -e "${RED}[$(date +'%H:%M:%S')] ✗  $1${NC}"; exit 1; }
info()  { echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"; }

# ── 参数解析 ──────────────────────────────────────────────────────────────────
SKIP_PULL=false
NO_CACHE=""

for arg in "$@"; do
  case $arg in
    --skip-pull) SKIP_PULL=true ;;
    --no-cache)  NO_CACHE="--no-cache" ;;
    *) warn "未知参数: $arg" ;;
  esac
done

ENV_FILE=".env.docker"
COMPOSE_FILE="docker-compose.prod.yml"

# ── 前置检查 ──────────────────────────────────────────────────────────────────
log "检查部署环境..."

[ -f "$ENV_FILE" ] || error "未找到 $ENV_FILE。请先执行：cp .env.docker.example $ENV_FILE 并填写配置"

command -v docker >/dev/null 2>&1 || error "Docker 未安装，请参考 DEPLOY.md 第一步安装 Docker"
docker compose version >/dev/null 2>&1 || error "Docker Compose v2 未安装（需要 v2+）"

# 检查必填环境变量
source "$ENV_FILE"
[ -z "${DB_ROOT_PASSWORD:-}" ] && error "DB_ROOT_PASSWORD 未配置"
[ -z "${DB_PASSWORD:-}" ]      && error "DB_PASSWORD 未配置"
[ -z "${JWT_SECRET:-}" ]       && error "JWT_SECRET 未配置"

# ── 拉取代码 ──────────────────────────────────────────────────────────────────
if [ "$SKIP_PULL" = false ]; then
  log "拉取最新代码..."
  git pull origin main
else
  warn "跳过 git pull（--skip-pull）"
fi

# ── 构建 Docker 镜像 ───────────────────────────────────────────────────────
log "构建 Docker 镜像${NO_CACHE:+（无缓存）}..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" build $NO_CACHE

# ── 滚动更新容器 ───────────────────────────────────────────────────────────
log "停止旧容器（保留数据卷）..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down --remove-orphans

log "启动新容器..."
docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

# ── 等待服务就绪 ───────────────────────────────────────────────────────────
log "等待服务就绪（最多 90 秒）..."
for i in $(seq 1 18); do
  sleep 5
  if curl -sf http://localhost >/dev/null 2>&1; then
    log "服务就绪"
    break
  fi
  info "等待中... ($((i*5))s)"
done

# ── 清理悬空镜像 ───────────────────────────────────────────────────────────
log "清理悬空镜像..."
docker image prune -f

# ── 部署结果 ───────────────────────────────────────────────────────────────
echo ""
log "════════════════════════════════════════"
log "          部署完成！"
log "════════════════════════════════════════"
echo ""

docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

SERVER_IP=$(curl -sf --max-time 3 ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
echo ""
info "访问地址：http://${SERVER_IP}"
echo ""
info "查看日志：docker compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
