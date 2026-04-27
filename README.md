# pm · 个人项目管理工具

纯个人使用的 Mac 桌面项目管理工具。为"项目经理 + 业务顾问"角色设计。

## 当前状态

- **需求规格** — [`docs/spec.md`](docs/spec.md)
- **V1 实现计划（38 任务）** — [`docs/plans/v1/`](docs/plans/v1/)
- **前端原型（Things 风格）** — 已实现，`pnpm dev` 启动，使用 mock 数据
- **Tauri + SQLite 后端** — 待实现

下一步：实现后端，把 `src/lib/mockData.ts` 替换为 `src/lib/api.ts`（IPC 契约见任务 24）。

## 核心目标

- 统一视角管理多个并行项目和任务（解决"任务散落，答不出手上有啥"的痛点）
- 时间驱动的历史回顾（服务于周报手写）

## 技术栈

- 已落地：Vite · React 18 · TypeScript · pnpm
- 计划：Tauri 2.x · Rust · rusqlite · TanStack Query · SQLite

## 本地运行

```bash
pnpm install
pnpm dev        # http://localhost:5173
pnpm build      # 严格类型检查 + 生产构建
```

## 数据（待 Tauri 后端落地）

- 数据库文件：`~/Library/Application Support/pm/pm.db`
- 自动备份：`~/Documents/pm-backups/`
