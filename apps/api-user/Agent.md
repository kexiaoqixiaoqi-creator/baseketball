# api-user

面向普通用户的 RESTful 后端服务，基于 **NestJS**，监听端口 **3001**。

提供用户认证、球员查询、赛日浏览、阵容管理、房间排名等功能。所有需要身份认证的接口通过 JWT Bearer Token 鉴权。

---

## 启动

```bash
npm run dev:api-user        # 开发模式（ts-node）
npm run build:api-user      # 生产构建
node apps/api-user/dist/main.js  # 生产运行
```

---

## APIs

### Auth — 认证

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

---

### Players — 球员

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/players` | 无 | 获取所有在役球员列表，含赛季均值和薪资 |
| GET | `/players/:id` | 无 | 获取单个球员详情 |

**查询参数（GET /players）**
- `position`：按位置筛选（PG / SG / SF / PF / C）
- `team`：按球队筛选

**响应字段**：`id, name, nameCn, position, team, jerseyNumber, isActive, cost, seasonStats{ppg, rpg, apg, spg, bpg, topg, mpg, fantasyScore, cost}`

---

### Game Days — 赛日

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/game-days` | 无 | 获取所有赛日列表（含比赛信息），按日期倒序 |
| GET | `/game-days/current` | 无 | 获取当前 active 赛日，无则返回 404 |
| GET | `/game-days/:id` | 无 | 获取指定赛日详情（含比赛列表） |
| GET | `/game-days/:id/players` | 无 | 获取指定赛日的可选球员（当日有赛事的球员），含薪资和赛季数据 |

**响应字段（赛日）**：`id, date, status, salaryCap, games[{id, homeTeam, awayTeam, status}]`

---

### Lineups — 阵容

所有接口需要 JWT 认证。

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| POST | `/lineups` | JWT | 提交阵容，包含完整的 7 步校验逻辑 |
| GET | `/lineups/history` | JWT | 获取当前用户的全部历史阵容（含得分） |
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

**提交校验流程**
1. 赛日状态必须为 `active`
2. 房间必须存在
3. 自定义房间须为房间成员
4. 同赛日+房间不能重复提交
5. 每个位置球员的 `position` 必须匹配
6. 5 名球员当日均须有赛事（在 `game_player_stats` 中有记录）
7. 总薪资 ≤ 房间薪资上限

**查询参数（GET /lineups/my）**：`gameDayId`, `roomId`

---

### Rooms — 房间

| 方法 | 路径 | 认证 | 说明 |
|---|---|---|---|
| GET | `/rooms` | 无 | 获取所有房间列表（含成员数） |
| GET | `/rooms/:id` | 无 | 获取房间详情 |
| POST | `/rooms` | JWT | 创建自定义房间（创建者自动加入） |
| POST | `/rooms/:id/join` | JWT | 加入指定房间 |
| GET | `/rooms/:id/rankings` | 无 | 获取指定房间某赛日的排名（仅含已结算阵容） |

**Request Body（POST /rooms）**
```json
{
  "name": "string",
  "salaryCap": 50000,
  "ptsWeight": 1.0,
  "rebWeight": 1.2,
  "astWeight": 1.5,
  "stlWeight": 3.0,
  "blkWeight": 3.0,
  "toWeight": -1.0
}
```

**查询参数（GET /rooms/:id/rankings）**：`gameDayId`

**排名响应**：`[{ rank, userId, username, totalScore, lineupId }]`
