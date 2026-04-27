# pm · V1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Date:** 2026-04-23

**Goal:** 实现 `docs/spec.md` 定义的 V1 个人项目管理工具（Tauri + React + SQLite 桌面应用）

**Architecture:**
后端用 Rust（Tauri IPC + rusqlite + 原生 SQL）做所有数据操作和系统集成；前端用 React + TypeScript + shadcn/ui 实现视图层，TanStack Query 负责缓存 IPC 结果。所有功能通过 `lib/api.ts` 作为前后端唯一契约点。

**Tech Stack:** Tauri 2.x · Rust · rusqlite · React 18 · TypeScript · Vite · shadcn/ui · Tailwind · TanStack Query · React Router · date-fns · Vitest · cargo test

> **如何阅读本计划：** 本目录下的 `01-*.md` 到 `38-*.md` 是按执行顺序编号的独立任务文件，每次执行一个任务时只需打开对应文件即可。本 README 提供总览、文件结构蓝图、任务索引和依赖图。

---

## 计划状态变更（2026-04-27 更新）

**本计划原设计为 P1→P2→P3→P4→P5 顺序执行，UI 留到最后。实际执行偏离了这个顺序**——前端已经按 Things 风格设计稿提前实现完毕（一次性覆盖了 P4 + P5）。后续按下表的修订版本执行：

| 阶段 | 原计划 | 当前状态 |
|---|---|---|
| P1 | 9 个任务 | **任务 1 需要重写**（已有 Vite/React/TS 脚手架，不能再跑 `pnpm create tauri-app`，改为手动加 `src-tauri/` + `@tauri-apps/cli` + `@tauri-apps/api`）；任务 2-9 照原样执行 |
| P2 | 13 个任务 | 全部照原样执行 |
| P3 | 6 个任务 | **任务 23 改为合并而非新建**（`src/lib/types.ts` 已存在，按计划补齐缺字段）；任务 24-28 照原样，但前置需 `pnpm add @tanstack/react-query` |
| P4 | 10 个任务 | **整段跳过**（已被 Things 风格真 UI 替代，见 `src/features/*` 和 `src/design/tokens.ts`） |
| P5 | 单独计划 | **不再需要**（与 P4 一同被前端原型覆盖） |
| **新增 · Wiring** | — | **任务 39**：把现有组件里 `import from '@/lib/mockData'` 替换成 P3 写好的 Query hooks；把 `src/lib/date.ts` 里写死的 `TODAY = '2026-04-23'` 换成 `new Date().toISOString().slice(0, 10)`；删除 `mockData.ts` |

**实际待做：28 个原任务（P1-P3 减去任务 1、23 的旧版本）+ 2 个调整版任务（1、23）+ 1 个新增 wiring（39）。**

---

## 分阶段策略

| 阶段 | 内容 | 设计稿依赖 |
|---|---|---|
| P1 · 地基 | 脚手架、Tauri 集成、DB migration、IPC 骨架 | 不需要 |
| P2 · 后端数据层 | 所有 Rust 命令 + 单元测试 | 不需要 |
| P3 · 前端数据契约 | TS 类型、api.ts、Query hooks | 不需要 |
| P4 · UI 壳（占位） | 用 shadcn/ui 默认组件把功能串起来，重功能不重美学 | 不需要 |
| P5 · UI 重构 | 等设计稿就位后替换 P4 占位布局 | **需要设计稿** |

**本计划覆盖 P1-P4**。P5 在设计稿就位后由另一份计划处理。

---

## 文件结构蓝图

