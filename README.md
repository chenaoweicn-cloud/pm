# pm · 个人项目管理工具

纯个人使用的 Mac 桌面项目管理工具。为"项目经理 + 业务顾问"角色设计。

## 当前状态

📋 **需求规格已确认** — 见 [`docs/spec.md`](docs/spec.md)

下一步：生成实现计划 → 进入开发。

## 核心目标

- 统一视角管理多个并行项目和任务（解决"任务散落，答不出手上有啥"的痛点）
- 时间驱动的历史回顾（服务于周报手写）

## 技术栈

- Tauri 2.x + Rust
- React + TypeScript + Vite
- shadcn/ui + Tailwind
- SQLite（本地单文件，无云同步）

## 数据

- 数据库文件：`~/Library/Application Support/pm/pm.db`
- 自动备份：`~/Documents/pm-backups/`
