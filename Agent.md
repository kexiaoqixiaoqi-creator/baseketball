# Fantasy NBA — 项目文档

## 项目简介

Fantasy NBA 是一款基于 NBA 真实赛程的梦幻篮球游戏。用户每个赛日在薪资上限内选出 5 名球员组成阵容，赛后根据球员实际表现数据计算分数，支持官方公共房间和用户自建自定义房间两种竞技模式。

---

## 基础架构

项目采用 **npm workspaces monorepo** 结构，分为 4 个子应用和 2 个共享包。

```
baseketball/
├── apps/
│   ├── api-user/       # C端用户后端 (NestJS, port 3001)
│   ├── api-admin/      # 管理后台后端 + 数据爬虫 (NestJS, port 3002)
│   ├── web-user/       # C端用户前端 (React + Vite, port 5173)
│   └── web-admin/      # 管理后台前端 (React + Vite, port 5174)
└── packages/
    ├── shared/         # 共享类型、常量、算法工具
    └── db/             # TypeORM 实体定义（两个后端共用）
```

### 子模块简介

| 子模块 | 说明 |
|---|---|
| **api-user** | 面向普通用户的 RESTful API，提供注册登录、查看球员/赛日、提交阵容、查看排名等功能 |
| **api-admin** | 管理员专用 API（JWT + isAdmin 鉴权），提供球员/赛日/房间/用户的全量 CRUD、赛日结算，以及**数据爬虫**（新浪体育同步球队/赛季统计/赛程/比赛得分，Cron 定时任务） |
| **web-user** | 移动端优先的用户界面，包含登录注册、阵容构建器、房间排名、个人历史等页面 |
| **web-admin** | 管理员桌面端界面，表格化管理所有数据实体，支持赛日结算操作 |

---

## 游戏玩法

### 基本流程

1. **赛前选阵容**：在赛日状态变为 `active` 后，用户从当日有赛事的球员中选出 5 名（PG / SG / SF / PF / C 各一人），总薪资不超过薪资上限（官方房间默认 **$50,000**）。
2. **等待比赛结束**：api-admin 内 Cron 定时同步比赛数据，写入 `game_player_stats`。
3. **赛日结算**：管理员点击「Complete Game Day」，系统对每条阵容计算 `totalScore` 并排名。
4. **查看排名**：各房间按得分由高到低排列，可跨赛日查看历史成绩。

### 薪资计算（赛前，基于赛季均值）

```
rawScore = ppg×1.0 + rpg×1.2 + apg×1.5 + spg×3.0 + bpg×3.0 − topg×1.0
cost     = 3000 + (rawScore − globalMin) / (globalMax − globalMin) × 6000
cost     = round(cost / 100) × 100   ← 取整到百
```

> 所有球员在同一次全局归一化中计算，薪资区间为 $3,000 ~ $9,000。

### 得分计算（赛后，基于实际表现）

```
fantasyScore = pts×w_pts + reb×w_reb + ast×w_ast + stl×w_stl + blk×w_blk + to×w_to
```

官方房间默认权重：`pts=1.0, reb=1.2, ast=1.5, stl=3.0, blk=3.0, to=-1.0`。自定义房间可设置独立权重。

阵容总分 = 5 名球员 `fantasyScore` 之和。

### 阵容规则

- 恰好 5 个位置：PG、SG、SF、PF、C 各一人
- 5 名球员当日均须有赛事安排
- 总薪资 ≤ 房间薪资上限
- 同一用户在同一房间同一赛日只能提交一份阵容

---

## 数据库设计

数据库使用 **MySQL**，所有实体定义位于 `packages/db/src/entities/`。

### 实体总览

| 表名 | 说明 |
|---|---|
| `users` | 用户账号，含用户名、邮箱、密码哈希、是否管理员 |
| `teams` | NBA 球队，含英文名、中文名、城市 |
| `players` | 球员信息，含姓名（中英文）、位置、球队、背号、是否在役 |
| `player_season_stats` | 球员赛季均值统计，含各项数据、fantasy 得分、薪资 |
| `game_days` | 赛日，含日期、状态（pending/active/completed）、薪资上限 |
| `games` | 单场比赛，关联赛日，含主客队、状态 |
| `game_player_stats` | 球员单场实际表现，含 pts/reb/ast/stl/blk/to/min 及 fantasy 得分 |
| `rooms` | 房间，含名称、是否官方、薪资上限、各项得分权重 |
| `room_members` | 房间成员关联表（复合唯一索引） |
| `lineups` | 用户阵容，关联用户/房间/赛日/5名球员，含总薪资和总得分 |
| `ext_id_map` | 外部 ID 映射，记录新浪体育的 tid/pid/mid 与内部主键的对应关系 |

### 关键关系

```
teams ──< players ──< player_season_stats
                  ──< game_player_stats >── games >── game_days
users ──< lineups >── rooms
               └──── game_days
rooms ──< room_members >── users
```

### 重要约束

- `lineups`：`(user_id, room_id, game_day_id)` 联合唯一索引，防止重复提交
- `room_members`：`(room_id, user_id)` 联合唯一索引
- `game_player_stats`：`(game_id, player_id)` 联合唯一索引
- TypeORM `DECIMAL` 类型列（如 `fantasyScore`、`totalScore`）查询结果为字符串，使用时需 `Number()` 转换
- `to`（TO，失误）为 MySQL 保留字，数据库列名统一使用 `to_val`

### 数据库环境隔离

| 环境 | 配置 | synchronize |
|------|------|-------------|
| 开发 | `.env` + `.env.development`，`DB_DATABASE=fantasy_nba` | 开启 |
| 生产 | `.env` + `.env.production`，`DB_DATABASE=fantasy_nba_prod`，`NODE_ENV=production` | 关闭 |

运行 `npm run dev:xxx` 时自动设置 `NODE_ENV=development`。生产部署需显式设置 `NODE_ENV=production`。

### 文档更新策略
如果相关内容有更新则需要及时的更新Agent.md文档