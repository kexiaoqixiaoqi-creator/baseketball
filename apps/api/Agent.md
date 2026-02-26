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
| GET | `/admin/scraper/cron-status` | Admin JWT | 定时任务监控：上次执行、状态、下次触发时间 |
| POST | `/admin/scraper/finish-game-days` | Admin JWT | 手动结算指定日期赛日（`?date=YYYY-MM-DD`，缺省为当日） |
| POST | `/admin/scraper/sync/rosters` | Admin JWT | 同步全部 30 支球队及球员名单 |
| POST | `/admin/scraper/sync/season-stats` | Admin JWT | 同步球员赛季均值，重算薪资 |
| POST | `/admin/scraper/sync/schedule` | Admin JWT | 同步赛程（`?date=YYYY-MM-DD&span=1`） |
| POST | `/admin/scraper/sync/active` | Admin JWT | 同步当前 playing 赛日下 playing 比赛 |
| POST | `/admin/scraper/sync/game-day/:id` | Admin JWT | 同步指定赛日下所有比赛 |
| POST | `/admin/scraper/sync/game/:id` | Admin JWT | 同步单场比赛 |
| POST | `/admin/scraper/sync/mid/:mid` | Admin JWT | 通过 Sina mid 同步单场 |
| POST | `/admin/scraper/aggregate/game-day` | Admin JWT | 聚合：同步某日赛程+比赛数据+赛季数据（`?date=YYYY-MM-DD`） |

**Cron 定时任务**（API 启动后自动运行）：

**调试说明**：修改系统时间后定时任务不会立即触发，因 node-cron 使用 `setInterval` 按真实流逝时间（非系统时钟）轮询。需**先改系统时间，再重启 API 进程**，启动时当前时刻若匹配 cron 表达式则会执行。
- 00:00 CST — activate-game-days（当日 prepare 赛日 → playing）
- 15:30 CST — finish-game-days（当日 playing 赛日 → finish 结算）
- 15:45 CST — season-stats sync（球员赛季场均、薪资重算）
- 16:00 CST — create-game-day（自动创建下一日赛日）
- 每 5 分钟 — 同步 status=playing 的比赛日下的比赛球员数据

---

## NestJS 项目规范

### 架构总览

本项目为 **Monorepo**，核心包说明：

| 包路径 | 说明 |
|---|---|
| `apps/api/src/` | NestJS 后端主体 |
| `packages/db/src/entities/` | TypeORM 实体（统一定义，由 `@fantasy-nba/db` 导出） |
| `packages/shared/` | 共享类型定义（Position 枚举等） |

---

### 模块结构规范

每个业务模块统一包含以下文件：

```
<module>/
  ├── <module>.module.ts       # 模块配置，注册 TypeOrmModule.forFeature([...entities])
  ├── <module>.service.ts      # 业务逻辑
  ├── <module>.controller.ts   # HTTP 路由（用户端）
  ├── admin-<module>.controller.ts  # HTTP 路由（管理端，可选）
  └── dto/
      ├── create-<module>.dto.ts
      └── update-<module>.dto.ts
```

**Admin vs User 控制器分离**：Admin 路由以 `admin/` 为前缀，配合 `@UseGuards(AdminGuard)` 保护；User 路由为公开或 JWT 可选。

---

### 实体（Entity）规范

- **位置**：所有实体统一放在 `packages/db/src/entities/`，分 `nba/`（NBA 数据）和 `app/`（业务数据）两个子目录
- **表名**：`@Entity('snake_case_table_name')`，NBA 数据表前缀 `nba_`，业务表前缀 `app_`
- **主键**：`@PrimaryGeneratedColumn()`（自增整型）
- **导出**：统一在 `packages/db/src/index.ts` re-export，API 通过 `import * as entities from '@fantasy-nba/db'` 批量加载

---

### 数据库变更规范（Migration）

> **规范**：所有数据库 schema 变更必须使用 **TypeORM 标准 Migration**，禁止修改 `ensure-database.ts` 或依赖 `synchronize` 自动同步。

#### 背景说明

历史遗留的 `apps/api/src/ensure-database.ts` 承担了早期的 schema 迁移工作（枚举重命名、列增删、表重命名等），现已完成使命，**不再新增任何迁移逻辑**。

TypeORM `synchronize` 仅用于本地初次建表，生产环境必须关闭（`DB_SYNCHRONIZE=false`）。

#### 迁移文件位置

```
apps/api/src/migrations/
  └── 1700000000000-MigrationName.ts
```

#### 有数据库变更时的操作流程

```bash
# 1. 修改 packages/db/src/entities/ 下的 Entity 定义

# 2. 自动生成迁移文件（对比 Entity 与当前数据库 schema 的差异）
npm run migration:generate -- apps/api/src/migrations/MigrationName

# 3. 检查生成的迁移文件，确认 up() / down() 逻辑正确

# 4. 本地执行迁移
npm run migration:run

# 5. 如需回滚
npm run migration:revert
```

#### 迁移文件规范

- 文件名格式：`{timestamp}-{PascalCaseName}.ts`，由命令自动生成
- 必须同时实现 `up()` 和 `down()`，确保可回滚
- 涉及数据回填（data migration）时，在 `up()` 中手写 `queryRunner.query(...)` 补充
- 迁移文件一旦提交，**禁止修改**，需变更请新建迁移

#### 禁止事项

- 禁止直接修改 Entity 而不创建迁移
- 禁止在 `ensure-database.ts` 中新增迁移逻辑
- 禁止生产环境开启 `synchronize: true`

---

### DTO 规范

- 使用 `class-validator` 装饰器做输入校验，全局已启用 `ValidationPipe({ whitelist: true, transform: true })`
- 常用装饰器：`@IsString()` / `@IsInt()` / `@IsEmail()` / `@IsEnum()` / `@IsOptional()` / `@MinLength()` / `@MaxLength()`
- DTO 命名：`CreateXxxDto` / `UpdateXxxDto`，放在模块 `dto/` 子目录

---

### 认证与鉴权规范

| Guard | 说明 | 使用场景 |
|---|---|---|
| `JwtAuthGuard` | 强制要求有效 JWT | 需登录接口 |
| `AdminGuard` | 继承 JwtAuthGuard，额外检查 `isAdmin=true` | 所有 `/admin/*` 路由 |
| `OptionalJwtAuthGuard` | JWT 可选，无 token 不报错 | 公开但需识别用户身份的接口 |

---

### 编码规范

- **依赖注入**：通过构造函数注入，不使用 `@Inject()` 属性注入
- **仓库操作**：在 Service 中通过 `@InjectRepository(Entity)` 注入 TypeORM Repository
- **路由参数**：数字 ID 一律加 `ParseIntPipe`，例如 `@Param('id', ParseIntPipe)`
- **环境变量**：通过 `ConfigService` 读取，不直接访问 `process.env`（已全局注册 ConfigModule）
- **共享服务**：跨模块需要的 Service 必须在对应 Module 的 `exports` 中声明
