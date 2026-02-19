# web-admin

管理员后台前端应用，基于 **React + Vite + TypeScript**，监听端口 **5174**。

桌面端专用（无移动端适配），采用左侧边栏 + 右侧内容区的经典管理后台布局。所有页面均需管理员登录。

---

## 启动

```bash
npm run dev:web-admin         # 开发模式
npm run build --workspace=apps/web-admin  # 生产构建
```

---

## 技术栈

| 技术 | 用途 |
|---|---|
| React 18 + TypeScript | UI 框架 |
| Vite 7 | 构建工具 |
| React Router v6 | 路由 |
| Zustand | 管理员 auth 状态 |
| Axios | HTTP 客户端，含管理员 JWT 拦截器 |

---

## 布局

- **左侧边栏（220px）**：Logo + 导航菜单 + 当前用户名 + 退出按钮
- **右侧内容区**：各功能页面

未登录时自动重定向到 `/login`。

---

## 页面说明

### `/scraper` — 数据同步（Data Sync）

**功能**：手动触发新浪体育数据同步。

- **Sync Rosters**：同步 30 支球队及球员名单
- **Sync Season Stats**：同步球员赛季均值，重算薪资
- **Sync Schedule**：同步指定日期的赛程（可选日期）
- **Sync Active Games**：同步当前 active 赛日下 in_progress 比赛
- **Aggregate Game Day**：聚合某日赛程 + 比赛数据 + 赛季数据（可选日期）

---

### `/login` — 管理员登录

**功能**：管理员账号登录入口。

- 邮箱 + 密码表单
- 只有 `isAdmin = true` 的账号才能登录（普通用户会被后端拒绝）
- 登录成功后跳转仪表盘

---

### `/` — 仪表盘（Dashboard）

**功能**：系统概览。

- 5 张统计卡片：球员总数、球队数、赛日数、房间数、用户数
- 当前活跃赛日横幅：显示日期、状态和「Manage →」快捷链接
- 数据来自各对应 API 的 count

---

### `/players` — 球员管理（Players）

**功能**：浏览和管理所有球员。

- **搜索和筛选**：关键字搜索（英文名/中文名）、位置筛选、球队筛选
- **分页**：每页 50 条，页码控制
- **表格字段**：ID、英文名、中文名、位置、球队、背号、薪资、Fantasy 得分均值、状态（在役/停役）
- **操作**：编辑（内联表单）、删除

---

### `/teams` — 球队管理（Teams）

**功能**：展示 30 支 NBA 球队信息，数据来自新浪 API 同步。

- **表格字段**：ID、英文名（含城市）、中文名、中文城市
- 只读展示，数据由爬虫同步

---

### `/game-days` — 赛日管理（GameDays）

**功能**：管理所有赛日的生命周期。

- **列表**：按日期倒序，左侧彩色边框标识状态（绿=active / 橙=pending / 灰=completed）
- **状态徽标**：PENDING / ACTIVE / COMPLETED
- **操作**：
  - 「Activate」按钮（仅 pending 赛日）：将赛日状态改为 active，用户可开始提交阵容
  - 「Manage →」链接：进入赛日详情页
- **创建表单**：选择日期，创建新赛日（初始状态 pending）

---

### `/game-days/:id` — 赛日详情（GameDayDetail）

**功能**：管理单个赛日的比赛和阵容，并执行结算。

**Tab 1 — Games（比赛）**
- 当前赛日状态和薪资上限
- 比赛列表：主客队、状态（scheduled / in_progress / completed）
- 状态操作按钮：Activate（pending→active）/ Complete & Score（active→completed，触发结算）

**Tab 2 — Lineups（阵容）**
- 该赛日所有已提交阵容的排名列表
- 字段：排名（金/银/铜色高亮）、用户名、所属房间、薪资、得分（未结算显示「—」）

---

### `/rooms` — 房间管理（RoomsAdmin）

**功能**：查看所有房间及各房间排名。

- **左侧**：房间表格（ID、名称、类型、薪资上限、成员数），支持点击查看排名
- **右侧面板**（选中房间后展开）：
  - 选择赛日下拉框（显示所有赛日）
  - 「Load」按钮加载该房间在指定赛日的排名
  - 排名表：#1/#2/#3 金银铜色，展示用户名、薪资、得分

---

### `/users` — 用户管理（Users）

**功能**：管理平台所有用户账号。

- **表格字段**：ID、用户名、邮箱、角色（ADMIN / USER 徽标）、注册时间
- **操作**：
  - 「Toggle Admin」：切换用户的管理员权限（当前登录账号不可操作自身）
  - 「Delete」：删除用户（当前登录账号不可操作自身，有二次确认 alert）
