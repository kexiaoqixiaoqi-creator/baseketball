# api-scraper 接口文档

**服务地址**：`http://localhost:3003`
**职责**：从 Sina Sports 拉取真实 NBA 数据，写入本地数据库，供 api-user / api-admin 消费。

---

## 目录

- [一、手动触发接口](#一手动触发接口)
  - [1. 同步球队阵容](#1-同步球队阵容)
  - [2. 同步赛季场均数据](#2-同步赛季场均数据)
  - [3. 同步比赛日程](#3-同步比赛日程)
  - [4. 同步所有进行中比赛](#4-同步所有进行中比赛)
  - [5. 同步整个比赛日](#5-同步整个比赛日)
  - [6. 按内部 ID 同步单场比赛](#6-按内部-id-同步单场比赛)
  - [7. 按 Sina mid 同步单场比赛](#7-按-sina-mid-同步单场比赛)
- [二、定时任务（自动）](#二定时任务自动)
- [三、上游 Sina Sports API](#三上游-sina-sports-api)
- [四、数据写入说明](#四数据写入说明)
- [五、环境变量](#五环境变量)
- [六、外部 ID 映射机制](#六外部-id-映射机制)

---

## 一、手动触发接口

> 所有接口均为 **POST**，无需鉴权，用于测试、补录或一次性刷新。

---

### 1. 同步球队阵容

```
POST /scraper/sync/rosters
```

拉取全联盟 30 支球队的名单，将球员基本信息写入 `players` 表，并在 `ext_id_map` 中维护 `tid`（球队）和 `pid`（球员）与内部 ID 的映射。已存在的球员仅更新姓名、位置、球队、号码；新球员会插入。

**无请求体**

**响应示例**
```json
{
  "teams": 30,
  "players": 624
}
```

| 字段 | 说明 |
|---|---|
| `teams` | 处理的球队数 |
| `players` | 写入/更新的球员数 |

---

### 2. 同步赛季场均数据

```
POST /scraper/sync/season-stats
```

对全联盟 30 支球队逐队调用赛季均值接口，将 ppg / rpg / apg / spg / bpg / topg / mpg 写入 `player_season_stats`，同时以**全局一次性归一化**重新计算所有球员签约费（3,000–9,000），写入 `player_season_stats.cost`。

> **前置条件**：须先执行一次球队阵容同步，确保 `ext_id_map` 中存在 pid 映射。

**无请求体**

**响应示例**
```json
{
  "updated": 531
}
```

| 字段 | 说明 |
|---|---|
| `updated` | 更新的球员条数 |

---

### 3. 同步比赛日程

```
POST /scraper/sync/schedule?date=YYYY-MM-DD&span=N
```

拉取指定日期起 N 天的赛程，写入 `game_days` 和 `games` 表，并在 `ext_id_map` 中维护 `mid`（比赛）到内部 `game.id` 的映射。已存在的比赛只更新状态，不会重复插入。

**Query 参数**

| 参数 | 类型 | 默认值 | 说明 |
|---|---|---|---|
| `date` | string | 当天 | 起始日期，格式 `YYYY-MM-DD` |
| `span` | number | `1` | 覆盖天数，最大不限 |

**无请求体**

**响应示例**
```json
{
  "games": 25
}
```

| 字段 | 说明 |
|---|---|
| `games` | 写入/更新的比赛场数 |

---

### 4. 同步所有进行中比赛

```
POST /scraper/sync/active
```

查询 `game_days.status = 'active'` 下所有 `status IN ('scheduled', 'in_progress')` 的比赛，逐场调用 Sina `game_player` 接口，将球员实时数据 upsert 到 `game_player_stats`。若比赛结束（无球员在场且有有效数据），自动将 `games.status` 更新为 `completed`。

**无请求体**

**响应示例**
```json
{
  "synced": 4
}
```

| 字段 | 说明 |
|---|---|
| `synced` | 本次成功拉取的比赛场数 |

---

### 5. 同步整个比赛日

```
POST /scraper/sync/game-day/:id
```

按内部 `game_day.id` 同步该比赛日下所有未完成的比赛（逐场调用 `game_player`）。

**路径参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | number | 内部 `game_days.id` |

**响应示例**
```json
{
  "synced": 5
}
```

**错误响应**
```json
{ "statusCode": 404, "message": "GameDay 99 not found" }
```

---

### 6. 按内部 ID 同步单场比赛

```
POST /scraper/sync/game/:id
```

按内部 `games.id` 拉取并写入该场比赛的球员数据。

**路径参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `id` | number | 内部 `games.id` |

**响应示例**
```json
{ "ok": true }
```

**错误响应**
```json
{ "statusCode": 404, "message": "Game 99 not found" }
```

---

### 7. 按 Sina mid 同步单场比赛

```
POST /scraper/sync/mid/:mid
```

直接用 Sina 的外部比赛 UUID（`mid`）触发同步，无需知道内部 ID。

**路径参数**

| 参数 | 类型 | 说明 |
|---|---|---|
| `mid` | string | Sina 比赛 UUID，如 `7230ac70-e0d9-5880-a3de-fa8db80d1e04` |

**响应示例**
```json
{ "ok": true }
```

**错误响应**（mid 未在 ext_id_map 中）
```json
{ "statusCode": 500, "message": "No mapping for mid=..." }
```

---

## 二、定时任务（自动）

时区统一为 **CST（UTC+8 北京时间）**。

| 时间 | 任务 | 对应手动接口 |
|---|---|---|
| 每天 **07:00** | 同步全联盟球员阵容 | `POST /scraper/sync/rosters` |
| 每天 **07:30** | 同步赛季均值 + 重算签约费 | `POST /scraper/sync/season-stats` |
| 每天 **08:00** | 同步当日赛程 | `POST /scraper/sync/schedule` |
| **每 N 分钟**（08:00–14:00 CST 窗口内） | 轮询进行中比赛数据 | `POST /scraper/sync/active` |

> N 由环境变量 `POLL_INTERVAL_MINUTES` 控制，默认 **5 分钟**。
> 轮询时间窗口由 `GAME_START_HOUR`（默认 8）和 `GAME_END_HOUR`（默认 14）控制。

---

## 三、上游 Sina Sports API

Base URL：`https://slamdunk.sports.sina.com.cn/api`
所有请求均为 GET，固定携带 `p=radar`。

| 用途 | 参数 | 使用场景 |
|---|---|---|
| 获取全联盟球队列表 | `s=team&a=rosters` | 阵容同步第一步，获取所有 `tid` |
| 获取单队详细名单 | `s=team&a=roster&tid=...&season=2024` | 阵容同步，获取球员位置、号码等详细信息 |
| 获取球队赛季场均 | `s=stats&a=players&tid=...&season_type=reg&split=average` | 赛季数据同步，获取 ppg/rpg/apg 等均值 |
| 获取日期范围赛程 | `s=schedule&a=date_span&date=YYYY-MM-DD&span=N` | 比赛日程同步 |
| 获取单场实时球员数据 | `s=summary&a=game_player&mid=...` | 比赛进行中轮询球员数据 |

**统一响应结构**
```json
{
  "result": {
    "status": { "code": 0, "msg": "..." },
    "timestamp": "...",
    "data": { ... }
  }
}
```

`code != 0` 时视为接口错误，触发重试（当前实现直接抛出异常由调用方处理）。

### 位置字段映射（中文 → 英文枚举）

| Sina 返回值 | 内部枚举 |
|---|---|
| 控球后卫 | `PG` |
| 后卫（泛指） | `PG` |
| 得分后卫 | `SG` |
| 小前锋 | `SF` |
| 前锋（泛指） | `SF` |
| 大前锋 | `PF` |
| 中锋 | `C` |

---

## 四、数据写入说明

### 阵容同步写入路径

```
Sina rosters → ext_id_map (team: tid→0)
Sina roster  → players (name/position/team/jersey)
             → ext_id_map (player: pid→players.id)
```

### 赛季数据写入路径

```
ext_id_map.team  → 遍历所有 tid
Sina stats       → player_season_stats (ppg/rpg/apg/spg/bpg/topg/mpg/fantasy_score/cost)
```

### 日程同步写入路径

```
Sina schedule → game_days (date/status='pending'/salary_cap=50000)
              → games (game_day_id/home_team/away_team/status)
              → ext_id_map (game: mid→games.id)
```

### 实时数据写入路径

```
ext_id_map.game  → 查询 mid
Sina game_player → game_player_stats (pts/reb/ast/stl/blk/to_val/min/fantasy_score)
                 → games.status 自动更新 (scheduled→in_progress→completed)
```

**计分公式**（写入 `game_player_stats.fantasy_score`）
```
fantasy_score = pts×1.0 + reb×1.2 + ast×1.5 + stl×3.0 + blk×3.0 − to×1.0
```

---

## 五、环境变量

文件位置：`apps/api-scraper/.env`

| 变量 | 默认值 | 说明 |
|---|---|---|
| `DB_HOST` | `localhost` | MySQL 地址 |
| `DB_PORT` | `3306` | MySQL 端口 |
| `DB_USERNAME` | `root` | 数据库用户名 |
| `DB_PASSWORD` | _(空)_ | 数据库密码 |
| `DB_DATABASE` | `fantasy_nba` | 数据库名 |
| `API_SCRAPER_PORT` | `3003` | 服务端口 |
| `SINA_BASE_URL` | `https://slamdunk.sports.sina.com.cn/api` | 数据源 Base URL，切换数据源时修改此处 |
| `NBA_SEASON` | `2025` | 当前赛季年份（Sina roster 接口使用 season-1） |
| `POLL_INTERVAL_MINUTES` | `5` | 实时比赛数据轮询间隔（分钟） |
| `GAME_START_HOUR` | `8` | 轮询开始时间（CST 小时，含） |
| `GAME_END_HOUR` | `14` | 轮询结束时间（CST 小时，不含） |

---

## 六、外部 ID 映射机制

### 设计目的

Sina Sports 为每支球队（`tid`）、每名球员（`pid`）、每场比赛（`mid`）分配 UUID 形式的字符串 ID。这些 ID 与我们内部的自增主键完全独立。当数据源从 Sina 切换至其他提供商（如 ESPN、nba_stats.com）时，只需为新来源插入一批新的映射行，内部所有关联数据（阵容、赛程、统计）均无需修改。

### `ext_id_map` 表结构

| 列 | 类型 | 说明 |
|---|---|---|
| `id` | INT PK | 自增主键 |
| `source` | VARCHAR(32) | 数据源名称，如 `'sina'` |
| `entity_type` | VARCHAR(16) | `'team'` / `'player'` / `'game'` |
| `ext_id` | VARCHAR(64) | 外部 UUID |
| `internal_id` | INT | 内部主键（`players.id` 或 `games.id`；team 映射为 0） |
| `created_at` | DATETIME | 首次写入时间 |

**唯一约束**：`(source, entity_type, ext_id)`

### 当前数据量（Sina 源）

| entity_type | 行数 |
|---|---|
| team | 30 |
| player | ~624 |
| game | 按同步天数累积 |

### 切换数据源示例

```sql
-- 为 ESPN 源批量插入球员映射（espn_pid 与 internal player.id 对应关系另行维护）
INSERT INTO ext_id_map (source, entity_type, ext_id, internal_id)
VALUES ('espn', 'player', 'espn-player-001', 7),
       ('espn', 'player', 'espn-player-002', 12),
       ...
ON DUPLICATE KEY UPDATE internal_id = VALUES(internal_id);
```

切换后将 `SINA_BASE_URL` 替换为新数据源地址，并实现对应的 Client Service 即可。
