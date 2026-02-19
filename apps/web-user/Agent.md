# web-user

面向普通用户的前端应用，基于 **React + Vite + TypeScript**，监听端口 **5173**。

采用移动端优先（Mobile First）设计，支持手机和桌面端双重布局：移动端使用底部标签栏导航，桌面端（≥768px）使用顶部导航栏。

---

## 启动

```bash
npm run dev:web-user          # 开发模式
npm run build --workspace=apps/web-user  # 生产构建
```

---

## 技术栈

| 技术 | 用途 |
|---|---|
| React 18 + TypeScript | UI 框架 |
| Vite 7 | 构建工具 |
| React Router v6 | 路由 |
| Zustand | 状态管理（auth store + lineup store） |
| Axios | HTTP 客户端，含 JWT 拦截器和 401 自动跳转 |

---

## 页面说明

### `/` — 首页（Home）

**功能**：展示当前活跃赛日信息和历史排名。

- 当前赛日卡片：日期、状态徽标、薪资上限、当日赛事列表（主客队 + 状态）
- 「Build My Lineup →」按钮：跳转到当日阵容构建器
- 最新排名：官方房间最近一个已结算赛日的前 10 名

---

### `/login` — 登录

**功能**：邮箱 + 密码登录。

- 表单校验、错误提示
- 登录成功后保存 JWT token 到 localStorage，跳转首页
- 底部链接跳转注册页

---

### `/register` — 注册

**功能**：用户名 + 邮箱 + 密码注册新账号。

- 注册成功自动登录并跳转首页
- 底部链接跳转登录页

---

### `/lineup/:gameDayId` — 阵容构建器（LineupBuilder）

**功能**：为指定赛日选出 5 名球员提交阵容。需要登录。

**移动端**：双 Tab 布局
- **「My Lineup」Tab**：展示 5 个位置槽（PG/SG/SF/PF/C）、薪资使用进度条、提交按钮
- **「Player Pool」Tab**：位置筛选 Pill（ALL / PG / SG / SF / PF / C）+ 可滚动球员列表

**桌面端**：左右分栏，左侧阵容面板，右侧球员池。

**球员列表字段**：位置徽标、英文名、中文名、球队、赛季数据（pts/reb/ast）、薪资。

**提交逻辑**：前端实时校验薪资上限和 5 个位置是否齐全；后端执行完整的 7 步校验。

---

### `/rooms` — 房间列表（Rooms）

**功能**：浏览所有房间，支持创建自定义房间。

- 房间卡片：名称、官方/自定义徽标、薪资上限、成员数
- 官方房间左侧高亮红色边框
- 「+ Create」按钮（需登录）：展开表单填写名称和薪资上限
- 点击房间卡片跳转房间详情页

---

### `/rooms/:id` — 房间详情（RoomDetail）

**功能**：查看指定房间的历史排名。

- 房间名称、类型徽标、薪资上限、成员数
- 「Join」按钮（自定义房间 + 已登录）
- 赛日选择下拉框（仅显示 completed 赛日）
- 排名列表：#1 金色、#2 银色、#3 铜色，展示用户名和得分

---

### `/profile` — 个人中心（Profile）

**功能**：查看个人信息和历史阵容。需要登录。

- 用户头像（取用户名首字母）、用户名、邮箱
- 「Logout」退出按钮
- 历史阵容列表：赛日日期、所属房间、薪资消耗、最终得分（或「Pending」待结算徽标）

---

## 状态管理

### `auth.store.ts`

持久化存储（localStorage），保存 JWT token 和用户信息，提供 `login()` / `logout()` / `isAuthenticated()` 方法。

### `lineup.store.ts`

临时会话状态，管理阵容构建过程中的 5 个位置选择：

- `selections`：各位置当前选中球员
- `totalCost`：实时累计薪资
- `salaryCap`：当前房间上限
- `selectPlayer()` / `removePlayer()` / `reset()` / `isValid()`

---

## 路由结构

```
/                     公开
/login                公开
/register             公开
/rooms                公开
/rooms/:id            公开
/lineup/:gameDayId    需要登录（ProtectedRoute）
/profile              需要登录（ProtectedRoute）
```
