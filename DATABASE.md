# 数据库表结构文档

数据库：`fantasy_nba`（MySQL）
ORM：TypeORM，`synchronize: true`（开发环境自动建表）
实体源码：`packages/db/src/entities/`

---

## 目录

| 表名 | 职责 |
|---|---|
| [users](#1-users) | 用户账号 |
| [players](#2-players) | 球员基本信息 |
| [player_season_stats](#3-player_season_stats) | 球员赛季场均数据 & 签约费 |
| [game_days](#4-game_days) | 比赛日 |
| [games](#5-games) | 单场比赛 |
| [game_player_stats](#6-game_player_stats) | 单场球员实时数据 |
| [rooms](#7-rooms) | 房间（官方 & 自定义） |
| [room_members](#8-room_members) | 房间成员 |
| [lineups](#9-lineups) | 用户阵容 |
| [ext_id_map](#10-ext_id_map) | 外部数据源 ID 映射 |

---

## 1. users

存储所有注册用户，包含管理员标志位。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | 内部用户 ID |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | 用户名 |
| `email` | VARCHAR(100) | UNIQUE, NOT NULL | 邮箱，用于登录 |
| `password_hash` | VARCHAR | NOT NULL | bcrypt 哈希密码 |
| `is_admin` | TINYINT(1) | DEFAULT 0 | 是否为管理员 |
| `created_at` | DATETIME | NOT NULL | 注册时间（自动写入） |

**关联**：`lineups.user_id → users.id`，`rooms.owner_id → users.id`，`room_members.user_id → users.id`

---

## 2. players

球员基本信息，由 api-scraper 从 Sina Sports 同步写入，每天 07:00 更新。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | 内部球员 ID |
| `name` | VARCHAR(100) | NOT NULL | 英文全名，如 `LeBron James` |
| `position` | ENUM | NOT NULL | `PG` / `SG` / `SF` / `PF` / `C` |
| `team` | VARCHAR(50) | NOT NULL | 所在球队英文简称，如 `Lakers` |
| `jersey_number` | VARCHAR(10) | NOT NULL | 球衣号码 |
| `is_active` | TINYINT(1) | DEFAULT 1 | 是否在现役名单中 |

**关联**：`player_season_stats.player_id → players.id`，`game_player_stats.player_id → players.id`，`ext_id_map` 中 `entity_type='player'` 的 `internal_id → players.id`

**注意**：`team` 为 VARCHAR，与 `games.home_team` / `games.away_team` 保持一致（均存英文简称），用于阵容合法性校验（球员当天是否有比赛）。

---

## 3. player_season_stats

球员本赛季场均数据和对应签约费，每天 07:30 由 api-scraper 刷新，刷新后全局重算 `cost`。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | |
| `player_id` | INT | FK → players.id, NOT NULL | |
| `season` | VARCHAR(10) | NOT NULL | 赛季标识，如 `2024-25` |
| `ppg` | DECIMAL(5,2) | DEFAULT 0 | 场均得分 |
| `rpg` | DECIMAL(5,2) | DEFAULT 0 | 场均篮板 |
| `apg` | DECIMAL(5,2) | DEFAULT 0 | 场均助攻 |
| `spg` | DECIMAL(5,2) | DEFAULT 0 | 场均抢断 |
| `bpg` | DECIMAL(5,2) | DEFAULT 0 | 场均盖帽 |
| `topg` | DECIMAL(5,2) | DEFAULT 0 | 场均失误 |
| `mpg` | DECIMAL(5,2) | DEFAULT 0 | 场均上场时间（分钟） |
| `fantasy_score` | DECIMAL(8,2) | DEFAULT 0 | 赛季场均幻想得分（见公式） |
| `cost` | INT | DEFAULT 0 | 签约费（3,000–9,000，百元取整） |

**幻想得分公式**
```
fantasy_score = ppg×1.0 + rpg×1.2 + apg×1.5 + spg×3.0 + bpg×3.0 − topg×1.0
```

**签约费计算**（全局归一化，一次性对所有球员同时计算）
```
rawScore = fantasy_score
cost = 3000 + (rawScore − globalMin) / (globalMax − globalMin) × 6000
cost = round(cost / 100) × 100
```

---

## 4. game_days

比赛日，代表某一天的所有 NBA 比赛集合。由 api-scraper 每天 08:00 自动创建，管理员也可手动维护。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | |
| `date` | DATE | NOT NULL | 比赛日期，如 `2026-02-19` |
| `status` | ENUM | DEFAULT `pending` | `pending` / `active` / `completed` |
| `salary_cap` | INT | DEFAULT 50000 | 该比赛日的薪资上限（官方默认 50,000） |

**状态流转**
```
pending  →  active（管理员手动激活，开放选人）
active   →  completed（管理员触发 complete 接口，计算得分）
```

**关联**：`games.game_day_id → game_days.id`，`lineups.game_day_id → game_days.id`

---

## 5. games

单场比赛，归属于某个比赛日。由 api-scraper 从赛程接口同步创建。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | |
| `game_day_id` | INT | FK → game_days.id, NOT NULL | 所属比赛日 |
| `home_team` | VARCHAR(50) | NOT NULL | 主场球队英文简称 |
| `away_team` | VARCHAR(50) | NOT NULL | 客场球队英文简称 |
| `status` | ENUM | DEFAULT `scheduled` | `scheduled` / `in_progress` / `completed` |

**状态流转**（由 api-scraper 自动更新）
```
scheduled  →  in_progress（首次收到有效数据时）
in_progress →  completed（所有球员离场且有统计数据时）
```

**关联**：`game_player_stats.game_id → games.id`，`ext_id_map` 中 `entity_type='game'` 的 `internal_id → games.id`

---

## 6. game_player_stats

单场比赛中每位球员的实时统计数据。由 api-scraper 在比赛进行中每 N 分钟轮询写入（默认 5 分钟）。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | |
| `game_id` | INT | FK → games.id, NOT NULL | 所属比赛 |
| `player_id` | INT | FK → players.id, NOT NULL | 球员 |
| `pts` | INT | DEFAULT 0 | 得分 |
| `reb` | INT | DEFAULT 0 | 篮板 |
| `ast` | INT | DEFAULT 0 | 助攻 |
| `stl` | INT | DEFAULT 0 | 抢断 |
| `blk` | INT | DEFAULT 0 | 盖帽 |
| `to_val` | INT | DEFAULT 0 | 失误（列名避开 MySQL 保留字 `to`） |
| `min` | INT | DEFAULT 0 | 上场时间（分钟，取整） |
| `fantasy_score` | DECIMAL(8,2) | DEFAULT 0 | 本场幻想得分（同上公式，用实际数据） |

**用途**：比赛日结束后，`api-admin` 遍历所有阵容，按房间权重从此表聚合每名球员的 `fantasy_score`，汇总写入 `lineups.total_score`。

**注意**：比赛日开始前，api-scraper 会为当天所有比赛预插入 pts=0 的占位行，供阵容合法性校验（判断某球员当天是否有比赛）。

---

## 7. rooms

房间，分为**官方房间**（`is_official=true`，`owner_id=NULL`）和**用户自建房间**。自建房间可自定义各项统计的权重和薪资上限。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | |
| `name` | VARCHAR(100) | NOT NULL | 房间名称 |
| `owner_id` | INT | FK → users.id, NULLABLE | 创建者；官方房间为 NULL |
| `is_official` | TINYINT(1) | DEFAULT 0 | 是否为官方房间 |
| `pts_weight` | FLOAT | DEFAULT 1.0 | 得分权重 |
| `reb_weight` | FLOAT | DEFAULT 1.2 | 篮板权重 |
| `ast_weight` | FLOAT | DEFAULT 1.5 | 助攻权重 |
| `stl_weight` | FLOAT | DEFAULT 3.0 | 抢断权重 |
| `blk_weight` | FLOAT | DEFAULT 3.0 | 盖帽权重 |
| `to_weight` | FLOAT | DEFAULT -1.0 | 失误权重（负值） |
| `salary_cap` | INT | DEFAULT 50000 | 该房间的薪资上限 |
| `created_at` | DATETIME | NOT NULL | 创建时间 |

**关联**：`room_members.room_id → rooms.id`，`lineups.room_id → rooms.id`

---

## 8. room_members

记录哪些用户加入了哪些自定义房间。官方房间不需要加入操作（所有用户均可参与）。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | |
| `room_id` | INT | FK → rooms.id, NOT NULL | |
| `user_id` | INT | FK → users.id, NOT NULL | |
| `joined_at` | DATETIME | NOT NULL | 加入时间 |

**唯一约束**：`(room_id, user_id)`，同一用户不能重复加入同一房间。

---

## 9. lineups

用户为某个比赛日在某个房间中提交的阵容。每个（用户, 房间, 比赛日）组合唯一。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | |
| `user_id` | INT | FK → users.id, NOT NULL | |
| `room_id` | INT | FK → rooms.id, NOT NULL | |
| `game_day_id` | INT | FK → game_days.id, NOT NULL | |
| `pg_id` | INT | FK → players.id, NOT NULL | 控球后卫 |
| `sg_id` | INT | FK → players.id, NOT NULL | 得分后卫 |
| `sf_id` | INT | FK → players.id, NOT NULL | 小前锋 |
| `pf_id` | INT | FK → players.id, NOT NULL | 大前锋 |
| `c_id` | INT | FK → players.id, NOT NULL | 中锋 |
| `total_cost` | INT | DEFAULT 0 | 5 名球员签约费总和，提交时计算写入 |
| `total_score` | DECIMAL(8,2) | NULLABLE | 幻想总得分；比赛日完成前为 NULL |
| `created_at` | DATETIME | NOT NULL | 提交时间 |

**唯一约束**：`(user_id, room_id, game_day_id)`，每人每房间每天只能提交一份阵容。

**提交校验**（api-user 执行，7 步顺序检查）：
1. `game_days.status = 'active'`
2. 房间存在
3. 非官方房间需检查用户是否已加入 `room_members`
4. 不存在重复阵容（唯一约束前置校验）
5. 5 名球员 ID 各不相同，且位置对应正确
6. 5 名球员在 `game_player_stats` 中均有该比赛日的记录（当天有比赛）
7. `total_cost ≤ room.salary_cap`

---

## 10. ext_id_map

外部数据源 ID 到内部主键的映射表，支持在不改动任何业务表的前提下切换数据源。

| 列名 | 类型 | 约束 | 说明 |
|---|---|---|---|
| `id` | INT | PK, AUTO_INCREMENT | |
| `source` | VARCHAR(32) | NOT NULL | 数据源名称，当前为 `'sina'` |
| `entity_type` | VARCHAR(16) | NOT NULL | `'team'` / `'player'` / `'game'` |
| `ext_id` | VARCHAR(64) | NOT NULL | 外部 UUID，如 `c4475a2b-157d-45b4-ac0e-f5462ebcc8c9` |
| `internal_id` | INT | NOT NULL | 对应内部主键（players.id 或 games.id；team 暂存 0） |
| `created_at` | DATETIME | NOT NULL | 首次写入时间 |

**唯一约束**：`(source, entity_type, ext_id)`

**当前数据量（sina 源）**

| entity_type | 行数 | 映射目标 |
|---|---|---|
| `team` | 30 | 暂存 0，仅用于解析 tid → 英文名 |
| `player` | ~624 | → `players.id` |
| `game` | 累积 | → `games.id` |

---

## 表关系总览

```
users
  ├─< lineups          (user_id)
  ├─< room_members     (user_id)
  └─< rooms            (owner_id, nullable)

players
  ├─< player_season_stats   (player_id)
  └─< game_player_stats     (player_id)

game_days
  ├─< games            (game_day_id)
  └─< lineups          (game_day_id)

games
  └─< game_player_stats     (game_id)

rooms
  ├─< room_members     (room_id)
  └─< lineups          (room_id)

ext_id_map             (独立映射表，不通过 FK 引用业务表)
```

---

## 数据流简图

```
[api-scraper]
    │  每天 07:00  同步球员 → players, ext_id_map(player)
    │  每天 07:30  同步场均 → player_season_stats (含 cost)
    │  每天 08:00  同步赛程 → game_days, games, ext_id_map(game)
    │  每 5 分钟   同步实时 → game_player_stats, games.status
    ▼
[api-user]
    │  用户选人   读 players + player_season_stats (cost)
    │             读 game_player_stats (球员是否当天有赛)
    │  提交阵容   写 lineups (total_cost, total_score=NULL)
    ▼
[api-admin]
    │  比赛日结束  读 game_player_stats + rooms (weights)
    │             计算 total_score → 写 lineups.total_score
    │             更新 game_days.status = 'completed'
```