```
pm/
├── package.json                    # 前端依赖
├── pnpm-lock.yaml
├── vite.config.ts                  # Vite 配置
├── tsconfig.json                   # TS 配置
├── tailwind.config.ts              # Tailwind 配置
├── postcss.config.js
├── index.html                      # Vite 入口
├── src/                            # 前端源码
│   ├── main.tsx                    # React 入口
│   ├── App.tsx                     # 路由 + 全局 Provider
│   ├── index.css                   # Tailwind 基础样式
│   ├── lib/
│   │   ├── api.ts                  # Tauri invoke 封装（前后端唯一契约）
│   │   ├── types.ts                # 全局 TS 类型（与 Rust models 对齐）
│   │   ├── date.ts                 # 日期工具（区间、today 等）
│   │   └── queryClient.ts          # TanStack Query 配置
│   ├── features/
│   │   ├── projects/
│   │   │   ├── queries.ts          # useProjects, useProject, useCreateProject, ...
│   │   │   ├── ProjectList.tsx     # 活跃项目列表（占位版）
│   │   │   ├── ProjectDetail.tsx   # 项目详情（含 List/看板/甘特图 tab）
│   │   │   ├── ProjectForm.tsx     # 新建/编辑项目
│   │   │   └── ArchivedProjects.tsx
│   │   ├── tasks/
│   │   │   ├── queries.ts          # 任务相关 hooks
│   │   │   ├── TaskList.tsx        # 任务列表视图
│   │   │   ├── TaskKanban.tsx      # 任务看板视图
│   │   │   ├── TaskGantt.tsx       # 任务甘特图视图
│   │   │   ├── TaskForm.tsx        # 新建/编辑任务
│   │   │   └── TaskItem.tsx        # 单条任务通用渲染
│   │   ├── today/
│   │   │   └── TodayView.tsx       # 今日待办（跨项目）
│   │   ├── history/
│   │   │   └── HistoryView.tsx     # 历史回顾（时间区间）
│   │   ├── search/
│   │   │   └── GlobalSearch.tsx    # Cmd+K 全局搜索
│   │   ├── trash/
│   │   │   └── TrashView.tsx       # 回收站
│   │   ├── export/
│   │   │   └── ExportDialog.tsx    # 导出对话框
│   │   └── settings/
│   │       └── SettingsView.tsx    # 设置（备份路径等）
│   └── components/
│       ├── ui/                     # shadcn/ui 组件
│       └── layout/
│           └── AppShell.tsx        # 最简外壳（占位版）
├── src-tauri/                      # 后端源码
│   ├── Cargo.toml
│   ├── build.rs
│   ├── tauri.conf.json
│   └── src/
│       ├── main.rs                 # Tauri 启动入口
│       ├── error.rs                # 统一错误类型
│       ├── models.rs               # Rust 数据模型（与前端 types.ts 对齐）
│       ├── db/
│       │   ├── mod.rs              # 连接管理、迁移入口
│       │   ├── migrations.rs       # Schema 迁移
│       │   ├── projects.rs         # 项目 CRUD
│       │   ├── tasks.rs            # 任务 CRUD
│       │   ├── tags.rs             # 标签管理
│       │   ├── search.rs           # 全局搜索
│       │   └── trash.rs            # 软删除与回收站
│       └── commands/
│           ├── mod.rs
│           ├── projects.rs         # 项目相关 IPC 命令
│           ├── tasks.rs            # 任务相关 IPC 命令
│           ├── search.rs           # 搜索命令
│           ├── trash.rs            # 回收站命令
│           ├── backup.rs           # 备份命令 + 调度器
│           ├── export.rs           # 导出命令
│           └── notifications.rs    # 截止日通知
└── docs/
    ├── spec.md
    └── plans/
        └── v1/
            ├── README.md            # 本文档
            └── 01-*.md … 38-*.md    # 38 个任务文件
```

---

## 任务索引

按文件名顺序对应执行顺序。每次执行只读对应任务文件即可。

### P1 · 地基

- **[需重写]** [Task 1: 初始化 Tauri + React + TypeScript 工程](01-init-tauri.md) — Vite/React/TS 脚手架已存在，不能跑 `pnpm create tauri-app`；改为手动 `pnpm add -D @tauri-apps/cli` + `pnpm add @tauri-apps/api`，然后 `pnpm tauri init` 在已有项目里加 `src-tauri/`
- [Task 2: 安装核心依赖](02-deps.md)
- [Task 3: 配置 Tailwind CSS](03-tailwind.md)
- [Task 4: 集成 shadcn/ui 基础组件](04-shadcn.md)
- [Task 5: 配置 Vitest 测试环境](05-vitest.md)
- [Task 6: 定义 Rust 数据模型](06-rust-models.md)
- [Task 7: 定义 Rust 错误类型](07-rust-errors.md)
- [Task 8: 数据库连接与迁移（schema V1）](08-db-migrations.md)
- [Task 9: 打通首个 IPC 命令（ping）](09-ipc-ping.md)

### P2 · 后端数据层

- [Task 10: 项目 CRUD（DB 层）](10-projects-db.md)
- [Task 11: 项目 CRUD（IPC 命令）](11-projects-ipc.md)
- [Task 12: 项目关联（DB + IPC）](12-project-relations.md)
- [Task 13: 任务分组（DB + IPC）](13-task-groups.md)
- [Task 14: 任务 CRUD（DB 层）](14-tasks-db.md)
- [Task 15: 任务 IPC 命令](15-tasks-ipc.md)
- [Task 16: 标签管理（DB + IPC）](16-tags.md)
- [Task 17: 任务附件（DB + IPC）](17-attachments.md)
- [Task 18: 全局搜索（DB + IPC）](18-search.md)
- [Task 19: 回收站（DB + IPC）](19-trash.md)
- [Task 20: 自动备份](20-backup.md)
- [Task 21: 数据导出（JSON + Markdown）](21-export.md)
- [Task 22: 截止日通知调度](22-notifications.md)

### P3 · 前端数据契约

> **前置：** `pnpm add @tanstack/react-query date-fns`

- **[合并]** [Task 23: TypeScript 类型定义](23-ts-types.md) — `src/lib/types.ts` 已存在并对齐 spec §6.1；按任务文件检查缺字段并补齐，不要整体覆盖
- [Task 24: `lib/api.ts` — 前后端唯一契约](24-api-contract.md)
- [Task 25: TanStack Query 配置 + 日期工具](25-query-setup.md)
- [Task 26: 项目 Query hooks](26-project-hooks.md)
- [Task 27: 任务 Query hooks](27-task-hooks.md)
- [Task 28: 其他 Query hooks（搜索、回收站、标签、附件、项目关联、分组）](28-other-hooks.md)

