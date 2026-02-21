# api

统一后端服务（合并原 api-admin + api-user），基于 **NestJS**，监听端口 **3001**。

- **Admin 接口**（`/admin/*`）：需 JWT 且 `isAdmin = true`
- **User 接口**（`/auth`、`/players`、`/game-days`、`/lineups`、`/rooms`）：部分需 JWT，部分公开

数据爬虫（新浪体育同步）已内置，Cron 定时任务自动运行。

---

## 启动

```bash
npm run dev:api           # 开发模式（根目录）
npm run start:dev         # 开发模式（本目录）
npm run build             # 生产构建
```

---

## 路由前缀说明

| 前缀 | 认证 | 说明 |
|---|---|---|
| `/admin/*` | Admin JWT | 管理员专用：球员 CRUD、赛日管理、房间查看、用户管理、球队、数据同步 |
| `/auth` | 无 / JWT | 用户注册、登录、获取当前用户 |
| `/players` | 无 | 公开球员列表（只读，含薪资） |
| `/game-days` | 无 | 公开赛日、当前赛日、可选球员 |
| `/lineups` | JWT | 提交阵容、历史、我的阵容 |
| `/rooms` | 无 / JWT | 房间列表、详情、创建、加入、排名 |

---

## APIs

### Auth — 认证

#### 管理员登录（Admin）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/admin/auth/login` | 无 | 管理员登录，返回 `accessToken`（仅 isAdmin 用户可登录） |

**Request Body**
```json
{ "email": "string", "password": "string" }
```

#### 用户认证（User）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/auth/register` | 无 | 注册新用户，返回 `accessToken` 和用户信息 |
| POST | `/auth/login` | 无 | 邮箱+密码登录，返回 `accessToken` 和用户信息 |
| GET | `/auth/me` | JWT | 获取当前登录用户信息 |

**Request Body（register）**
```json
{ "username": "string", "email": "string", "password": "string" }
```

**Request Body（login）**
```json
{ "email": "string", "password": "string" }
```

> 所有需认证接口请在请求头携带：`Authorization: Bearer <token>`

---

### Players — 球员

#### 用户端（公开）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/players` | 无 | 获取所有在役球员列表，含赛季均值和薪资 |
| GET | `/players/:id` | 无 | 获取单个球员详情 |

**查询参数（GET /players）**：`position`，`team`

#### 管理端（Admin）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/admin/players` | Admin JWT | 获取球员列表，支持搜索和筛选 |
| GET | `/admin/players/:id` | Admin JWT | 获取单个球员详情 |
| POST | `/admin/players` | Admin JWT | 创建球员 |
| PUT | `/admin/players/:id` | Admin JWT | 更新球员信息 |
| DELETE | `/admin/players/:id` | Admin JWT | 删除球员 |

**查询参数（GET /admin/players）**：`search`（名字模糊搜索），`position`，`team`

---

### Teams — 球队管理（Admin）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/admin/teams` | Admin JWT | 获取所有球队列表 |
| GET | `/admin/teams/:id` | Admin JWT | 获取球队详情（含旗下球员） |

---

### Game Days — 赛日

#### 用户端（公开）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/game-days` | 无 | 获取所有赛日列表（含比赛信息），按日期倒序 |
| GET | `/game-days/current` | 无 | 获取当前 playing 赛日，无则返回 404 |
| GET | `/game-days/:id` | 无 | 获取指定赛日详情 |
| GET | `/game-days/:id/players` | 无 | 获取指定赛日的可选球员（当日有赛事），含薪资和赛季数据 |

#### 管理端（Admin）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/admin/game-days` | Admin JWT | 获取所有赛日 |
| GET | `/admin/game-days/:id` | Admin JWT | 获取赛日详情 |
| POST | `/admin/game-days` | Admin JWT | 创建赛日 |
| PATCH | `/admin/game-days/:id/status` | Admin JWT | 更新赛日状态 |
| POST | `/admin/game-days/:id/complete` | Admin JWT | **结算赛日**：计算所有阵容得分，写回数据库 |
| GET | `/admin/game-days/:id/lineups` | Admin JWT | 获取赛日下所有已提交阵容 |
| GET | `/admin/game-days/:id/player-stats` | Admin JWT | 获取赛日下所有球员当日比赛数据（pts/reb/ast 等） |

