# web

统一前端应用（合并原 web-admin + web-user），基于 **React + Vite + TypeScript**，监听端口 **5173**。

- **用户端**（`/`、`/login`、`/rooms`、`/lineup/:gameDayId` 等）：面向普通用户，移动端优先
- **管理端**（`/admin/*`）：桌面端专用，左侧边栏 + 右侧内容区

---

## 启动

```bash
npm run dev:web           # 开发模式（根目录）
npm run dev               # 开发模式（本目录）
npm run build             # 生产构建
```

---

## 技术栈

| 技术 | 用途 |
|---|---|
| React 19 + TypeScript | UI 框架 |
| Vite 7 | 构建工具 |
| React Router v7 | 路由 |
| Zustand | 状态管理（auth.store + admin-auth.store + lineup.store） |
| Axios | HTTP 客户端，含 JWT 拦截器（用户用 `apiClient`，管理用 `adminClient`） |

---

## API 客户端

| 客户端 | baseURL | token 存储 | 用途 |
|---|---|---|---|
| `apiClient` | `VITE_API_URL`（默认 `http://localhost:3001`） | `access_token` | 用户端：auth、players、game-days、lineups、rooms |
| `adminClient` | `VITE_API_URL/admin`（默认 `http://localhost:3001/admin`） | `admin_token` | 管理端：auth、players、teams、game-days、rooms、users、scraper |

---

## 路由结构

### 用户端

| 路径 | 认证 | 说明 |
|---|---|---|
| `/` | 公开 | 首页（当前赛日、排名） |
| `/login` | 公开 | 登录 |
| `/register` | 公开 | 注册 |
| `/rooms` | 公开 | 房间列表 |
| `/rooms/:id` | 公开 | 房间详情 |
| `/lineup/:gameDayId` | 需登录 | 阵容构建器 |
| `/profile` | 需登录 | 个人中心 |

### 管理端

| 路径 | 认证 | 说明 |
|---|---|---|
| `/admin/login` | 公开 | 管理员登录 |
| `/admin` | 需 Admin | 仪表盘 |
| `/admin/players` | 需 Admin | 球员管理 |
| `/admin/teams` | 需 Admin | 球队管理 |
| `/admin/game-days` | 需 Admin | 赛日管理 |
| `/admin/game-days/:id` | 需 Admin | 赛日详情 |
| `/admin/rooms` | 需 Admin | 房间管理 |
| `/admin/users` | 需 Admin | 用户管理 |
| `/admin/scraper` | 需 Admin | 数据同步 |

---

## 页面说明

### 用户端

#### `/` — 首页（Home）

- 当前赛日卡片：日期、状态、薪资上限、当日赛事列表
- 「Build My Lineup →」按钮跳转阵容构建器
- 最新排名：官方房间最近已结算赛日的前 10 名

#### `/login`、`/register`

- 邮箱 + 密码登录 / 注册
- 登录后保存 JWT 到 localStorage，跳转首页

#### `/lineup/:gameDayId` — 阵容构建器（LineupBuilder）

- 需登录
- 移动端：双 Tab（My Lineup / Player Pool）
- 桌面端：左右分栏
- 提交逻辑：前端校验薪资与 5 位置，后端执行 7 步校验

#### `/rooms`、`/rooms/:id` — 房间

- 房间列表支持创建自定义房间（需登录）
- 房间详情：赛日选择、排名列表、Join 按钮

#### `/profile` — 个人中心

- 需登录
- 用户信息、退出、历史阵容列表

---

### 管理端

#### `/admin/login` — 管理员登录

- 邮箱 + 密码，仅 `isAdmin = true` 可登录
- 登录后跳转 `/admin`（仪表盘）

#### `/admin` — 仪表盘（Dashboard）

- 5 张统计卡片：球员、球队、赛日、房间、用户
- 当前活跃赛日横幅及「Manage →」链接

#### `/admin/players` — 球员管理

- 搜索、筛选（位置、球队）、分页
- 表格：ID、英文名、中文名、位置、球队、背号、薪资、状态
- 操作：编辑、删除、Recalculate Costs

#### `/admin/teams` — 球队管理

- 30 支 NBA 球队，只读展示（数据来自爬虫）

#### `/admin/game-days` — 赛日管理

- 列表按日期倒序，状态徽标（pending / active / completed）
- Activate 按钮、Manage 链接、创建新赛日表单

#### `/admin/game-days/:id` — 赛日详情

- Tab 1：比赛列表，Activate / Complete & Score 按钮
- Tab 2：阵容排名列表

#### `/admin/rooms` — 房间管理

- 房间表格 + 选中后加载指定赛日排名

#### `/admin/users` — 用户管理

- 用户表格，Toggle Admin、Delete 操作

#### `/admin/scraper` — 数据同步

- Sync Rosters / Season Stats / Schedule / Active
- Aggregate Game Day（可选日期）

---

## 状态管理

### `auth.store.ts`

用户认证，持久化 `access_token`，提供 `login()` / `logout()` / `isAuthenticated()`。

### `admin-auth.store.ts`

管理员认证，持久化 `admin_token`，提供 `login()` / `logout()` / `isAuthenticated()`。

### `lineup.store.ts`

阵容构建临时状态：`selections`、`totalCost`、`salaryCap`、`selectPlayer()` / `removePlayer()` / `reset()` / `isValid()`。