### P4 · UI 壳（占位） — **整段跳过**

> 已被 Things 风格真 UI 替代。前端组件位于：
> - `src/components/layout/{AppShell,Sidebar,Toolbar}.tsx`
> - `src/features/today/TodayView.tsx`
> - `src/features/tasks/CrossView.tsx`
> - `src/features/history/HistoryView.tsx`
> - `src/features/projects/{ProjectDetail,ProjectListPanel,ProjectBoardPanel,ProjectTimelinePanel}.tsx`
> - `src/features/search/GlobalSearch.tsx`
>
> Spec 提到但目前**未实现**的视图（需要后续单独补做，不在原 P4 任务里）：
> - 归档项目入口
> - 回收站视图（任务 35）
> - 设置视图 + 导出对话框（任务 36）
> - 新建任务的 ⌘N 触发流（spec §11）

<details>
<summary>原 P4 任务索引（保留供参考）</summary>

- ~~[Task 29: 占位外壳 + 路由](29-app-shell.md)~~
- ~~[Task 30: ProjectList + ProjectForm](30-project-list-form.md)~~
- ~~[Task 31: ProjectDetail + 视图切换占位](31-project-detail.md)~~
- ~~[Task 32: TodayView](32-today.md)~~
- ~~[Task 33: HistoryView](33-history.md)~~
- ~~[Task 34: GlobalSearch（Cmd+K）](34-search-ui.md)~~
- ~~[Task 35: TrashView](35-trash-ui.md)~~
- ~~[Task 36: SettingsView + ExportDialog](36-settings.md)~~
- ~~[Task 37: 跨项目 List + Kanban](37-cross-project-views.md)~~
- ~~[Task 38: 端到端人工验证（Smoke Test）](38-smoke-test.md)~~

</details>

### Wiring · 把真 UI 接到真后端（新增）

- **Task 39: 数据层切换**
  1. 全局搜 `from '@/lib/mockData'`，逐文件改为对应的 Query hook（`useTodayTasks`、`useProject`、`useTasksForProject` 等）
  2. `src/lib/date.ts`：`TODAY` 从写死改成 `new Date().toISOString().slice(0, 10)`，HistoryView 里硬编码的 `'2026-04-20'` / `'2026-04-26'` 改成基于 `range` 状态计算
  3. 把 `src/lib/mockData.ts` 删除
  4. `pnpm tauri dev` 跑通，手动验证：建项目、建任务、状态流转、归档、⌘K 搜索、备份生成
  5. 视情况把原 Task 38 smoke test 里的检查项跑一遍

---

## P5 · UI 重构（等待设计稿）

> **此阶段不在本计划内**。当 UI 设计稿就绪后：
> 1. 创建新的 spec/plan 文件：`docs/specs/YYYY-MM-DD-ui-redesign.md` + `docs/plans/YYYY-MM-DD-ui-redesign.md`
> 2. 基于设计稿重写 `components/layout/` 下的布局、替换 `features/*/` 下的 UI 组件
> 3. 保持 `lib/api.ts` 和 Query hooks 不变——数据层已稳定

---

## 交付物清单（本计划完成后）

- 可在 Mac 上运行的 Tauri 应用，.dmg 可通过 `pnpm tauri build` 产出
- 所有 V1 功能可用（项目/任务 CRUD、三视图、今日、历史回顾、搜索、回收站、备份、导出、截止提醒）
- Rust 单元测试覆盖 DB 层 + 前端 date 工具测试
- 占位 UI，等待设计稿替换

---

## 附录：执行顺序依赖图

```
P1 (1[需重写]→2→3→4→5) — 独立地基（Tailwind/shadcn 任务 3-4 因 UI 已是 inline tokens 风格，是否需要按需评估）
     ↓
P1 (6→7→8) — Rust 模型+错误+DB
     ↓
P1 (9) — IPC 打通
     ↓
P2 (10→11, 12, 13, 14→15, 16, 17, 18, 19, 20, 21, 22) — 后端数据层（10 之后可部分并行）
     ↓
P3 (23[合并]→24→25, 26, 27, 28) — 前端数据契约（23→24→25 串行，之后并行）
     ↓
~~P4~~ — 已跳过
     ↓
Task 39 — Wiring：替换 mockData 引用、删除 mockData.ts、跑通 Tauri dev
```

**关于 P1 任务 3、4（Tailwind + shadcn）：** 当前前端用 inline style + design tokens，没装 Tailwind 也没 shadcn。是否要在 P1 引入需要单独决定——如果将来要做归档/回收站/设置视图、且想用 shadcn 现成组件加快速度，就装；否则可以跳过这两个任务，沿用现有 token 风格。
