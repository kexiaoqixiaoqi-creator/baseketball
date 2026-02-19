# api-admin

管理员专用后端服务，基于 **NestJS**，监听端口 **3002**。

提供球员、球队、赛日、比赛、房间、用户的全量管理功能、赛日结算，以及**数据爬虫**（新浪体育同步）。所有管理接口均需 JWT 且 `isAdmin = true`。爬虫功能已合并入 api-admin，无需单独起 api-scraper 服务。

---

## 启动

```bash
npm run dev:api-admin        # 开发模式
npm run build:api-admin      # 生产构建
node apps/api-admin/dist/main.js
```

---

## 认证说明

- **POST `/auth/login`**：管理员登录，普通用户会被拒绝（isAdmin 校验）
- 其余所有接口需在请求头携带：`Authorization: Bearer <token>`

---

## APIs

### Auth — 认证

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/auth/login` | 无 | 管理员登录，返回 `accessToken` |

---

### Players — 球员管理

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/players` | Admin JWT | 获取球员列表，支持搜索和筛选 |
| GET | `/players/:id` | Admin JWT | 获取单个球员详情 |
| POST | `/players` | Admin JWT | 创建球员 |
| PUT | `/players/:id` | Admin JWT | 更新球员信息 |
| DELETE | `/players/:id` | Admin JWT | 删除球员 |
| POST | `/players/recalculate-costs` | Admin JWT | 重新计算所有球员薪资（全局归一化） |

**查询参数（GET /players）**：`search`（名字模糊搜索），`position`，`team`

---

### Teams — 球队管理

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/teams` | Admin JWT | 获取所有球队列表（含中英文名称和城市） |
| GET | `/teams/:id` | Admin JWT | 获取球队详情（含旗下球员） |

---

### Game Days — 赛日管理

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/game-days` | Admin JWT | 获取所有赛日（含比赛列表） |
| GET | `/game-days/:id` | Admin JWT | 获取赛日详情 |
| POST | `/game-days` | Admin JWT | 创建赛日 |
| PATCH | `/game-days/:id/status` | Admin JWT | 更新赛日状态（pending / active / completed） |
| POST | `/game-days/:id/complete` | Admin JWT | **结算赛日**：读取所有阵容，按房间权重计算 totalScore，写回数据库，赛日标记为 completed |
| GET | `/game-days/:id/lineups` | Admin JWT | 获取赛日下所有已提交阵容（含用户名和得分） |

**Request Body（POST /game-days）**
```json
{ "date": "2026-02-19" }
```

**Request Body（PATCH /game-days/:id/status）**
```json
{ "status": "active" }
```

> `POST /game-days/:id/complete` 是核心结算接口：遍历该赛日所有阵容，对每个阵容按所属房间的权重对 5 名球员的实际 `game_player_stats` 累加得分，更新 `lineups.total_score`。

---

### Rooms — 房间管理

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/rooms` | Admin JWT | 获取所有房间（含成员列表） |
| GET | `/rooms/:id` | Admin JWT | 获取房间详情 |
| GET | `/rooms/:id/rankings` | Admin JWT | 获取房间指定赛日的排名 |

**查询参数（GET /rooms/:id/rankings）**：`gameDayId`

---

### Users — 用户管理

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/users` | Admin JWT | 获取所有用户列表 |
| GET | `/users/:id` | Admin JWT | 获取用户详情 |
| PATCH | `/users/:id/toggle-admin` | Admin JWT | 切换用户的 isAdmin 状态 |
| DELETE | `/users/:id` | Admin JWT | 删除用户（不能删除自身） |

---

### Scraper — 数据同步（新浪体育）

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/scraper/sync/rosters` | Admin JWT | 同步全部 30 支球队及球员名单 |
| POST | `/scraper/sync/season-stats` | Admin JWT | 同步球员赛季均值，重算薪资 |
| POST | `/scraper/sync/schedule` | Admin JWT | 同步赛程（`?date=YYYY-MM-DD&span=1`） |
| POST | `/scraper/sync/active` | Admin JWT | 同步当前 active 赛日下 in_progress 比赛 |
| POST | `/scraper/sync/game-day/:id` | Admin JWT | 同步指定赛日下所有比赛 |
| POST | `/scraper/sync/game/:id` | Admin JWT | 同步单场比赛 |
| POST | `/scraper/sync/mid/:mid` | Admin JWT | 通过 Sina mid 同步单场 |
| POST | `/scraper/aggregate/game-day` | Admin JWT | 聚合：同步某日赛程+比赛数据+赛季数据，返回 game_day 和 games（`?date=YYYY-MM-DD`） |

**Cron 定时任务**（api-admin 启动后自动运行）：
- 07:00 CST — roster sync
- 07:30 CST — season-stats sync
- 08:00 CST — schedule sync
- 08:00–14:00 CST 每 5 分钟 — 同步 in_progress 比赛