**Request Body（POST /admin/game-days）**
```json
{ "date": "2026-02-19" }
```

**Request Body（PATCH /admin/game-days/:id/status）**
```json
{ "status": "playing" }
```

---

### Lineups — 阵容（User，需 JWT）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/lineups` | JWT | 提交阵容，包含完整的 7 步校验逻辑 |
| GET | `/lineups/history` | JWT | 获取当前用户的全部历史阵容 |
| GET | `/lineups/my` | JWT | 查询指定赛日+房间的阵容详情 |

**Request Body（POST /lineups）**
```json
{
  "gameDayId": 1,
  "roomId": 1,
  "pgId": 10,
  "sgId": 22,
  "sfId": 33,
  "pfId": 44,
  "cId": 55
}
```

**提交校验流程**：1. 赛日 playing；2. 房间存在；3. 自定义房间须为成员；4. 无重复提交；5. 位置匹配；6. 5 名球员当日均有赛事；7. 总薪资 ≤ 房间上限。

**查询参数（GET /lineups/my）**：`gameDayId`，`roomId`

---

### Rooms — 房间

#### 用户端

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/rooms` | 无 | 获取所有房间列表（含成员数） |
| GET | `/rooms/official` | 无 | 获取官方房间（启动时自动创建，薪资帽 $50,000） |
| GET | `/rooms/:id` | 无 | 获取房间详情 |
| POST | `/rooms` | JWT | 创建自定义房间（创建者自动加入） |
| POST | `/rooms/:id/join` | JWT | 加入指定房间 |
| GET | `/rooms/:id/rankings` | 无 | 获取指定房间某赛日的排名 |

**查询参数（GET /rooms/:id/rankings）**：`gameDayId`

#### 管理端（Admin）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/admin/rooms` | Admin JWT | 获取所有房间 |
| GET | `/admin/rooms/:id` | Admin JWT | 获取房间详情 |
| GET | `/admin/rooms/:id/rankings` | Admin JWT | 获取房间指定赛日的排名 |

**查询参数（GET /admin/rooms/:id/rankings）**：`gameDayId`

---

### Users — 用户管理（Admin）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/admin/users` | Admin JWT | 获取所有用户列表 |
| GET | `/admin/users/:id` | Admin JWT | 获取用户详情 |
| PATCH | `/admin/users/:id/toggle-admin` | Admin JWT | 切换用户的 isAdmin 状态 |
| DELETE | `/admin/users/:id` | Admin JWT | 删除用户（不能删除自身） |

---

### Scraper — 数据同步（Admin，新浪体育）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/admin/scraper/sync/rosters` | Admin JWT | 同步全部 30 支球队及球员名单 |
| POST | `/admin/scraper/sync/season-stats` | Admin JWT | 同步球员赛季均值，重算薪资 |
| POST | `/admin/scraper/sync/schedule` | Admin JWT | 同步赛程（`?date=YYYY-MM-DD&span=1`） |
| POST | `/admin/scraper/sync/active` | Admin JWT | 同步当前 playing 赛日下 playing 比赛 |
| POST | `/admin/scraper/sync/game-day/:id` | Admin JWT | 同步指定赛日下所有比赛 |
| POST | `/admin/scraper/sync/game/:id` | Admin JWT | 同步单场比赛 |
| POST | `/admin/scraper/sync/mid/:mid` | Admin JWT | 通过 Sina mid 同步单场 |
| POST | `/admin/scraper/aggregate/game-day` | Admin JWT | 聚合：同步某日赛程+比赛数据+赛季数据（`?date=YYYY-MM-DD`） |

**Cron 定时任务**（API 启动后自动运行）：
- 00:00 CST — activate-game-days（当日 prepare 赛日 → playing）
- 16:00 CST — finish-game-days（当日 playing 赛日 → finish 结算）
- 18:00 CST — season-stats sync（球员赛季场均、薪资重算）
- 18:30 CST — create-game-day（自动创建当日赛日）
- 每 5 分钟 — 同步 status=playing 的比赛日下的比赛球员数据
