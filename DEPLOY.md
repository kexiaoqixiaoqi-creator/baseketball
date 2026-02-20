# Fantasy NBA — Docker 生产部署指南

> 目标系统：**Alibaba Cloud Linux 3.2104 LTS 64位**

## 目录

1. [架构说明](#架构说明)
2. [服务器要求](#服务器要求)
3. [部署文件清单](#部署文件清单)
4. [首次部署流程](#首次部署流程)
5. [更新部署](#更新部署)
6. [配置说明](#配置说明)
7. [常用运维命令](#常用运维命令)
8. [故障排查](#故障排查)
9. [HTTPS 配置](#https-配置)

---

## 架构说明

```
用户浏览器
    │
    │ HTTP :80
    ▼
┌─────────────────────────────────────────────┐
│           nginx 容器（反向代理）             │  ← 唯一对外暴露的入口
│         nginx/fantasy-nba.conf              │
│                                             │
│  location /api/ ────────────────────────►  api:3001
│  （剥除 /api 前缀后转发）                   │  [api 容器] NestJS
│                                             │      │
│  location /     ────────────────────────►  web:80  └── db:3306
│                                             │  [web 容器] Nginx 静态文件  [db 容器] MySQL
└─────────────────────────────────────────────┘
```

**四个容器：**

| 容器    | 镜像基础           | 对外端口     | 职责                               |
|---------|--------------------|--------------|------------------------------------|
| `nginx` | nginx:1.27-alpine  | **80**       | 反向代理，对外唯一入口              |
| `web`   | nginx:1.27-alpine  | 无（内网）   | React 静态文件服务，处理前端路由    |
| `api`   | node:20-alpine     | 无（内网）   | NestJS REST API                    |
| `db`    | mysql:8.0          | 无（内网）   | MySQL 数据库                       |

**路径转发规则（无需修改 NestJS 代码）：**

```
浏览器 GET /api/auth/login
  → nginx 容器匹配 location /api/
  → 剥除 /api 前缀
  → 转发 GET /auth/login → api:3001
  → NestJS 正常处理 ✓

浏览器 GET /rooms/123
  → nginx 容器匹配 location /
  → 转发 GET /rooms/123 → web:80
  → web 容器返回 index.html
  → React Router 接管前端路由 ✓
```

**CORS：** 前端与 API 经由同一个 nginx 容器对外，浏览器视为同域，不触发跨域请求。

---

## 服务器要求

- **OS**：Alibaba Cloud Linux 3.2104 LTS 64位
- **内存**：≥ 1 GB（推荐 2 GB）
- **磁盘**：≥ 10 GB 可用空间
- **对外端口**：仅需开放 **80**（HTTPS 时加 443）
- **阿里云安全组**：入方向放行 TCP 80，其余端口无需放行

---

## 部署文件清单

```
.
├── apps/
│   ├── api/
│   │   └── Dockerfile          # API 镜像（Node 20 + Webpack 打包）
│   └── web/
│       ├── Dockerfile          # Web 镜像（Vite 构建 → Nginx 静态服务）
│       └── nginx.conf          # web 容器内 Nginx 配置（静态文件 + React Router）
├── nginx/
│   ├── Dockerfile              # Nginx 反向代理镜像（轻量，仅含配置）
│   └── fantasy-nba.conf        # 反向代理规则（路由分发 + 前缀剥除）
├── docker-compose.prod.yml     # 四容器编排
├── .env.docker.example         # 环境变量模板
├── .dockerignore               # Docker 构建排除规则
└── deploy.sh                   # 一键部署脚本
```

---

## 首次部署流程

### 第一步：安装 Docker

```bash
# 安装依赖工具
sudo dnf install -y yum-utils device-mapper-persistent-data lvm2

# 添加 Docker 仓库（阿里云镜像，国内速度快）
sudo dnf config-manager --add-repo \
  https://mirrors.aliyun.com/docker-ce/linux/centos/docker-ce.repo

# 安装 Docker CE 及 Compose 插件
sudo dnf install -y docker-ce docker-ce-cli containerd.io \
  docker-buildx-plugin docker-compose-plugin

# 启动并设置开机自启
sudo systemctl start docker
sudo systemctl enable docker

# 将当前用户加入 docker 组（避免每次 sudo）
sudo usermod -aG docker $USER
newgrp docker

# 验证
docker --version        # Docker version 27.x.x
docker compose version  # Docker Compose version v2.x.x
```

### 第二步：放行阿里云安全组端口

登录阿里云控制台 → ECS → 实例 → 安全组 → 配置规则 → **入方向**：

| 协议 | 端口 | 来源      | 说明            |
|------|------|-----------|-----------------|
| TCP  | 80   | 0.0.0.0/0 | HTTP            |
| TCP  | 443  | 0.0.0.0/0 | HTTPS（可选）   |

> 其余端口（3001、8080 等）**无需放行**，所有容器均在 Docker 内网通信。

### 第三步：拉取代码

```bash
git clone <your-repo-url> /opt/fantasy-nba
cd /opt/fantasy-nba
```

### 第四步：配置环境变量

```bash
cp .env.docker.example .env.docker
vim .env.docker
```

**必须修改的配置项：**

```env
# 数据库密码（设置强密码）
DB_ROOT_PASSWORD=your_strong_root_password
DB_PASSWORD=your_strong_db_password

# JWT 密钥（至少 32 位随机字符串）
# 生成命令：openssl rand -hex 32
JWT_SECRET=your_64_char_random_string

# 管理员账号
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your_admin_password
```

`VITE_API_URL=/api` 默认即正确，无需修改。

### 第五步：一键部署

```bash
chmod +x deploy.sh
bash deploy.sh --skip-pull --no-cache
```

脚本会自动完成：构建四个镜像 → 启动容器 → 等待服务就绪 → 清理旧镜像。

### 第六步：验证部署

```bash
# 查看容器状态（四个容器均应为 Up）
docker compose -f docker-compose.prod.yml --env-file .env.docker ps

# 测试前端（应返回 HTML）
curl -I http://localhost

# 测试 API 经 nginx 转发（应返回 401）
curl http://localhost/api/auth/profile

# 查看各服务日志
docker compose -f docker-compose.prod.yml --env-file .env.docker logs -f
```

---

## 更新部署

代码有更新时在服务器执行：

```bash
cd /opt/fantasy-nba
bash deploy.sh
```

| 场景                           | 命令                         |
|--------------------------------|------------------------------|
| 正常更新（拉代码 + 重构建）    | `bash deploy.sh`             |
| 跳过 git pull（手动上传代码）  | `bash deploy.sh --skip-pull` |
| 强制全量重建（不用 Docker 缓存）| `bash deploy.sh --no-cache` |

---

## 配置说明

### `.env.docker` 完整字段

| 变量名                  | 必填 | 默认值             | 说明                             |
|-------------------------|------|--------------------|----------------------------------|
| `DB_ROOT_PASSWORD`      | ✅   | —                  | MySQL root 密码                  |
| `DB_USERNAME`           |      | `fantasy_nba`      | 应用数据库用户                   |
| `DB_PASSWORD`           | ✅   | —                  | 应用数据库密码                   |
| `DB_DATABASE`           |      | `fantasy_nba_prod` | 数据库名                         |
| `JWT_SECRET`            | ✅   | —                  | JWT 签名密钥（≥ 32 字符）        |
| `JWT_EXPIRES_IN`        |      | `7d`               | Token 有效期                     |
| `VITE_API_URL`          |      | `/api`             | 前端访问 API 的路径（通常不改）  |
| `ADMIN_EMAIL`           | ✅   | —                  | 管理员邮箱                       |
| `ADMIN_PASSWORD`        | ✅   | —                  | 管理员密码                       |
| `SINA_BASE_URL`         |      | 新浪体育 API       | 数据同步源                       |
| `NBA_SEASON`            |      | `2025`             | NBA 赛季年份                     |
| `POLL_INTERVAL_MINUTES` |      | `5`                | 比赛期间爬取间隔（分钟）         |

---

## 常用运维命令

```bash
# 快捷别名（可加入 ~/.bashrc 长期使用）
alias dcp='docker compose -f /opt/fantasy-nba/docker-compose.prod.yml --env-file /opt/fantasy-nba/.env.docker'

# 查看所有容器状态
dcp ps

# 实时查看所有服务日志
dcp logs -f

# 查看单个服务日志
dcp logs -f nginx
dcp logs -f api
dcp logs -f web
dcp logs -f db

# 重启单个服务（不重建镜像）
dcp restart nginx
dcp restart api

# 进入容器调试
dcp exec api sh       # 进入 API 容器
dcp exec nginx sh     # 进入 Nginx 容器

# 进入数据库
dcp exec db mysql -u root -p

# 停止所有服务（保留数据卷）
dcp down

# ⚠️  停止并删除数据卷（会清空数据库！）
dcp down -v

# 手动备份数据库
dcp exec db mysqldump -u root -p${DB_ROOT_PASSWORD} fantasy_nba_prod \
  > /opt/backups/fantasy_nba_$(date +%Y%m%d_%H%M%S).sql
```

---

## 故障排查

### 容器未全部启动

```bash
dcp ps
# 找到未启动的容器，查看其日志
dcp logs <服务名>
```

**常见原因：**
- `db` 启动慢导致 `api` 提前退出 → 等待 30s 后执行 `dcp up -d`
- 数据库密码配置错误 → 检查 `DB_PASSWORD` 与 `DB_ROOT_PASSWORD`
- 端口 80 被宿主机进程占用 → `ss -tlnp | grep :80`

### 访问 80 端口返回 502 Bad Gateway

```bash
# 检查 nginx 能否连通 web 和 api
dcp exec nginx wget -qO- http://web   # 应返回 HTML
dcp exec nginx wget -qO- http://api/auth/profile  # 应返回 JSON

# 查看 nginx 错误日志
dcp logs nginx
```

### /api/ 路由返回 404

```bash
# 绕过 nginx 直接验证 api 容器是否正常
dcp exec nginx wget -qO- http://api/auth/profile   # 应返回 401，不是 404

# 检查 nginx 配置是否正确加载
dcp exec nginx nginx -T | grep "location /api"
```

### 前端显示正常但 API 请求失败

打开浏览器开发者工具 → Network，检查请求 URL 是否以 `/api/` 开头。
若不是，说明 `VITE_API_URL` 配置有误，需重新构建 web 和 nginx 镜像：

```bash
bash deploy.sh --skip-pull --no-cache
```

### 系统防火墙阻止 80 端口

```bash
sudo systemctl status firewalld

# 若防火墙运行中
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

---

## HTTPS 配置

域名须已解析到服务器 IP，阿里云安全组已放行 443 端口。

### 方案：使用 Certbot + 挂载证书到 nginx 容器

```bash
# 1. 在宿主机安装 Certbot
sudo dnf install -y certbot

# 2. 临时停止 nginx 容器（释放 80 端口供 Certbot 验证）
dcp stop nginx

# 3. 申请证书
sudo certbot certonly --standalone -d yourdomain.com

# 证书路径：
#   /etc/letsencrypt/live/yourdomain.com/fullchain.pem
#   /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

**修改 `docker-compose.prod.yml`，为 nginx 容器挂载证书并开放 443：**

```yaml
nginx:
  ports:
    - "80:80"
    - "443:443"
  volumes:
    - /etc/letsencrypt:/etc/letsencrypt:ro
```

**修改 `nginx/fantasy-nba.conf`，添加 HTTPS server 块：**

```nginx
# HTTP → HTTPS 跳转
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

# HTTPS 主配置
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # 其余 location 配置不变（/api/ 和 /）...
}
```

```bash
# 4. 重新部署（VITE_API_URL 为相对路径，无需重建 web 镜像）
dcp up -d --build nginx
```

**证书自动续期：**

```bash
# 添加定时任务，每月自动续期
echo "0 0 1 * * root certbot renew --quiet --pre-hook 'docker compose -f /opt/fantasy-nba/docker-compose.prod.yml --env-file /opt/fantasy-nba/.env.docker stop nginx' --post-hook 'docker compose -f /opt/fantasy-nba/docker-compose.prod.yml --env-file /opt/fantasy-nba/.env.docker start nginx'" \
  | sudo tee /etc/cron.d/certbot-fantasy-nba
```
