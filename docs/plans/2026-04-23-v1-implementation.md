# pm · V1 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现 `docs/spec.md` 定义的 V1 个人项目管理工具（Tauri + React + SQLite 桌面应用）

**Architecture:**
后端用 Rust（Tauri IPC + rusqlite + 原生 SQL）做所有数据操作和系统集成；前端用 React + TypeScript + shadcn/ui 实现视图层，TanStack Query 负责缓存 IPC 结果。所有功能通过 `lib/api.ts` 作为前后端唯一契约点。

**Tech Stack:** Tauri 2.x · Rust · rusqlite · React 18 · TypeScript · Vite · shadcn/ui · Tailwind · TanStack Query · React Router · date-fns · Vitest · cargo test

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
        └── 2026-04-23-v1-implementation.md
```

---

# P1 · 地基

## Task 1: 初始化 Tauri + React + TypeScript 工程

**Files:**
- Create: `package.json`、`pnpm-workspace` 无、`vite.config.ts`、`tsconfig.json`、`index.html`、`src/main.tsx`、`src/App.tsx`、`src/index.css`、`src-tauri/Cargo.toml`、`src-tauri/tauri.conf.json`、`src-tauri/build.rs`、`src-tauri/src/main.rs`、`.gitignore`（已有 → 验证）

- [ ] **Step 1: 用官方 `create-tauri-app` 脚手架初始化**

  在 `~/Desktop/pm` 下（已有 git 仓库、已有 `docs/`、`README.md`、`.gitignore`）运行：

  ```bash
  cd ~/Desktop/pm
  pnpm create tauri-app@latest . --template react-ts --manager pnpm
  ```

  遇到"目录不为空"提示时选择"合并进现有目录"。若脚手架要求覆盖 `.gitignore`，**选否**（我们已有定制的 `.gitignore`）。

- [ ] **Step 2: 验证脚手架可启动**

  ```bash
  pnpm install
  pnpm tauri dev
  ```

  Expected: 弹出 Tauri 默认窗口，展示 React + Tauri 欢迎页。确认后 Ctrl+C 退出。

- [ ] **Step 3: 补齐被脚手架可能丢弃的 `.gitignore` 条目**

  打开 `.gitignore`，确保以下条目都在（脚手架可能覆盖掉）：

  ```
  *.db
  *.db-journal
  *.db-wal
  *.db-shm
  pm-backups/
  ```

  缺的补上。

- [ ] **Step 4: Commit**

  ```bash
  git add -A
  git commit -m "chore: 初始化 Tauri + React + TypeScript 脚手架"
  ```

---

## Task 2: 安装核心依赖

**Files:**
- Modify: `package.json`
- Modify: `src-tauri/Cargo.toml`
- Modify: `src-tauri/tauri.conf.json`

- [ ] **Step 1: 安装前端依赖**

  ```bash
  cd ~/Desktop/pm
  pnpm add react-router-dom @tanstack/react-query date-fns lucide-react clsx tailwind-merge
  pnpm add -D tailwindcss@^3 postcss autoprefixer @types/node vitest @testing-library/react @testing-library/jest-dom jsdom
  ```

- [ ] **Step 2: 安装 Tauri 插件（前端部分）**

  ```bash
  pnpm add @tauri-apps/plugin-sql @tauri-apps/plugin-notification @tauri-apps/plugin-dialog @tauri-apps/plugin-fs
  ```

- [ ] **Step 3: 安装 Rust 依赖**

  编辑 `src-tauri/Cargo.toml`，`[dependencies]` 下加入：

  ```toml
  rusqlite = { version = "0.31", features = ["bundled", "chrono"] }
  serde = { version = "1", features = ["derive"] }
  serde_json = "1"
  chrono = { version = "0.4", features = ["serde"] }
  thiserror = "1"
  tauri-plugin-notification = "2"
  tauri-plugin-dialog = "2"
  tauri-plugin-fs = "2"
  directories = "5"
  ```

  `[dev-dependencies]` 下加入：

  ```toml
  tempfile = "3"
  ```

- [ ] **Step 4: 在 `src-tauri/tauri.conf.json` 中注册插件**

  在 `plugins` 段添加（若不存在则新建）：

  ```json
  "plugins": {
    "fs": { "scope": ["$HOME/**"] },
    "dialog": {},
    "notification": {}
  }
  ```

- [ ] **Step 5: 验证编译**

  ```bash
  pnpm tauri dev
  ```

  Expected: 应用仍可启动。Ctrl+C 退出。

- [ ] **Step 6: Commit**

  ```bash
  git add -A
  git commit -m "chore: 安装核心依赖（tauri 插件、tanstack query、tailwind 等）"
  ```

---

## Task 3: 配置 Tailwind CSS

**Files:**
- Create: `tailwind.config.ts`、`postcss.config.js`
- Modify: `src/index.css`

- [ ] **Step 1: 初始化 Tailwind**

  ```bash
  cd ~/Desktop/pm
  npx tailwindcss init -p --ts
  ```

- [ ] **Step 2: 配置 `tailwind.config.ts`**

  ```typescript
  import type { Config } from 'tailwindcss'

  export default {
    content: ['./index.html', './src/**/*.{ts,tsx}'],
    theme: { extend: {} },
    plugins: [],
  } satisfies Config
  ```

- [ ] **Step 3: 覆写 `src/index.css`**

  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;

  :root {
    font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
  }

  html, body, #root {
    height: 100%;
  }
  ```

- [ ] **Step 4: 验证 Tailwind 生效**

  在 `src/App.tsx` 中把默认 class 改一个 Tailwind 类（如 `class="text-red-500"`），运行 `pnpm tauri dev` 确认样式生效，然后还原。

- [ ] **Step 5: Commit**

  ```bash
  git add -A
  git commit -m "chore: 配置 Tailwind CSS"
  ```

---

## Task 4: 集成 shadcn/ui 基础组件

**Files:**
- Create: `components.json`
- Create: `src/components/ui/` 下若干组件文件
- Modify: `tailwind.config.ts`、`src/index.css`、`src/lib/utils.ts`（或 `cn.ts`）

- [ ] **Step 1: 初始化 shadcn/ui**

  ```bash
  cd ~/Desktop/pm
  pnpm dlx shadcn@latest init
  ```

  交互选择：
  - Style: default
  - Base color: slate
  - CSS variables: yes
  - 其他默认

- [ ] **Step 2: 安装常用组件**

  ```bash
  pnpm dlx shadcn@latest add button input label textarea dialog select checkbox badge card dropdown-menu separator scroll-area tabs toast sonner
  ```

- [ ] **Step 3: 验证 Button 渲染**

  在 `src/App.tsx` 中临时引入并渲染 `<Button>`，确认无编译错误、界面正常显示。

- [ ] **Step 4: Commit**

  ```bash
  git add -A
  git commit -m "chore: 集成 shadcn/ui 组件库"
  ```

---

## Task 5: 配置 Vitest 测试环境

**Files:**
- Create: `vitest.config.ts`、`src/test/setup.ts`
- Modify: `package.json`（添加 test 脚本）
- Create: `src/lib/date.ts` 和 `src/lib/date.test.ts`（作为首个 smoke test）

- [ ] **Step 1: 创建 `vitest.config.ts`**

  ```typescript
  import { defineConfig } from 'vitest/config'
  import react from '@vitejs/plugin-react'
  import path from 'node:path'

  export default defineConfig({
    plugins: [react()],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globals: true,
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
  })
  ```

- [ ] **Step 2: 创建 `src/test/setup.ts`**

  ```typescript
  import '@testing-library/jest-dom/vitest'
  ```

- [ ] **Step 3: 在 `package.json` 的 scripts 中加入**

  ```json
  "test": "vitest",
  "test:run": "vitest run"
  ```

- [ ] **Step 4: 写一个最简 smoke test**

  创建 `src/lib/date.ts`：

  ```typescript
  export function isoDate(d: Date): string {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  ```

  创建 `src/lib/date.test.ts`：

  ```typescript
  import { describe, it, expect } from 'vitest'
  import { isoDate } from './date'

  describe('isoDate', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(isoDate(new Date(2026, 3, 23))).toBe('2026-04-23')
    })
  })
  ```

- [ ] **Step 5: 运行测试**

  ```bash
  pnpm test:run
  ```

  Expected: 1 test passed。

- [ ] **Step 6: Commit**

  ```bash
  git add -A
  git commit -m "chore: 配置 Vitest 测试环境 + smoke test"
  ```

---

## Task 6: 定义 Rust 数据模型

**Files:**
- Create: `src-tauri/src/models.rs`
- Modify: `src-tauri/src/main.rs`（添加 `mod models;`）

- [ ] **Step 1: 创建 `src-tauri/src/models.rs`**

  ```rust
  use serde::{Deserialize, Serialize};

  #[derive(Debug, Clone, Serialize, Deserialize)]
  #[serde(rename_all = "camelCase")]
  pub struct Project {
      pub id: i64,
      pub name: String,
      pub status: String,          // "active" | "archived"
      pub r#type: Option<String>,
      pub start_date: Option<String>,
      pub end_date: Option<String>,
      pub archived_at: Option<String>,
      pub deleted_at: Option<String>,
      pub created_at: String,
      pub updated_at: String,
  }

  #[derive(Debug, Clone, Serialize, Deserialize)]
  #[serde(rename_all = "camelCase")]
  pub struct Task {
      pub id: i64,
      pub project_id: i64,
      pub group_id: Option<i64>,
      pub parent_task_id: Option<i64>,
      pub name: String,
      pub status: String,          // "not_started" | "in_progress" | "done"
      pub priority: Option<String>,
      pub start_date: Option<String>,
      pub due_date: Option<String>,
      pub estimate_hours: Option<f64>,
      pub description: Option<String>,
      pub completed_at: Option<String>,
      pub deleted_at: Option<String>,
      pub created_at: String,
      pub updated_at: String,
  }

  #[derive(Debug, Clone, Serialize, Deserialize)]
  #[serde(rename_all = "camelCase")]
  pub struct TaskGroup {
      pub id: i64,
      pub project_id: i64,
      pub name: String,
      pub sort_order: i64,
      pub created_at: String,
  }

  #[derive(Debug, Clone, Serialize, Deserialize)]
  #[serde(rename_all = "camelCase")]
  pub struct Tag {
      pub id: i64,
      pub name: String,
      pub created_at: String,
  }

  #[derive(Debug, Clone, Serialize, Deserialize)]
  #[serde(rename_all = "camelCase")]
  pub struct TaskAttachment {
      pub id: i64,
      pub task_id: i64,
      pub r#type: String,          // "link" | "file"
      pub url_or_path: String,
      pub label: Option<String>,
      pub created_at: String,
  }

  #[derive(Debug, Clone, Serialize, Deserialize)]
  #[serde(rename_all = "camelCase")]
  pub struct ProjectRelation {
      pub id: i64,
      pub from_project_id: i64,
      pub to_project_id: i64,
      pub relation_type: String,   // "successor" | "related"
      pub note: Option<String>,
      pub created_at: String,
  }
  ```

- [ ] **Step 2: 在 `src-tauri/src/main.rs` 顶部加入**

  ```rust
  mod models;
  ```

- [ ] **Step 3: 验证编译**

  ```bash
  cd ~/Desktop/pm/src-tauri && cargo build
  ```

  Expected: 无错误（可能有 dead_code 警告，忽略）。

- [ ] **Step 4: Commit**

  ```bash
  cd ~/Desktop/pm && git add -A && git commit -m "feat(backend): 定义 Rust 数据模型"
  ```

---

## Task 7: 定义 Rust 错误类型

**Files:**
- Create: `src-tauri/src/error.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 创建 `src-tauri/src/error.rs`**

  ```rust
  use serde::Serialize;
  use thiserror::Error;

  #[derive(Error, Debug)]
  pub enum AppError {
      #[error("database error: {0}")]
      Db(#[from] rusqlite::Error),

      #[error("io error: {0}")]
      Io(#[from] std::io::Error),

      #[error("not found: {0}")]
      NotFound(String),

      #[error("invalid input: {0}")]
      Invalid(String),

      #[error("json error: {0}")]
      Json(#[from] serde_json::Error),
  }

  impl Serialize for AppError {
      fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
          s.serialize_str(&self.to_string())
      }
  }

  pub type AppResult<T> = std::result::Result<T, AppError>;
  ```

- [ ] **Step 2: 在 `src-tauri/src/main.rs` 添加**

  ```rust
  mod error;
  ```

- [ ] **Step 3: 编译验证**

  ```bash
  cd ~/Desktop/pm/src-tauri && cargo build
  ```

- [ ] **Step 4: Commit**

  ```bash
  cd ~/Desktop/pm && git add -A && git commit -m "feat(backend): 定义统一错误类型"
  ```

---

## Task 8: 数据库连接与迁移（schema V1）

**Files:**
- Create: `src-tauri/src/db/mod.rs`、`src-tauri/src/db/migrations.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 创建 `src-tauri/src/db/migrations.rs`**（粘贴 spec §6.1 的完整 schema）

  ```rust
  use rusqlite::Connection;
  use crate::error::AppResult;

  pub const SCHEMA_V1: &str = r#"
  CREATE TABLE IF NOT EXISTS projects (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
    type         TEXT,
    start_date   TEXT,
    end_date     TEXT,
    archived_at  TEXT,
    deleted_at   TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_relations (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    from_project_id   INTEGER NOT NULL REFERENCES projects(id),
    to_project_id     INTEGER NOT NULL REFERENCES projects(id),
    relation_type     TEXT NOT NULL CHECK(relation_type IN ('successor','related')),
    note              TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_groups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id),
    name        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL REFERENCES projects(id),
    group_id        INTEGER REFERENCES task_groups(id),
    parent_task_id  INTEGER REFERENCES tasks(id),
    name            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'not_started'
                      CHECK(status IN ('not_started','in_progress','done')),
    priority        TEXT CHECK(priority IN ('high','medium','low')),
    start_date      TEXT,
    due_date        TEXT,
    estimate_hours  REAL,
    description     TEXT,
    completed_at    TEXT,
    deleted_at      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_tags (
    task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS task_attachments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    type         TEXT NOT NULL CHECK(type IN ('link','file')),
    url_or_path  TEXT NOT NULL,
    label        TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_project       ON tasks(project_id)     WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks(status)         WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON tasks(due_date)       WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_tasks_completed_at  ON tasks(completed_at)   WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects(status)      WHERE deleted_at IS NULL;
  "#;

  pub fn run_migrations(conn: &Connection) -> AppResult<()> {
      conn.execute("PRAGMA foreign_keys = ON", [])?;
      conn.execute_batch(SCHEMA_V1)?;
      Ok(())
  }
  ```

- [ ] **Step 2: 创建 `src-tauri/src/db/mod.rs`**

  ```rust
  pub mod migrations;

  use rusqlite::Connection;
  use std::path::PathBuf;
  use std::sync::Mutex;
  use crate::error::AppResult;

  pub struct DbState(pub Mutex<Connection>);

  pub fn resolve_db_path() -> PathBuf {
      let base = directories::ProjectDirs::from("com", "pm", "pm")
          .expect("cannot resolve project dirs");
      let dir = base.data_dir().to_path_buf();
      std::fs::create_dir_all(&dir).ok();
      dir.join("pm.db")
  }

  pub fn init_connection(path: &std::path::Path) -> AppResult<Connection> {
      let conn = Connection::open(path)?;
      migrations::run_migrations(&conn)?;
      Ok(conn)
  }

  #[cfg(test)]
  pub fn in_memory_for_test() -> Connection {
      let conn = Connection::open_in_memory().unwrap();
      migrations::run_migrations(&conn).unwrap();
      conn
  }
  ```

- [ ] **Step 3: 在 `src-tauri/src/main.rs` 添加**

  ```rust
  mod db;
  ```

  并在 `tauri::Builder` 中 manage DB state（暂时只初始化，不暴露命令）：

  ```rust
  fn main() {
      let db_path = db::resolve_db_path();
      let conn = db::init_connection(&db_path).expect("db init failed");

      tauri::Builder::default()
          .manage(db::DbState(std::sync::Mutex::new(conn)))
          .plugin(tauri_plugin_notification::init())
          .plugin(tauri_plugin_dialog::init())
          .plugin(tauri_plugin_fs::init())
          .run(tauri::generate_context!())
          .expect("error while running tauri application");
  }
  ```

- [ ] **Step 4: 写一个迁移单元测试**

  在 `src-tauri/src/db/migrations.rs` 末尾追加：

  ```rust
  #[cfg(test)]
  mod tests {
      use super::*;
      use rusqlite::Connection;

      #[test]
      fn migrations_create_all_tables() {
          let conn = Connection::open_in_memory().unwrap();
          run_migrations(&conn).unwrap();

          let tables: Vec<String> = conn
              .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
              .unwrap()
              .query_map([], |row| row.get(0))
              .unwrap()
              .collect::<Result<_, _>>()
              .unwrap();

          assert!(tables.contains(&"projects".to_string()));
          assert!(tables.contains(&"tasks".to_string()));
          assert!(tables.contains(&"task_groups".to_string()));
          assert!(tables.contains(&"project_relations".to_string()));
          assert!(tables.contains(&"tags".to_string()));
          assert!(tables.contains(&"task_tags".to_string()));
          assert!(tables.contains(&"task_attachments".to_string()));
      }
  }
  ```

- [ ] **Step 5: 运行测试**

  ```bash
  cd ~/Desktop/pm/src-tauri && cargo test
  ```

  Expected: 1 passed。

- [ ] **Step 6: Commit**

  ```bash
  cd ~/Desktop/pm && git add -A && git commit -m "feat(backend): SQLite 连接 + schema V1 迁移"
  ```

---

## Task 9: 打通首个 IPC 命令（ping）

**Files:**
- Create: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/main.rs`
- Modify: `src/App.tsx`

**目的**：在开始写业务前，先验证"React → invoke → Rust → 返回 → React 渲染"的全链路工作正常。

- [ ] **Step 1: 创建 `src-tauri/src/commands/mod.rs`**

  ```rust
  use tauri::State;
  use crate::db::DbState;
  use crate::error::AppResult;

  #[tauri::command]
  pub fn ping(db: State<'_, DbState>) -> AppResult<String> {
      let conn = db.0.lock().unwrap();
      let count: i64 = conn.query_row(
          "SELECT count(*) FROM projects",
          [],
          |row| row.get(0),
      )?;
      Ok(format!("pong: {} projects in db", count))
  }
  ```

- [ ] **Step 2: 在 `src-tauri/src/main.rs` 注册命令**

  ```rust
  mod commands;
  // ... 在 Builder 里：
  .invoke_handler(tauri::generate_handler![commands::ping])
  ```

- [ ] **Step 3: 在 `src/App.tsx` 临时调用**

  ```tsx
  import { useEffect, useState } from 'react'
  import { invoke } from '@tauri-apps/api/core'

  function App() {
    const [msg, setMsg] = useState('loading...')
    useEffect(() => {
      invoke<string>('ping').then(setMsg).catch((e) => setMsg(String(e)))
    }, [])
    return <div className="p-4">{msg}</div>
  }

  export default App
  ```

- [ ] **Step 4: 启动验证**

  ```bash
  pnpm tauri dev
  ```

  Expected: 窗口显示 "pong: 0 projects in db"。

- [ ] **Step 5: Commit**

  ```bash
  git add -A && git commit -m "feat: 打通首个 IPC 命令 ping"
  ```

---

# P2 · 后端数据层

## Task 10: 项目 CRUD（DB 层）

**Files:**
- Create: `src-tauri/src/db/projects.rs`
- Modify: `src-tauri/src/db/mod.rs`

- [ ] **Step 1: 写失败测试**

  创建 `src-tauri/src/db/projects.rs`：

  ```rust
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::Project;

  pub fn create(conn: &Connection, name: &str, r#type: Option<&str>, start_date: Option<&str>, end_date: Option<&str>) -> AppResult<Project> {
      todo!()
  }

  pub fn list_active(conn: &Connection) -> AppResult<Vec<Project>> {
      todo!()
  }

  pub fn get(conn: &Connection, id: i64) -> AppResult<Project> {
      todo!()
  }

  pub fn update(conn: &Connection, id: i64, name: &str, r#type: Option<&str>, start_date: Option<&str>, end_date: Option<&str>) -> AppResult<Project> {
      todo!()
  }

  pub fn archive(conn: &Connection, id: i64) -> AppResult<()> {
      todo!()
  }

  pub fn unarchive(conn: &Connection, id: i64) -> AppResult<()> {
      todo!()
  }

  pub fn soft_delete(conn: &Connection, id: i64) -> AppResult<()> {
      todo!()
  }

  pub fn list_archived(conn: &Connection) -> AppResult<Vec<Project>> {
      todo!()
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::in_memory_for_test;

      #[test]
      fn create_and_get() {
          let conn = in_memory_for_test();
          let p = create(&conn, "Test Project", Some("售前"), None, None).unwrap();
          assert_eq!(p.name, "Test Project");
          assert_eq!(p.status, "active");
          let got = get(&conn, p.id).unwrap();
          assert_eq!(got.id, p.id);
      }

      #[test]
      fn archive_and_unarchive() {
          let conn = in_memory_for_test();
          let p = create(&conn, "X", None, None, None).unwrap();
          archive(&conn, p.id).unwrap();
          assert!(list_active(&conn).unwrap().is_empty());
          assert_eq!(list_archived(&conn).unwrap().len(), 1);
          unarchive(&conn, p.id).unwrap();
          assert_eq!(list_active(&conn).unwrap().len(), 1);
      }

      #[test]
      fn soft_delete_hides_from_both_lists() {
          let conn = in_memory_for_test();
          let p = create(&conn, "X", None, None, None).unwrap();
          soft_delete(&conn, p.id).unwrap();
          assert!(list_active(&conn).unwrap().is_empty());
          assert!(list_archived(&conn).unwrap().is_empty());
      }
  }
  ```

- [ ] **Step 2: 在 `db/mod.rs` 加入 `pub mod projects;`**

- [ ] **Step 3: 运行测试看失败**

  ```bash
  cd ~/Desktop/pm/src-tauri && cargo test projects::
  ```

  Expected: 3 测试因 `todo!()` 全部 panic。

- [ ] **Step 4: 实现各函数**

  替换 `src-tauri/src/db/projects.rs` 中的 `todo!()` 为实际实现：

  ```rust
  fn row_to_project(row: &rusqlite::Row) -> rusqlite::Result<Project> {
      Ok(Project {
          id: row.get("id")?,
          name: row.get("name")?,
          status: row.get("status")?,
          r#type: row.get("type")?,
          start_date: row.get("start_date")?,
          end_date: row.get("end_date")?,
          archived_at: row.get("archived_at")?,
          deleted_at: row.get("deleted_at")?,
          created_at: row.get("created_at")?,
          updated_at: row.get("updated_at")?,
      })
  }

  pub fn create(conn: &Connection, name: &str, r#type: Option<&str>, start_date: Option<&str>, end_date: Option<&str>) -> AppResult<Project> {
      conn.execute(
          "INSERT INTO projects (name, type, start_date, end_date) VALUES (?1, ?2, ?3, ?4)",
          params![name, r#type, start_date, end_date],
      )?;
      let id = conn.last_insert_rowid();
      get(conn, id)
  }

  pub fn list_active(conn: &Connection) -> AppResult<Vec<Project>> {
      let mut stmt = conn.prepare(
          "SELECT * FROM projects WHERE status='active' AND deleted_at IS NULL ORDER BY created_at DESC",
      )?;
      let rows = stmt.query_map([], row_to_project)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn list_archived(conn: &Connection) -> AppResult<Vec<Project>> {
      let mut stmt = conn.prepare(
          "SELECT * FROM projects WHERE status='archived' AND deleted_at IS NULL ORDER BY archived_at DESC",
      )?;
      let rows = stmt.query_map([], row_to_project)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn get(conn: &Connection, id: i64) -> AppResult<Project> {
      conn.query_row(
          "SELECT * FROM projects WHERE id = ?1",
          params![id],
          row_to_project,
      ).map_err(Into::into)
  }

  pub fn update(conn: &Connection, id: i64, name: &str, r#type: Option<&str>, start_date: Option<&str>, end_date: Option<&str>) -> AppResult<Project> {
      conn.execute(
          "UPDATE projects SET name=?1, type=?2, start_date=?3, end_date=?4, updated_at=datetime('now') WHERE id=?5",
          params![name, r#type, start_date, end_date, id],
      )?;
      get(conn, id)
  }

  pub fn archive(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute(
          "UPDATE projects SET status='archived', archived_at=datetime('now'), updated_at=datetime('now') WHERE id=?1",
          params![id],
      )?;
      Ok(())
  }

  pub fn unarchive(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute(
          "UPDATE projects SET status='active', archived_at=NULL, updated_at=datetime('now') WHERE id=?1",
          params![id],
      )?;
      Ok(())
  }

  pub fn soft_delete(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute(
          "UPDATE projects SET deleted_at=datetime('now'), updated_at=datetime('now') WHERE id=?1",
          params![id],
      )?;
      Ok(())
  }
  ```

- [ ] **Step 5: 测试全绿**

  ```bash
  cargo test projects::
  ```

  Expected: 3 passed。

- [ ] **Step 6: Commit**

  ```bash
  cd ~/Desktop/pm && git add -A && git commit -m "feat(backend): 项目 CRUD + 归档/重启/软删 DB 层"
  ```

---

## Task 11: 项目 CRUD（IPC 命令）

**Files:**
- Create: `src-tauri/src/commands/projects.rs`
- Modify: `src-tauri/src/commands/mod.rs`
- Modify: `src-tauri/src/main.rs`（注册命令）

- [ ] **Step 1: 创建 `src-tauri/src/commands/projects.rs`**

  ```rust
  use tauri::State;
  use crate::db::{DbState, projects};
  use crate::error::AppResult;
  use crate::models::Project;

  #[tauri::command]
  pub fn create_project(db: State<'_, DbState>, name: String, r#type: Option<String>, start_date: Option<String>, end_date: Option<String>) -> AppResult<Project> {
      let conn = db.0.lock().unwrap();
      projects::create(&conn, &name, r#type.as_deref(), start_date.as_deref(), end_date.as_deref())
  }

  #[tauri::command]
  pub fn list_active_projects(db: State<'_, DbState>) -> AppResult<Vec<Project>> {
      let conn = db.0.lock().unwrap();
      projects::list_active(&conn)
  }

  #[tauri::command]
  pub fn list_archived_projects(db: State<'_, DbState>) -> AppResult<Vec<Project>> {
      let conn = db.0.lock().unwrap();
      projects::list_archived(&conn)
  }

  #[tauri::command]
  pub fn get_project(db: State<'_, DbState>, id: i64) -> AppResult<Project> {
      let conn = db.0.lock().unwrap();
      projects::get(&conn, id)
  }

  #[tauri::command]
  pub fn update_project(db: State<'_, DbState>, id: i64, name: String, r#type: Option<String>, start_date: Option<String>, end_date: Option<String>) -> AppResult<Project> {
      let conn = db.0.lock().unwrap();
      projects::update(&conn, id, &name, r#type.as_deref(), start_date.as_deref(), end_date.as_deref())
  }

  #[tauri::command]
  pub fn archive_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      projects::archive(&conn, id)
  }

  #[tauri::command]
  pub fn unarchive_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      projects::unarchive(&conn, id)
  }

  #[tauri::command]
  pub fn soft_delete_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      projects::soft_delete(&conn, id)
  }
  ```

- [ ] **Step 2: 在 `src-tauri/src/commands/mod.rs` 加入**

  ```rust
  pub mod projects;

  // 保留原 ping 命令
  use tauri::State;
  use crate::db::DbState;
  use crate::error::AppResult;

  #[tauri::command]
  pub fn ping(db: State<'_, DbState>) -> AppResult<String> {
      let conn = db.0.lock().unwrap();
      let count: i64 = conn.query_row("SELECT count(*) FROM projects", [], |r| r.get(0))?;
      Ok(format!("pong: {} projects in db", count))
  }
  ```

- [ ] **Step 3: 在 `main.rs` 注册全部命令**

  ```rust
  .invoke_handler(tauri::generate_handler![
      commands::ping,
      commands::projects::create_project,
      commands::projects::list_active_projects,
      commands::projects::list_archived_projects,
      commands::projects::get_project,
      commands::projects::update_project,
      commands::projects::archive_project,
      commands::projects::unarchive_project,
      commands::projects::soft_delete_project,
  ])
  ```

- [ ] **Step 4: 编译**

  ```bash
  cargo build
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add -A && git commit -m "feat(backend): 项目 IPC 命令"
  ```

---

## Task 12: 项目关联（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/project_relations.rs`
- Create: `src-tauri/src/commands/project_relations.rs`
- Modify: `src-tauri/src/db/mod.rs`、`src-tauri/src/commands/mod.rs`、`src-tauri/src/main.rs`

- [ ] **Step 1: 写 DB 层测试**（`src-tauri/src/db/project_relations.rs`）

  ```rust
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::ProjectRelation;

  pub fn create(conn: &Connection, from_id: i64, to_id: i64, relation_type: &str, note: Option<&str>) -> AppResult<ProjectRelation> {
      conn.execute(
          "INSERT INTO project_relations (from_project_id, to_project_id, relation_type, note) VALUES (?1,?2,?3,?4)",
          params![from_id, to_id, relation_type, note],
      )?;
      let id = conn.last_insert_rowid();
      get(conn, id)
  }

  pub fn get(conn: &Connection, id: i64) -> AppResult<ProjectRelation> {
      conn.query_row(
          "SELECT * FROM project_relations WHERE id=?1",
          params![id],
          |r| Ok(ProjectRelation {
              id: r.get("id")?,
              from_project_id: r.get("from_project_id")?,
              to_project_id: r.get("to_project_id")?,
              relation_type: r.get("relation_type")?,
              note: r.get("note")?,
              created_at: r.get("created_at")?,
          }),
      ).map_err(Into::into)
  }

  pub fn list_for_project(conn: &Connection, project_id: i64) -> AppResult<Vec<ProjectRelation>> {
      let mut stmt = conn.prepare(
          "SELECT * FROM project_relations WHERE from_project_id=?1 OR to_project_id=?1 ORDER BY created_at DESC",
      )?;
      let rows = stmt.query_map(params![project_id], |r| Ok(ProjectRelation {
          id: r.get("id")?,
          from_project_id: r.get("from_project_id")?,
          to_project_id: r.get("to_project_id")?,
          relation_type: r.get("relation_type")?,
          note: r.get("note")?,
          created_at: r.get("created_at")?,
      }))?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("DELETE FROM project_relations WHERE id=?1", params![id])?;
      Ok(())
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::{in_memory_for_test, projects};

      #[test]
      fn create_and_list() {
          let conn = in_memory_for_test();
          let p1 = projects::create(&conn, "一期", None, None, None).unwrap();
          let p2 = projects::create(&conn, "二期", None, None, None).unwrap();
          create(&conn, p2.id, p1.id, "successor", Some("二期源自一期")).unwrap();
          let rels = list_for_project(&conn, p1.id).unwrap();
          assert_eq!(rels.len(), 1);
          assert_eq!(rels[0].relation_type, "successor");
      }
  }
  ```

- [ ] **Step 2: 在 `db/mod.rs` 加入 `pub mod project_relations;`**

- [ ] **Step 3: 创建命令层 `src-tauri/src/commands/project_relations.rs`**

  ```rust
  use tauri::State;
  use crate::db::{DbState, project_relations};
  use crate::error::AppResult;
  use crate::models::ProjectRelation;

  #[tauri::command]
  pub fn create_project_relation(db: State<'_, DbState>, from_id: i64, to_id: i64, relation_type: String, note: Option<String>) -> AppResult<ProjectRelation> {
      let conn = db.0.lock().unwrap();
      project_relations::create(&conn, from_id, to_id, &relation_type, note.as_deref())
  }

  #[tauri::command]
  pub fn list_project_relations(db: State<'_, DbState>, project_id: i64) -> AppResult<Vec<ProjectRelation>> {
      let conn = db.0.lock().unwrap();
      project_relations::list_for_project(&conn, project_id)
  }

  #[tauri::command]
  pub fn delete_project_relation(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      project_relations::delete(&conn, id)
  }
  ```

- [ ] **Step 4: 在 `commands/mod.rs` 加入 `pub mod project_relations;`，在 `main.rs` 注册三个命令**

- [ ] **Step 5: 测试 + 编译**

  ```bash
  cargo test project_relations:: && cargo build
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add -A && git commit -m "feat(backend): 项目关联 CRUD + IPC"
  ```

---

## Task 13: 任务分组（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/task_groups.rs`、`src-tauri/src/commands/task_groups.rs`
- Modify: `db/mod.rs`、`commands/mod.rs`、`main.rs`

- [ ] **Step 1: DB 层实现（`src-tauri/src/db/task_groups.rs`）**

  ```rust
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::TaskGroup;

  fn row_to_group(row: &rusqlite::Row) -> rusqlite::Result<TaskGroup> {
      Ok(TaskGroup {
          id: row.get("id")?,
          project_id: row.get("project_id")?,
          name: row.get("name")?,
          sort_order: row.get("sort_order")?,
          created_at: row.get("created_at")?,
      })
  }

  pub fn create(conn: &Connection, project_id: i64, name: &str, sort_order: i64) -> AppResult<TaskGroup> {
      conn.execute(
          "INSERT INTO task_groups (project_id, name, sort_order) VALUES (?1,?2,?3)",
          params![project_id, name, sort_order],
      )?;
      let id = conn.last_insert_rowid();
      get(conn, id)
  }

  pub fn get(conn: &Connection, id: i64) -> AppResult<TaskGroup> {
      conn.query_row("SELECT * FROM task_groups WHERE id=?1", params![id], row_to_group)
          .map_err(Into::into)
  }

  pub fn list_for_project(conn: &Connection, project_id: i64) -> AppResult<Vec<TaskGroup>> {
      let mut stmt = conn.prepare(
          "SELECT * FROM task_groups WHERE project_id=?1 ORDER BY sort_order, created_at",
      )?;
      let rows = stmt.query_map(params![project_id], row_to_group)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn rename(conn: &Connection, id: i64, name: &str) -> AppResult<TaskGroup> {
      conn.execute("UPDATE task_groups SET name=?1 WHERE id=?2", params![name, id])?;
      get(conn, id)
  }

  pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
      // 不级联删任务，只把任务的 group_id 置空
      conn.execute("UPDATE tasks SET group_id=NULL WHERE group_id=?1", params![id])?;
      conn.execute("DELETE FROM task_groups WHERE id=?1", params![id])?;
      Ok(())
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::{in_memory_for_test, projects};

      #[test]
      fn create_and_list() {
          let conn = in_memory_for_test();
          let p = projects::create(&conn, "X", None, None, None).unwrap();
          create(&conn, p.id, "一期", 0).unwrap();
          create(&conn, p.id, "二期", 1).unwrap();
          let groups = list_for_project(&conn, p.id).unwrap();
          assert_eq!(groups.len(), 2);
          assert_eq!(groups[0].name, "一期");
      }
  }
  ```

- [ ] **Step 2: 命令层（`src-tauri/src/commands/task_groups.rs`）**

  ```rust
  use tauri::State;
  use crate::db::{DbState, task_groups};
  use crate::error::AppResult;
  use crate::models::TaskGroup;

  #[tauri::command]
  pub fn create_task_group(db: State<'_, DbState>, project_id: i64, name: String, sort_order: i64) -> AppResult<TaskGroup> {
      let conn = db.0.lock().unwrap();
      task_groups::create(&conn, project_id, &name, sort_order)
  }

  #[tauri::command]
  pub fn list_task_groups(db: State<'_, DbState>, project_id: i64) -> AppResult<Vec<TaskGroup>> {
      let conn = db.0.lock().unwrap();
      task_groups::list_for_project(&conn, project_id)
  }

  #[tauri::command]
  pub fn rename_task_group(db: State<'_, DbState>, id: i64, name: String) -> AppResult<TaskGroup> {
      let conn = db.0.lock().unwrap();
      task_groups::rename(&conn, id, &name)
  }

  #[tauri::command]
  pub fn delete_task_group(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      task_groups::delete(&conn, id)
  }
  ```

- [ ] **Step 3: 在 `db/mod.rs` 加 `pub mod task_groups;`，`commands/mod.rs` 加 `pub mod task_groups;`，`main.rs` 注册 4 个命令**

- [ ] **Step 4: 测试 + 编译**

  ```bash
  cargo test task_groups:: && cargo build
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add -A && git commit -m "feat(backend): 任务分组 CRUD + IPC"
  ```

---

## Task 14: 任务 CRUD（DB 层）

**Files:**
- Create: `src-tauri/src/db/tasks.rs`
- Modify: `src-tauri/src/db/mod.rs`

- [ ] **Step 1: 写 `src-tauri/src/db/tasks.rs` 的完整实现（含测试）**

  ```rust
  use rusqlite::{params, Connection};
  use crate::error::{AppError, AppResult};
  use crate::models::Task;

  #[derive(Default)]
  pub struct TaskInput {
      pub project_id: i64,
      pub name: String,
      pub group_id: Option<i64>,
      pub parent_task_id: Option<i64>,
      pub priority: Option<String>,
      pub start_date: Option<String>,
      pub due_date: Option<String>,
      pub estimate_hours: Option<f64>,
      pub description: Option<String>,
  }

  fn row_to_task(row: &rusqlite::Row) -> rusqlite::Result<Task> {
      Ok(Task {
          id: row.get("id")?,
          project_id: row.get("project_id")?,
          group_id: row.get("group_id")?,
          parent_task_id: row.get("parent_task_id")?,
          name: row.get("name")?,
          status: row.get("status")?,
          priority: row.get("priority")?,
          start_date: row.get("start_date")?,
          due_date: row.get("due_date")?,
          estimate_hours: row.get("estimate_hours")?,
          description: row.get("description")?,
          completed_at: row.get("completed_at")?,
          deleted_at: row.get("deleted_at")?,
          created_at: row.get("created_at")?,
          updated_at: row.get("updated_at")?,
      })
  }

  pub fn create(conn: &Connection, input: TaskInput) -> AppResult<Task> {
      // 校验：若指定 parent_task_id，该父任务的 parent_task_id 必须为 NULL（只允许一层嵌套）
      if let Some(pid) = input.parent_task_id {
          let parent_of_parent: Option<i64> = conn.query_row(
              "SELECT parent_task_id FROM tasks WHERE id=?1",
              params![pid],
              |r| r.get(0),
          ).optional().map_err(|e: rusqlite::Error| AppError::from(e))?.flatten();
          if parent_of_parent.is_some() {
              return Err(AppError::Invalid("只允许一层子任务".into()));
          }
      }

      conn.execute(
          "INSERT INTO tasks (project_id, group_id, parent_task_id, name, priority, start_date, due_date, estimate_hours, description)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
          params![
              input.project_id, input.group_id, input.parent_task_id, input.name,
              input.priority, input.start_date, input.due_date, input.estimate_hours, input.description,
          ],
      )?;
      let id = conn.last_insert_rowid();
      get(conn, id)
  }

  pub fn get(conn: &Connection, id: i64) -> AppResult<Task> {
      conn.query_row("SELECT * FROM tasks WHERE id=?1", params![id], row_to_task)
          .map_err(Into::into)
  }

  pub fn list_for_project(conn: &Connection, project_id: i64) -> AppResult<Vec<Task>> {
      let mut stmt = conn.prepare(
          "SELECT * FROM tasks WHERE project_id=?1 AND deleted_at IS NULL ORDER BY created_at DESC",
      )?;
      let rows = stmt.query_map(params![project_id], row_to_task)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn list_all_active(conn: &Connection) -> AppResult<Vec<Task>> {
      let mut stmt = conn.prepare(
          "SELECT t.* FROM tasks t
           JOIN projects p ON t.project_id = p.id
           WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
           ORDER BY t.created_at DESC",
      )?;
      let rows = stmt.query_map([], row_to_task)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn update(conn: &Connection, id: i64, input: TaskInput) -> AppResult<Task> {
      conn.execute(
          "UPDATE tasks SET
             project_id=?1, group_id=?2, parent_task_id=?3, name=?4,
             priority=?5, start_date=?6, due_date=?7, estimate_hours=?8, description=?9,
             updated_at=datetime('now')
           WHERE id=?10",
          params![
              input.project_id, input.group_id, input.parent_task_id, input.name,
              input.priority, input.start_date, input.due_date, input.estimate_hours, input.description,
              id,
          ],
      )?;
      get(conn, id)
  }

  pub fn set_status(conn: &Connection, id: i64, status: &str) -> AppResult<Task> {
      match status {
          "not_started" | "in_progress" => {
              conn.execute(
                  "UPDATE tasks SET status=?1, completed_at=NULL, updated_at=datetime('now') WHERE id=?2",
                  params![status, id],
              )?;
          }
          "done" => {
              conn.execute(
                  "UPDATE tasks SET status='done', completed_at=datetime('now'), updated_at=datetime('now') WHERE id=?1",
                  params![id],
              )?;
          }
          _ => return Err(AppError::Invalid(format!("invalid status: {}", status))),
      }
      get(conn, id)
  }

  pub fn soft_delete(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute(
          "UPDATE tasks SET deleted_at=datetime('now'), updated_at=datetime('now') WHERE id=?1",
          params![id],
      )?;
      Ok(())
  }

  pub fn today_tasks(conn: &Connection, today_iso: &str) -> AppResult<Vec<Task>> {
      let mut stmt = conn.prepare(
          "SELECT t.* FROM tasks t
           JOIN projects p ON t.project_id = p.id
           WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
             AND t.status != 'done'
             AND (t.due_date IS NOT NULL AND t.due_date <= ?1
                  OR t.start_date IS NOT NULL AND t.start_date <= ?1)
           ORDER BY t.due_date ASC NULLS LAST",
      )?;
      let rows = stmt.query_map(params![today_iso], row_to_task)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn completed_in_range(conn: &Connection, start_iso: &str, end_iso_exclusive: &str, include_archived: bool) -> AppResult<Vec<Task>> {
      let sql = if include_archived {
          "SELECT t.* FROM tasks t JOIN projects p ON t.project_id=p.id
           WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL
             AND t.completed_at >= ?1 AND t.completed_at < ?2
           ORDER BY t.completed_at DESC"
      } else {
          "SELECT t.* FROM tasks t JOIN projects p ON t.project_id=p.id
           WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
             AND t.completed_at >= ?1 AND t.completed_at < ?2
           ORDER BY t.completed_at DESC"
      };
      let mut stmt = conn.prepare(sql)?;
      let rows = stmt.query_map(params![start_iso, end_iso_exclusive], row_to_task)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn in_progress_tasks(conn: &Connection, include_archived: bool) -> AppResult<Vec<Task>> {
      let sql = if include_archived {
          "SELECT t.* FROM tasks t JOIN projects p ON t.project_id=p.id
           WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND t.status='in_progress'
           ORDER BY t.updated_at DESC"
      } else {
          "SELECT t.* FROM tasks t JOIN projects p ON t.project_id=p.id
           WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active' AND t.status='in_progress'
           ORDER BY t.updated_at DESC"
      };
      let mut stmt = conn.prepare(sql)?;
      let rows = stmt.query_map([], row_to_task)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  // NOTE: rusqlite 0.31 中 `optional()` 在 `OptionalExtension` trait 里
  use rusqlite::OptionalExtension;

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::{in_memory_for_test, projects};

      fn setup() -> (rusqlite::Connection, i64) {
          let conn = in_memory_for_test();
          let p = projects::create(&conn, "P", None, None, None).unwrap();
          (conn, p.id)
      }

      #[test]
      fn create_and_list() {
          let (conn, pid) = setup();
          let t = create(&conn, TaskInput { project_id: pid, name: "回邮件".into(), ..Default::default() }).unwrap();
          assert_eq!(t.status, "not_started");
          assert_eq!(list_for_project(&conn, pid).unwrap().len(), 1);
      }

      #[test]
      fn done_sets_completed_at() {
          let (conn, pid) = setup();
          let t = create(&conn, TaskInput { project_id: pid, name: "X".into(), ..Default::default() }).unwrap();
          let done = set_status(&conn, t.id, "done").unwrap();
          assert_eq!(done.status, "done");
          assert!(done.completed_at.is_some());
          let back = set_status(&conn, t.id, "in_progress").unwrap();
          assert!(back.completed_at.is_none());
      }

      #[test]
      fn subtask_only_one_level() {
          let (conn, pid) = setup();
          let root = create(&conn, TaskInput { project_id: pid, name: "R".into(), ..Default::default() }).unwrap();
          let child = create(&conn, TaskInput { project_id: pid, name: "C".into(), parent_task_id: Some(root.id), ..Default::default() }).unwrap();
          let err = create(&conn, TaskInput { project_id: pid, name: "GC".into(), parent_task_id: Some(child.id), ..Default::default() });
          assert!(err.is_err());
      }

      #[test]
      fn today_tasks_respects_due_and_start_dates() {
          let (conn, pid) = setup();
          create(&conn, TaskInput { project_id: pid, name: "due today".into(), due_date: Some("2026-04-23".into()), ..Default::default() }).unwrap();
          create(&conn, TaskInput { project_id: pid, name: "future".into(), due_date: Some("2026-05-01".into()), ..Default::default() }).unwrap();
          let list = today_tasks(&conn, "2026-04-23").unwrap();
          assert_eq!(list.len(), 1);
          assert_eq!(list[0].name, "due today");
      }
  }
  ```

- [ ] **Step 2: 在 `db/mod.rs` 加 `pub mod tasks;`**

- [ ] **Step 3: 运行测试**

  ```bash
  cargo test tasks::
  ```

  Expected: 4 passed（可能首次运行失败因 OptionalExtension import 问题，移动 `use` 到顶部）。

- [ ] **Step 4: Commit**

  ```bash
  git add -A && git commit -m "feat(backend): 任务 CRUD + 状态流转 + today/history 查询"
  ```

---

## Task 15: 任务 IPC 命令

**Files:**
- Create: `src-tauri/src/commands/tasks.rs`
- Modify: `src-tauri/src/commands/mod.rs`、`src-tauri/src/main.rs`

- [ ] **Step 1: 创建 `src-tauri/src/commands/tasks.rs`**

  ```rust
  use tauri::State;
  use serde::Deserialize;
  use crate::db::{DbState, tasks};
  use crate::error::AppResult;
  use crate::models::Task;

  #[derive(Deserialize)]
  #[serde(rename_all = "camelCase")]
  pub struct TaskInputDto {
      pub project_id: i64,
      pub name: String,
      pub group_id: Option<i64>,
      pub parent_task_id: Option<i64>,
      pub priority: Option<String>,
      pub start_date: Option<String>,
      pub due_date: Option<String>,
      pub estimate_hours: Option<f64>,
      pub description: Option<String>,
  }

  impl From<TaskInputDto> for tasks::TaskInput {
      fn from(d: TaskInputDto) -> Self {
          Self {
              project_id: d.project_id,
              name: d.name,
              group_id: d.group_id,
              parent_task_id: d.parent_task_id,
              priority: d.priority,
              start_date: d.start_date,
              due_date: d.due_date,
              estimate_hours: d.estimate_hours,
              description: d.description,
          }
      }
  }

  #[tauri::command]
  pub fn create_task(db: State<'_, DbState>, input: TaskInputDto) -> AppResult<Task> {
      let conn = db.0.lock().unwrap();
      tasks::create(&conn, input.into())
  }

  #[tauri::command]
  pub fn get_task(db: State<'_, DbState>, id: i64) -> AppResult<Task> {
      let conn = db.0.lock().unwrap();
      tasks::get(&conn, id)
  }

  #[tauri::command]
  pub fn list_tasks_for_project(db: State<'_, DbState>, project_id: i64) -> AppResult<Vec<Task>> {
      let conn = db.0.lock().unwrap();
      tasks::list_for_project(&conn, project_id)
  }

  #[tauri::command]
  pub fn list_all_active_tasks(db: State<'_, DbState>) -> AppResult<Vec<Task>> {
      let conn = db.0.lock().unwrap();
      tasks::list_all_active(&conn)
  }

  #[tauri::command]
  pub fn update_task(db: State<'_, DbState>, id: i64, input: TaskInputDto) -> AppResult<Task> {
      let conn = db.0.lock().unwrap();
      tasks::update(&conn, id, input.into())
  }

  #[tauri::command]
  pub fn set_task_status(db: State<'_, DbState>, id: i64, status: String) -> AppResult<Task> {
      let conn = db.0.lock().unwrap();
      tasks::set_status(&conn, id, &status)
  }

  #[tauri::command]
  pub fn soft_delete_task(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      tasks::soft_delete(&conn, id)
  }

  #[tauri::command]
  pub fn today_tasks(db: State<'_, DbState>, today: String) -> AppResult<Vec<Task>> {
      let conn = db.0.lock().unwrap();
      tasks::today_tasks(&conn, &today)
  }

  #[tauri::command]
  pub fn completed_tasks_in_range(db: State<'_, DbState>, start: String, end_exclusive: String, include_archived: bool) -> AppResult<Vec<Task>> {
      let conn = db.0.lock().unwrap();
      tasks::completed_in_range(&conn, &start, &end_exclusive, include_archived)
  }

  #[tauri::command]
  pub fn in_progress_tasks(db: State<'_, DbState>, include_archived: bool) -> AppResult<Vec<Task>> {
      let conn = db.0.lock().unwrap();
      tasks::in_progress_tasks(&conn, include_archived)
  }
  ```

- [ ] **Step 2: 在 `commands/mod.rs` 加 `pub mod tasks;`，`main.rs` 注册全部命令**

- [ ] **Step 3: 编译**

  ```bash
  cargo build
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add -A && git commit -m "feat(backend): 任务 IPC 命令"
  ```

---

## Task 16: 标签管理（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/tags.rs`、`src-tauri/src/commands/tags.rs`

- [ ] **Step 1: DB 层（`src-tauri/src/db/tags.rs`）**

  ```rust
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::Tag;

  fn row_to_tag(r: &rusqlite::Row) -> rusqlite::Result<Tag> {
      Ok(Tag { id: r.get("id")?, name: r.get("name")?, created_at: r.get("created_at")? })
  }

  pub fn upsert(conn: &Connection, name: &str) -> AppResult<Tag> {
      conn.execute("INSERT OR IGNORE INTO tags (name) VALUES (?1)", params![name])?;
      conn.query_row("SELECT * FROM tags WHERE name=?1", params![name], row_to_tag).map_err(Into::into)
  }

  pub fn list_all(conn: &Connection) -> AppResult<Vec<Tag>> {
      let mut stmt = conn.prepare("SELECT * FROM tags ORDER BY name")?;
      Ok(stmt.query_map([], row_to_tag)?.collect::<Result<_,_>>()?)
  }

  pub fn list_for_task(conn: &Connection, task_id: i64) -> AppResult<Vec<Tag>> {
      let mut stmt = conn.prepare(
          "SELECT t.* FROM tags t JOIN task_tags tt ON t.id=tt.tag_id WHERE tt.task_id=?1 ORDER BY t.name",
      )?;
      Ok(stmt.query_map(params![task_id], row_to_tag)?.collect::<Result<_,_>>()?)
  }

  pub fn attach(conn: &Connection, task_id: i64, tag_id: i64) -> AppResult<()> {
      conn.execute("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?1,?2)", params![task_id, tag_id])?;
      Ok(())
  }

  pub fn detach(conn: &Connection, task_id: i64, tag_id: i64) -> AppResult<()> {
      conn.execute("DELETE FROM task_tags WHERE task_id=?1 AND tag_id=?2", params![task_id, tag_id])?;
      Ok(())
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::{in_memory_for_test, projects, tasks};

      #[test]
      fn upsert_attach_detach() {
          let conn = in_memory_for_test();
          let p = projects::create(&conn, "P", None, None, None).unwrap();
          let t = tasks::create(&conn, tasks::TaskInput { project_id: p.id, name: "X".into(), ..Default::default() }).unwrap();
          let tag = upsert(&conn, "urgent").unwrap();
          attach(&conn, t.id, tag.id).unwrap();
          assert_eq!(list_for_task(&conn, t.id).unwrap().len(), 1);
          detach(&conn, t.id, tag.id).unwrap();
          assert_eq!(list_for_task(&conn, t.id).unwrap().len(), 0);
      }
  }
  ```

- [ ] **Step 2: 命令层（`src-tauri/src/commands/tags.rs`）**

  ```rust
  use tauri::State;
  use crate::db::{DbState, tags};
  use crate::error::AppResult;
  use crate::models::Tag;

  #[tauri::command]
  pub fn upsert_tag(db: State<'_, DbState>, name: String) -> AppResult<Tag> {
      let conn = db.0.lock().unwrap();
      tags::upsert(&conn, &name)
  }

  #[tauri::command]
  pub fn list_tags(db: State<'_, DbState>) -> AppResult<Vec<Tag>> {
      let conn = db.0.lock().unwrap();
      tags::list_all(&conn)
  }

  #[tauri::command]
  pub fn list_tags_for_task(db: State<'_, DbState>, task_id: i64) -> AppResult<Vec<Tag>> {
      let conn = db.0.lock().unwrap();
      tags::list_for_task(&conn, task_id)
  }

  #[tauri::command]
  pub fn attach_tag(db: State<'_, DbState>, task_id: i64, tag_id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      tags::attach(&conn, task_id, tag_id)
  }

  #[tauri::command]
  pub fn detach_tag(db: State<'_, DbState>, task_id: i64, tag_id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      tags::detach(&conn, task_id, tag_id)
  }
  ```

- [ ] **Step 3: 注册、测试、编译、Commit**

  ```bash
  # 在 db/mod.rs 加 pub mod tags;
  # 在 commands/mod.rs 加 pub mod tags;
  # 在 main.rs 注册 5 个命令
  cargo test tags:: && cargo build
  git add -A && git commit -m "feat(backend): 标签 CRUD + IPC"
  ```

---

## Task 17: 任务附件（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/attachments.rs`、`src-tauri/src/commands/attachments.rs`

- [ ] **Step 1: DB 层**

  ```rust
  // src-tauri/src/db/attachments.rs
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::TaskAttachment;

  fn row_to(r: &rusqlite::Row) -> rusqlite::Result<TaskAttachment> {
      Ok(TaskAttachment {
          id: r.get("id")?,
          task_id: r.get("task_id")?,
          r#type: r.get("type")?,
          url_or_path: r.get("url_or_path")?,
          label: r.get("label")?,
          created_at: r.get("created_at")?,
      })
  }

  pub fn create(conn: &Connection, task_id: i64, r#type: &str, url_or_path: &str, label: Option<&str>) -> AppResult<TaskAttachment> {
      conn.execute(
          "INSERT INTO task_attachments (task_id, type, url_or_path, label) VALUES (?1,?2,?3,?4)",
          params![task_id, r#type, url_or_path, label],
      )?;
      let id = conn.last_insert_rowid();
      conn.query_row("SELECT * FROM task_attachments WHERE id=?1", params![id], row_to).map_err(Into::into)
  }

  pub fn list_for_task(conn: &Connection, task_id: i64) -> AppResult<Vec<TaskAttachment>> {
      let mut stmt = conn.prepare("SELECT * FROM task_attachments WHERE task_id=?1 ORDER BY created_at")?;
      Ok(stmt.query_map(params![task_id], row_to)?.collect::<Result<_,_>>()?)
  }

  pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("DELETE FROM task_attachments WHERE id=?1", params![id])?;
      Ok(())
  }
  ```

- [ ] **Step 2: 命令层**

  ```rust
  // src-tauri/src/commands/attachments.rs
  use tauri::State;
  use crate::db::{DbState, attachments};
  use crate::error::AppResult;
  use crate::models::TaskAttachment;

  #[tauri::command]
  pub fn create_attachment(db: State<'_, DbState>, task_id: i64, r#type: String, url_or_path: String, label: Option<String>) -> AppResult<TaskAttachment> {
      let conn = db.0.lock().unwrap();
      attachments::create(&conn, task_id, &r#type, &url_or_path, label.as_deref())
  }

  #[tauri::command]
  pub fn list_attachments(db: State<'_, DbState>, task_id: i64) -> AppResult<Vec<TaskAttachment>> {
      let conn = db.0.lock().unwrap();
      attachments::list_for_task(&conn, task_id)
  }

  #[tauri::command]
  pub fn delete_attachment(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      attachments::delete(&conn, id)
  }
  ```

- [ ] **Step 3: 注册、编译、Commit**

  ```bash
  cargo build
  git add -A && git commit -m "feat(backend): 任务附件 CRUD + IPC"
  ```

---

## Task 18: 全局搜索（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/search.rs`、`src-tauri/src/commands/search.rs`

- [ ] **Step 1: DB 层**

  ```rust
  // src-tauri/src/db/search.rs
  use rusqlite::{params, Connection};
  use serde::Serialize;
  use crate::error::AppResult;
  use crate::models::{Project, Task};

  #[derive(Serialize)]
  #[serde(rename_all = "camelCase")]
  pub struct SearchResults {
      pub projects: Vec<Project>,
      pub tasks: Vec<Task>,
  }

  pub fn search(conn: &Connection, query: &str) -> AppResult<SearchResults> {
      let pattern = format!("%{}%", query.replace('%', "\\%").replace('_', "\\_"));

      let mut pstmt = conn.prepare(
          "SELECT * FROM projects WHERE deleted_at IS NULL AND name LIKE ?1 ESCAPE '\\' ORDER BY name LIMIT 20",
      )?;
      let projects: Vec<Project> = pstmt.query_map(params![pattern], crate::db::projects_row_helper)?
          .collect::<Result<_,_>>()?;

      let mut tstmt = conn.prepare(
          "SELECT * FROM tasks WHERE deleted_at IS NULL AND (name LIKE ?1 ESCAPE '\\' OR description LIKE ?1 ESCAPE '\\') ORDER BY updated_at DESC LIMIT 50",
      )?;
      let tasks: Vec<Task> = tstmt.query_map(params![pattern], crate::db::tasks_row_helper)?
          .collect::<Result<_,_>>()?;

      Ok(SearchResults { projects, tasks })
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::{in_memory_for_test, projects, tasks};

      #[test]
      fn search_matches_name() {
          let conn = in_memory_for_test();
          let p = projects::create(&conn, "ACME 二期", None, None, None).unwrap();
          tasks::create(&conn, tasks::TaskInput { project_id: p.id, name: "评审 PRD".into(), ..Default::default() }).unwrap();
          let r = search(&conn, "PRD").unwrap();
          assert_eq!(r.tasks.len(), 1);
          let r2 = search(&conn, "ACME").unwrap();
          assert_eq!(r2.projects.len(), 1);
      }
  }
  ```

- [ ] **Step 2: 在 `db/mod.rs` 导出 row helper**

  在 `src-tauri/src/db/mod.rs` 末尾加：

  ```rust
  pub(crate) fn projects_row_helper(row: &rusqlite::Row) -> rusqlite::Result<crate::models::Project> {
      Ok(crate::models::Project {
          id: row.get("id")?,
          name: row.get("name")?,
          status: row.get("status")?,
          r#type: row.get("type")?,
          start_date: row.get("start_date")?,
          end_date: row.get("end_date")?,
          archived_at: row.get("archived_at")?,
          deleted_at: row.get("deleted_at")?,
          created_at: row.get("created_at")?,
          updated_at: row.get("updated_at")?,
      })
  }

  pub(crate) fn tasks_row_helper(row: &rusqlite::Row) -> rusqlite::Result<crate::models::Task> {
      Ok(crate::models::Task {
          id: row.get("id")?,
          project_id: row.get("project_id")?,
          group_id: row.get("group_id")?,
          parent_task_id: row.get("parent_task_id")?,
          name: row.get("name")?,
          status: row.get("status")?,
          priority: row.get("priority")?,
          start_date: row.get("start_date")?,
          due_date: row.get("due_date")?,
          estimate_hours: row.get("estimate_hours")?,
          description: row.get("description")?,
          completed_at: row.get("completed_at")?,
          deleted_at: row.get("deleted_at")?,
          created_at: row.get("created_at")?,
          updated_at: row.get("updated_at")?,
      })
  }
  ```

  将 `db/projects.rs` 和 `db/tasks.rs` 里原有的 `row_to_project` / `row_to_task` 改为调用这两个 helper（或者删除本地私有版本，改用 `crate::db::projects_row_helper`）。

- [ ] **Step 3: 命令层**

  ```rust
  // src-tauri/src/commands/search.rs
  use tauri::State;
  use crate::db::{DbState, search::{self, SearchResults}};
  use crate::error::AppResult;

  #[tauri::command]
  pub fn search_all(db: State<'_, DbState>, query: String) -> AppResult<SearchResults> {
      let conn = db.0.lock().unwrap();
      search::search(&conn, &query)
  }
  ```

- [ ] **Step 4: 注册、测试、编译、Commit**

  ```bash
  cargo test search:: && cargo build
  git add -A && git commit -m "feat(backend): 全局搜索 + IPC"
  ```

---

## Task 19: 回收站（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/trash.rs`、`src-tauri/src/commands/trash.rs`

- [ ] **Step 1: DB 层**

  ```rust
  // src-tauri/src/db/trash.rs
  use rusqlite::{params, Connection};
  use serde::Serialize;
  use crate::error::AppResult;
  use crate::models::{Project, Task};

  #[derive(Serialize)]
  #[serde(rename_all = "camelCase")]
  pub struct TrashItems {
      pub projects: Vec<Project>,
      pub tasks: Vec<Task>,
  }

  pub fn list(conn: &Connection) -> AppResult<TrashItems> {
      let mut ps = conn.prepare("SELECT * FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")?;
      let projects: Vec<Project> = ps.query_map([], crate::db::projects_row_helper)?.collect::<Result<_,_>>()?;
      let mut ts = conn.prepare("SELECT * FROM tasks WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")?;
      let tasks: Vec<Task> = ts.query_map([], crate::db::tasks_row_helper)?.collect::<Result<_,_>>()?;
      Ok(TrashItems { projects, tasks })
  }

  pub fn restore_project(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("UPDATE projects SET deleted_at=NULL, updated_at=datetime('now') WHERE id=?1", params![id])?;
      Ok(())
  }

  pub fn restore_task(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("UPDATE tasks SET deleted_at=NULL, updated_at=datetime('now') WHERE id=?1", params![id])?;
      Ok(())
  }

  pub fn purge_project(conn: &Connection, id: i64) -> AppResult<()> {
      // 先硬删该项目下所有软删任务
      conn.execute("DELETE FROM tasks WHERE project_id=?1", params![id])?;
      conn.execute("DELETE FROM project_relations WHERE from_project_id=?1 OR to_project_id=?1", params![id])?;
      conn.execute("DELETE FROM task_groups WHERE project_id=?1", params![id])?;
      conn.execute("DELETE FROM projects WHERE id=?1", params![id])?;
      Ok(())
  }

  pub fn purge_task(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("DELETE FROM tasks WHERE id=?1", params![id])?;
      Ok(())
  }
  ```

- [ ] **Step 2: 命令层**

  ```rust
  // src-tauri/src/commands/trash.rs
  use tauri::State;
  use crate::db::{DbState, trash::{self, TrashItems}};
  use crate::error::AppResult;

  #[tauri::command]
  pub fn list_trash(db: State<'_, DbState>) -> AppResult<TrashItems> {
      let conn = db.0.lock().unwrap();
      trash::list(&conn)
  }

  #[tauri::command]
  pub fn restore_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      trash::restore_project(&conn, id)
  }

  #[tauri::command]
  pub fn restore_task(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      trash::restore_task(&conn, id)
  }

  #[tauri::command]
  pub fn purge_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      trash::purge_project(&conn, id)
  }

  #[tauri::command]
  pub fn purge_task(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      trash::purge_task(&conn, id)
  }
  ```

- [ ] **Step 3: 注册、编译、Commit**

  ```bash
  cargo build
  git add -A && git commit -m "feat(backend): 回收站（列表/恢复/彻底删除）+ IPC"
  ```

---

## Task 20: 自动备份

**Files:**
- Create: `src-tauri/src/commands/backup.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 备份模块 + 命令**

  ```rust
  // src-tauri/src/commands/backup.rs
  use tauri::{AppHandle, State, Manager};
  use std::path::PathBuf;
  use std::fs;
  use crate::db::{DbState, resolve_db_path};
  use crate::error::{AppError, AppResult};

  fn default_backup_dir() -> PathBuf {
      directories::UserDirs::new()
          .and_then(|u| u.document_dir().map(|d| d.join("pm-backups")))
          .unwrap_or_else(|| PathBuf::from("./pm-backups"))
  }

  fn timestamp() -> String {
      use chrono::Local;
      Local::now().format("%Y%m%d-%H%M%S").to_string()
  }

  pub fn perform_backup(backup_dir: &std::path::Path) -> AppResult<PathBuf> {
      fs::create_dir_all(backup_dir)?;
      let src = resolve_db_path();
      if !src.exists() {
          return Err(AppError::NotFound("db file not found".into()));
      }
      let dst = backup_dir.join(format!("pm-{}.db", timestamp()));
      fs::copy(&src, &dst)?;
      // 保留 30 份
      let mut entries: Vec<_> = fs::read_dir(backup_dir)?
          .filter_map(|e| e.ok())
          .filter(|e| e.path().extension().map(|s| s == "db").unwrap_or(false))
          .collect();
      entries.sort_by_key(|e| e.metadata().and_then(|m| m.modified()).ok());
      while entries.len() > 30 {
          let oldest = entries.remove(0);
          let _ = fs::remove_file(oldest.path());
      }
      Ok(dst)
  }

  #[tauri::command]
  pub fn backup_now(custom_dir: Option<String>) -> AppResult<String> {
      let dir = custom_dir.map(PathBuf::from).unwrap_or_else(default_backup_dir);
      let path = perform_backup(&dir)?;
      Ok(path.to_string_lossy().to_string())
  }

  #[tauri::command]
  pub fn get_default_backup_dir() -> AppResult<String> {
      Ok(default_backup_dir().to_string_lossy().to_string())
  }
  ```

- [ ] **Step 2: 应用启动时触发一次备份（若距上次 >24h）**

  在 `src-tauri/src/main.rs` 里，`tauri::Builder::default()` 之前或 `.setup(...)` 中添加：

  ```rust
  .setup(|app| {
      let handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
          let dir = commands::backup::default_backup_dir_public();
          // 检查最新备份文件修改时间
          let should_backup = match std::fs::read_dir(&dir) {
              Ok(rd) => {
                  let newest = rd.filter_map(|e| e.ok())
                      .filter_map(|e| e.metadata().ok())
                      .filter_map(|m| m.modified().ok())
                      .max();
                  match newest {
                      Some(t) => t.elapsed().map(|d| d.as_secs() > 24 * 3600).unwrap_or(true),
                      None => true,
                  }
              }
              Err(_) => true,
          };
          if should_backup {
              let _ = commands::backup::perform_backup(&dir);
          }
      });
      Ok(())
  })
  ```

  并在 `commands/backup.rs` 末尾暴露一个 public helper：

  ```rust
  pub fn default_backup_dir_public() -> PathBuf { default_backup_dir() }
  ```

- [ ] **Step 3: 注册 `backup_now` 和 `get_default_backup_dir`；编译验证**

  ```bash
  cargo build
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add -A && git commit -m "feat(backend): 自动数据备份（启动触发 + 手动 + 保留 30 份）"
  ```

---

## Task 21: 数据导出（JSON + Markdown）

**Files:**
- Create: `src-tauri/src/commands/export.rs`

- [ ] **Step 1: 命令实现**

  ```rust
  // src-tauri/src/commands/export.rs
  use tauri::State;
  use std::path::PathBuf;
  use std::fs;
  use serde::Serialize;
  use crate::db::{DbState, projects, tasks};
  use crate::error::AppResult;
  use crate::models::{Project, Task};

  #[derive(Serialize)]
  #[serde(rename_all = "camelCase")]
  struct Bundle {
      projects: Vec<Project>,
      tasks: Vec<Task>,
  }

  #[tauri::command]
  pub fn export_json(db: State<'_, DbState>, output_path: String, project_id: Option<i64>) -> AppResult<String> {
      let conn = db.0.lock().unwrap();
      let (projects, tasks) = match project_id {
          Some(pid) => (vec![projects::get(&conn, pid)?], tasks::list_for_project(&conn, pid)?),
          None => {
              let mut all_projects = projects::list_active(&conn)?;
              all_projects.extend(projects::list_archived(&conn)?);
              let tasks = tasks::list_all_active(&conn)?;
              (all_projects, tasks)
          }
      };
      let bundle = Bundle { projects, tasks };
      let json = serde_json::to_string_pretty(&bundle)?;
      fs::write(&output_path, json)?;
      Ok(output_path)
  }

  #[tauri::command]
  pub fn export_markdown(db: State<'_, DbState>, output_path: String, start: Option<String>, end_exclusive: Option<String>) -> AppResult<String> {
      let conn = db.0.lock().unwrap();
      let projects = projects::list_active(&conn)?;
      let mut md = String::from("# pm · 数据导出\n\n");
      for p in &projects {
          md.push_str(&format!("## {}\n\n", p.name));
          let tasks = tasks::list_for_project(&conn, p.id)?;
          let filtered: Vec<_> = tasks.iter().filter(|t| {
              match (&start, &end_exclusive, &t.completed_at) {
                  (Some(s), Some(e), Some(c)) => c.as_str() >= s.as_str() && c.as_str() < e.as_str(),
                  _ => true,
              }
          }).collect();
          for t in filtered {
              let mark = match t.status.as_str() {
                  "done" => "[x]",
                  "in_progress" => "[~]",
                  _ => "[ ]",
              };
              md.push_str(&format!("- {} {}\n", mark, t.name));
          }
          md.push('\n');
      }
      fs::write(&output_path, md)?;
      Ok(output_path)
  }
  ```

- [ ] **Step 2: 注册、编译、Commit**

  ```bash
  cargo build
  git add -A && git commit -m "feat(backend): 数据导出（JSON + Markdown）+ IPC"
  ```

---

## Task 22: 截止日通知调度

**Files:**
- Create: `src-tauri/src/commands/notifications.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 查询需提醒的任务 + 发送**

  ```rust
  // src-tauri/src/commands/notifications.rs
  use tauri::{AppHandle, Manager};
  use tauri_plugin_notification::NotificationExt;
  use chrono::Local;
  use crate::db::DbState;
  use crate::error::AppResult;

  pub fn check_and_notify(app: &AppHandle) -> AppResult<()> {
      let state = app.state::<DbState>();
      let conn = state.0.lock().unwrap();
      let today = Local::now().format("%Y-%m-%d").to_string();
      let tomorrow = (Local::now() + chrono::Duration::days(1)).format("%Y-%m-%d").to_string();

      // 今天到期
      let mut stmt = conn.prepare(
          "SELECT t.name, p.name AS project_name FROM tasks t
           JOIN projects p ON t.project_id=p.id
           WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
             AND t.status != 'done' AND t.due_date = ?1",
      )?;
      let today_rows: Vec<(String, String)> = stmt.query_map([&today], |r| Ok((r.get(0)?, r.get(1)?)))?
          .collect::<Result<_,_>>()?;
      for (task_name, proj) in today_rows {
          let _ = app.notification().builder()
              .title("今天到期")
              .body(format!("{}（{}）", task_name, proj))
              .show();
      }

      // 明天到期
      let mut stmt2 = conn.prepare(
          "SELECT t.name, p.name FROM tasks t JOIN projects p ON t.project_id=p.id
           WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
             AND t.status != 'done' AND t.due_date = ?1",
      )?;
      let tomorrow_rows: Vec<(String, String)> = stmt2.query_map([&tomorrow], |r| Ok((r.get(0)?, r.get(1)?)))?
          .collect::<Result<_,_>>()?;
      for (task_name, proj) in tomorrow_rows {
          let _ = app.notification().builder()
              .title("明天到期")
              .body(format!("{}（{}）", task_name, proj))
              .show();
      }
      Ok(())
  }

  #[tauri::command]
  pub fn check_notifications_now(app: AppHandle) -> AppResult<()> {
      check_and_notify(&app)
  }
  ```

- [ ] **Step 2: 启动时 + 每小时检查一次**

  在 `main.rs` 的 `.setup(...)` 内追加：

  ```rust
  let app_handle = app.handle().clone();
  tauri::async_runtime::spawn(async move {
      let _ = commands::notifications::check_and_notify(&app_handle);
      loop {
          tokio::time::sleep(std::time::Duration::from_secs(3600)).await;
          let _ = commands::notifications::check_and_notify(&app_handle);
      }
  });
  ```

  若未启用 tokio feature，用 `std::thread::sleep` 在普通线程内实现。

- [ ] **Step 3: 注册命令、编译、Commit**

  ```bash
  cargo build
  git add -A && git commit -m "feat(backend): 截止日通知（今日/明日到期）+ 每小时检查"
  ```

---

# P3 · 前端数据契约

## Task 23: TypeScript 类型定义

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: 与 Rust models 严格对齐的类型**

  ```typescript
  // src/lib/types.ts
  export type ProjectStatus = 'active' | 'archived'
  export type TaskStatus = 'not_started' | 'in_progress' | 'done'
  export type Priority = 'high' | 'medium' | 'low'
  export type RelationType = 'successor' | 'related'
  export type AttachmentType = 'link' | 'file'

  export interface Project {
    id: number
    name: string
    status: ProjectStatus
    type: string | null
    startDate: string | null
    endDate: string | null
    archivedAt: string | null
    deletedAt: string | null
    createdAt: string
    updatedAt: string
  }

  export interface Task {
    id: number
    projectId: number
    groupId: number | null
    parentTaskId: number | null
    name: string
    status: TaskStatus
    priority: Priority | null
    startDate: string | null
    dueDate: string | null
    estimateHours: number | null
    description: string | null
    completedAt: string | null
    deletedAt: string | null
    createdAt: string
    updatedAt: string
  }

  export interface TaskGroup {
    id: number
    projectId: number
    name: string
    sortOrder: number
    createdAt: string
  }

  export interface Tag {
    id: number
    name: string
    createdAt: string
  }

  export interface TaskAttachment {
    id: number
    taskId: number
    type: AttachmentType
    urlOrPath: string
    label: string | null
    createdAt: string
  }

  export interface ProjectRelation {
    id: number
    fromProjectId: number
    toProjectId: number
    relationType: RelationType
    note: string | null
    createdAt: string
  }

  export interface TaskInputDto {
    projectId: number
    name: string
    groupId?: number | null
    parentTaskId?: number | null
    priority?: Priority | null
    startDate?: string | null
    dueDate?: string | null
    estimateHours?: number | null
    description?: string | null
  }

  export interface SearchResults {
    projects: Project[]
    tasks: Task[]
  }

  export interface TrashItems {
    projects: Project[]
    tasks: Task[]
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): TS 类型定义"
  ```

---

## Task 24: `lib/api.ts` — 前后端唯一契约

**Files:**
- Create: `src/lib/api.ts`

- [ ] **Step 1: 把所有 IPC 命令包装成类型化函数**

  ```typescript
  // src/lib/api.ts
  import { invoke } from '@tauri-apps/api/core'
  import type {
    Project, Task, TaskGroup, Tag, TaskAttachment, ProjectRelation,
    TaskInputDto, SearchResults, TrashItems,
  } from './types'

  // Projects
  export const listActiveProjects = () => invoke<Project[]>('list_active_projects')
  export const listArchivedProjects = () => invoke<Project[]>('list_archived_projects')
  export const getProject = (id: number) => invoke<Project>('get_project', { id })
  export const createProject = (args: { name: string; type?: string | null; startDate?: string | null; endDate?: string | null }) =>
    invoke<Project>('create_project', args)
  export const updateProject = (args: { id: number; name: string; type?: string | null; startDate?: string | null; endDate?: string | null }) =>
    invoke<Project>('update_project', args)
  export const archiveProject = (id: number) => invoke<void>('archive_project', { id })
  export const unarchiveProject = (id: number) => invoke<void>('unarchive_project', { id })
  export const softDeleteProject = (id: number) => invoke<void>('soft_delete_project', { id })

  // Project Relations
  export const createProjectRelation = (args: { fromId: number; toId: number; relationType: string; note?: string | null }) =>
    invoke<ProjectRelation>('create_project_relation', args)
  export const listProjectRelations = (projectId: number) =>
    invoke<ProjectRelation[]>('list_project_relations', { projectId })
  export const deleteProjectRelation = (id: number) => invoke<void>('delete_project_relation', { id })

  // Task Groups
  export const createTaskGroup = (args: { projectId: number; name: string; sortOrder: number }) =>
    invoke<TaskGroup>('create_task_group', args)
  export const listTaskGroups = (projectId: number) => invoke<TaskGroup[]>('list_task_groups', { projectId })
  export const renameTaskGroup = (id: number, name: string) => invoke<TaskGroup>('rename_task_group', { id, name })
  export const deleteTaskGroup = (id: number) => invoke<void>('delete_task_group', { id })

  // Tasks
  export const createTask = (input: TaskInputDto) => invoke<Task>('create_task', { input })
  export const getTask = (id: number) => invoke<Task>('get_task', { id })
  export const listTasksForProject = (projectId: number) => invoke<Task[]>('list_tasks_for_project', { projectId })
  export const listAllActiveTasks = () => invoke<Task[]>('list_all_active_tasks')
  export const updateTask = (id: number, input: TaskInputDto) => invoke<Task>('update_task', { id, input })
  export const setTaskStatus = (id: number, status: string) => invoke<Task>('set_task_status', { id, status })
  export const softDeleteTask = (id: number) => invoke<void>('soft_delete_task', { id })
  export const todayTasks = (today: string) => invoke<Task[]>('today_tasks', { today })
  export const completedTasksInRange = (args: { start: string; endExclusive: string; includeArchived: boolean }) =>
    invoke<Task[]>('completed_tasks_in_range', args)
  export const inProgressTasks = (includeArchived: boolean) =>
    invoke<Task[]>('in_progress_tasks', { includeArchived })

  // Tags
  export const upsertTag = (name: string) => invoke<Tag>('upsert_tag', { name })
  export const listTags = () => invoke<Tag[]>('list_tags')
  export const listTagsForTask = (taskId: number) => invoke<Tag[]>('list_tags_for_task', { taskId })
  export const attachTag = (taskId: number, tagId: number) => invoke<void>('attach_tag', { taskId, tagId })
  export const detachTag = (taskId: number, tagId: number) => invoke<void>('detach_tag', { taskId, tagId })

  // Attachments
  export const createAttachment = (args: { taskId: number; type: string; urlOrPath: string; label?: string | null }) =>
    invoke<TaskAttachment>('create_attachment', args)
  export const listAttachments = (taskId: number) => invoke<TaskAttachment[]>('list_attachments', { taskId })
  export const deleteAttachment = (id: number) => invoke<void>('delete_attachment', { id })

  // Search
  export const searchAll = (query: string) => invoke<SearchResults>('search_all', { query })

  // Trash
  export const listTrash = () => invoke<TrashItems>('list_trash')
  export const restoreProject = (id: number) => invoke<void>('restore_project', { id })
  export const restoreTask = (id: number) => invoke<void>('restore_task', { id })
  export const purgeProject = (id: number) => invoke<void>('purge_project', { id })
  export const purgeTask = (id: number) => invoke<void>('purge_task', { id })

  // Backup
  export const backupNow = (customDir?: string) => invoke<string>('backup_now', { customDir: customDir ?? null })
  export const getDefaultBackupDir = () => invoke<string>('get_default_backup_dir')

  // Export
  export const exportJson = (args: { outputPath: string; projectId?: number | null }) =>
    invoke<string>('export_json', args)
  export const exportMarkdown = (args: { outputPath: string; start?: string | null; endExclusive?: string | null }) =>
    invoke<string>('export_markdown', args)

  // Notifications
  export const checkNotificationsNow = () => invoke<void>('check_notifications_now')
  ```

- [ ] **Step 2: 验证前端编译**

  ```bash
  pnpm build
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): api.ts — 前后端唯一契约"
  ```

---

## Task 25: TanStack Query 配置 + 日期工具

**Files:**
- Create: `src/lib/queryClient.ts`、扩展 `src/lib/date.ts`
- Modify: `src/main.tsx`

- [ ] **Step 1: QueryClient 配置**

  ```typescript
  // src/lib/queryClient.ts
  import { QueryClient } from '@tanstack/react-query'
  export const queryClient = new QueryClient({
    defaultOptions: {
      queries: { staleTime: 5_000, refetchOnWindowFocus: false },
    },
  })
  ```

- [ ] **Step 2: 扩展日期工具**

  追加到 `src/lib/date.ts`：

  ```typescript
  export function todayIso(): string { return isoDate(new Date()) }

  export function thisWeekRange(): { start: string; endExclusive: string } {
    const now = new Date()
    const day = now.getDay() || 7  // 周日=7，做到周一开始
    const start = new Date(now); start.setDate(now.getDate() - day + 1); start.setHours(0,0,0,0)
    const end = new Date(start); end.setDate(start.getDate() + 7)
    return { start: isoDate(start), endExclusive: isoDate(end) }
  }

  export function thisMonthRange(): { start: string; endExclusive: string } {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1)
    return { start: isoDate(start), endExclusive: isoDate(end) }
  }
  ```

- [ ] **Step 3: 在 `src/main.tsx` 挂载 Provider**

  ```tsx
  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import { QueryClientProvider } from '@tanstack/react-query'
  import { BrowserRouter } from 'react-router-dom'
  import App from './App'
  import { queryClient } from './lib/queryClient'
  import './index.css'

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  )
  ```

- [ ] **Step 4: 添加日期工具的单测**

  ```typescript
  // 在 src/lib/date.test.ts 追加
  import { thisWeekRange, thisMonthRange, todayIso } from './date'

  describe('week/month range', () => {
    it('week range starts on Monday', () => {
      const r = thisWeekRange()
      expect(r.start <= r.endExclusive).toBe(true)
      expect(new Date(r.start).getDay()).toBe(1)
    })
    it('month range starts on 1st', () => {
      const r = thisMonthRange()
      expect(r.start.endsWith('-01')).toBe(true)
    })
    it('todayIso returns YYYY-MM-DD', () => {
      expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })
  ```

- [ ] **Step 5: 运行测试**

  ```bash
  pnpm test:run
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): QueryClient + 日期工具（区间/today）"
  ```

---

## Task 26: 项目 Query hooks

**Files:**
- Create: `src/features/projects/queries.ts`

- [ ] **Step 1: 实现**

  ```typescript
  // src/features/projects/queries.ts
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
  import * as api from '@/lib/api'

  export const projectKeys = {
    all: ['projects'] as const,
    active: () => [...projectKeys.all, 'active'] as const,
    archived: () => [...projectKeys.all, 'archived'] as const,
    detail: (id: number) => [...projectKeys.all, 'detail', id] as const,
    relations: (id: number) => [...projectKeys.all, 'relations', id] as const,
  }

  export const useActiveProjects = () =>
    useQuery({ queryKey: projectKeys.active(), queryFn: api.listActiveProjects })

  export const useArchivedProjects = () =>
    useQuery({ queryKey: projectKeys.archived(), queryFn: api.listArchivedProjects })

  export const useProject = (id: number | null) =>
    useQuery({ queryKey: projectKeys.detail(id!), queryFn: () => api.getProject(id!), enabled: id != null })

  export function useCreateProject() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: api.createProject,
      onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
    })
  }

  export function useUpdateProject() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: api.updateProject,
      onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
    })
  }

  export function useArchiveProject() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: api.archiveProject,
      onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
    })
  }

  export function useUnarchiveProject() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: api.unarchiveProject,
      onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
    })
  }

  export function useSoftDeleteProject() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: api.softDeleteProject,
      onSuccess: () => qc.invalidateQueries({ queryKey: projectKeys.all }),
    })
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 项目 Query hooks"
  ```

---

## Task 27: 任务 Query hooks

**Files:**
- Create: `src/features/tasks/queries.ts`

- [ ] **Step 1: 实现**

  ```typescript
  // src/features/tasks/queries.ts
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
  import * as api from '@/lib/api'
  import type { TaskInputDto, TaskStatus } from '@/lib/types'

  export const taskKeys = {
    all: ['tasks'] as const,
    byProject: (pid: number) => [...taskKeys.all, 'project', pid] as const,
    allActive: () => [...taskKeys.all, 'all-active'] as const,
    today: (today: string) => [...taskKeys.all, 'today', today] as const,
    detail: (id: number) => [...taskKeys.all, 'detail', id] as const,
    range: (s: string, e: string, arch: boolean) => [...taskKeys.all, 'range', s, e, arch] as const,
    inProgress: (arch: boolean) => [...taskKeys.all, 'in-progress', arch] as const,
  }

  export const useTasksForProject = (projectId: number | null) =>
    useQuery({ queryKey: taskKeys.byProject(projectId!), queryFn: () => api.listTasksForProject(projectId!), enabled: projectId != null })

  export const useAllActiveTasks = () =>
    useQuery({ queryKey: taskKeys.allActive(), queryFn: api.listAllActiveTasks })

  export const useTodayTasks = (today: string) =>
    useQuery({ queryKey: taskKeys.today(today), queryFn: () => api.todayTasks(today) })

  export const useCompletedInRange = (start: string, endExclusive: string, includeArchived: boolean) =>
    useQuery({ queryKey: taskKeys.range(start, endExclusive, includeArchived), queryFn: () => api.completedTasksInRange({ start, endExclusive, includeArchived }) })

  export const useInProgressTasks = (includeArchived: boolean) =>
    useQuery({ queryKey: taskKeys.inProgress(includeArchived), queryFn: () => api.inProgressTasks(includeArchived) })

  export function useCreateTask() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: (input: TaskInputDto) => api.createTask(input),
      onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    })
  }

  export function useUpdateTask() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, input }: { id: number; input: TaskInputDto }) => api.updateTask(id, input),
      onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    })
  }

  export function useSetTaskStatus() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: ({ id, status }: { id: number; status: TaskStatus }) => api.setTaskStatus(id, status),
      onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    })
  }

  export function useSoftDeleteTask() {
    const qc = useQueryClient()
    return useMutation({
      mutationFn: api.softDeleteTask,
      onSuccess: () => qc.invalidateQueries({ queryKey: taskKeys.all }),
    })
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 任务 Query hooks"
  ```

---

## Task 28: 其他 Query hooks（搜索、回收站、标签、附件、项目关联、分组）

**Files:**
- Create: `src/features/search/queries.ts`、`src/features/trash/queries.ts`
- Create: `src/features/projects/relationQueries.ts`、`src/features/tasks/tagQueries.ts`、`src/features/tasks/attachmentQueries.ts`、`src/features/tasks/groupQueries.ts`

- [ ] **Step 1: 搜索**

  ```typescript
  // src/features/search/queries.ts
  import { useQuery } from '@tanstack/react-query'
  import * as api from '@/lib/api'

  export const useSearch = (query: string) =>
    useQuery({
      queryKey: ['search', query],
      queryFn: () => api.searchAll(query),
      enabled: query.trim().length > 0,
    })
  ```

- [ ] **Step 2: 回收站**

  ```typescript
  // src/features/trash/queries.ts
  import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
  import * as api from '@/lib/api'

  export const useTrash = () => useQuery({ queryKey: ['trash'], queryFn: api.listTrash })

  export function useRestoreProject() {
    const qc = useQueryClient()
    return useMutation({ mutationFn: api.restoreProject, onSuccess: () => qc.invalidateQueries() })
  }
  export function useRestoreTask() {
    const qc = useQueryClient()
    return useMutation({ mutationFn: api.restoreTask, onSuccess: () => qc.invalidateQueries() })
  }
  export function usePurgeProject() {
    const qc = useQueryClient()
    return useMutation({ mutationFn: api.purgeProject, onSuccess: () => qc.invalidateQueries() })
  }
  export function usePurgeTask() {
    const qc = useQueryClient()
    return useMutation({ mutationFn: api.purgeTask, onSuccess: () => qc.invalidateQueries() })
  }
  ```

- [ ] **Step 3: 关联/标签/附件/分组** — 模式相同，逐个包装 `api.ts` 里对应函数。参考 Step 1-2 的写法，每个文件 ~30 行。

- [ ] **Step 4: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 搜索/回收站/标签/附件/分组/关联 Query hooks"
  ```

---

# P4 · UI 壳（占位）

> 本阶段目标：用 shadcn/ui 默认组件把所有功能串起来，**不追求视觉美感**，**所有布局是临时的**，等 UI 设计稿到位后在 P5 替换。P4 唯一目的是"数据流全链路打通 + 手动 E2E 测试"。

## Task 29: 占位外壳 + 路由

**Files:**
- Create: `src/components/layout/AppShell.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: AppShell — 最简左导航**

  ```tsx
  // src/components/layout/AppShell.tsx
  import { NavLink, Outlet } from 'react-router-dom'

  const navItems = [
    { to: '/', label: '今日' },
    { to: '/projects', label: '项目' },
    { to: '/history', label: '历史回顾' },
    { to: '/search', label: '搜索' },
    { to: '/trash', label: '回收站' },
    { to: '/settings', label: '设置' },
  ]

  export function AppShell() {
    return (
      <div className="flex h-screen">
        <nav className="w-48 border-r p-2 space-y-1">
          {navItems.map(n => (
            <NavLink key={n.to} to={n.to} end className={({ isActive }) =>
              `block px-3 py-2 rounded ${isActive ? 'bg-slate-200' : 'hover:bg-slate-100'}`
            }>{n.label}</NavLink>
          ))}
        </nav>
        <main className="flex-1 overflow-auto p-6"><Outlet /></main>
      </div>
    )
  }
  ```

- [ ] **Step 2: 路由**

  ```tsx
  // src/App.tsx
  import { Routes, Route } from 'react-router-dom'
  import { AppShell } from '@/components/layout/AppShell'
  import { TodayView } from '@/features/today/TodayView'
  import { ProjectList } from '@/features/projects/ProjectList'
  import { ProjectDetail } from '@/features/projects/ProjectDetail'
  import { HistoryView } from '@/features/history/HistoryView'
  import { GlobalSearch } from '@/features/search/GlobalSearch'
  import { TrashView } from '@/features/trash/TrashView'
  import { SettingsView } from '@/features/settings/SettingsView'

  export default function App() {
    return (
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<TodayView />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="history" element={<HistoryView />} />
          <Route path="search" element={<GlobalSearch />} />
          <Route path="trash" element={<TrashView />} />
          <Route path="settings" element={<SettingsView />} />
        </Route>
      </Routes>
    )
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 占位外壳 + 路由（布局临时，待设计稿替换）"
  ```

---

## Task 30: ProjectList + ProjectForm

**Files:**
- Create: `src/features/projects/ProjectList.tsx`、`src/features/projects/ProjectForm.tsx`

- [ ] **Step 1: ProjectForm**

  ```tsx
  // src/features/projects/ProjectForm.tsx
  import { useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { Label } from '@/components/ui/label'
  import { useCreateProject, useUpdateProject } from './queries'
  import type { Project } from '@/lib/types'

  export function ProjectForm({ initial, onDone }: { initial?: Project; onDone?: () => void }) {
      const [name, setName] = useState(initial?.name ?? '')
      const [type, setType] = useState(initial?.type ?? '')
      const [startDate, setStartDate] = useState(initial?.startDate ?? '')
      const [endDate, setEndDate] = useState(initial?.endDate ?? '')
      const create = useCreateProject()
      const update = useUpdateProject()

      async function submit(e: React.FormEvent) {
          e.preventDefault()
          const args = { name, type: type || null, startDate: startDate || null, endDate: endDate || null }
          if (initial) await update.mutateAsync({ id: initial.id, ...args })
          else await create.mutateAsync(args)
          onDone?.()
      }
      return (
          <form onSubmit={submit} className="space-y-3">
              <div><Label>名称 *</Label><Input value={name} onChange={e => setName(e.target.value)} required /></div>
              <div><Label>类型</Label><Input value={type} onChange={e => setType(e.target.value)} placeholder="如：售前 / 实施 / 运维" /></div>
              <div><Label>开始</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
              <div><Label>结束</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
              <Button type="submit" disabled={!name || create.isPending || update.isPending}>
                  {initial ? '保存' : '新建'}
              </Button>
          </form>
      )
  }
  ```

- [ ] **Step 2: ProjectList**

  ```tsx
  // src/features/projects/ProjectList.tsx
  import { useState } from 'react'
  import { Link } from 'react-router-dom'
  import { Button } from '@/components/ui/button'
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
  import { useActiveProjects, useArchivedProjects } from './queries'
  import { ProjectForm } from './ProjectForm'

  export function ProjectList() {
      const [open, setOpen] = useState(false)
      const [showArchived, setShowArchived] = useState(false)
      const active = useActiveProjects()
      const archived = useArchivedProjects()

      return (
          <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">项目</h1>
                  <Dialog open={open} onOpenChange={setOpen}>
                      <DialogTrigger asChild><Button>新建项目</Button></DialogTrigger>
                      <DialogContent>
                          <DialogHeader><DialogTitle>新建项目</DialogTitle></DialogHeader>
                          <ProjectForm onDone={() => setOpen(false)} />
                      </DialogContent>
                  </Dialog>
                  <Button variant="outline" onClick={() => setShowArchived(v => !v)}>
                      {showArchived ? '隐藏归档' : '显示归档'}
                  </Button>
              </div>

              <section>
                  <h2 className="text-lg font-medium mb-2">活跃项目（{active.data?.length ?? 0}）</h2>
                  <ul className="space-y-1">
                      {active.data?.map(p => (
                          <li key={p.id}>
                              <Link to={`/projects/${p.id}`} className="underline">{p.name}</Link>
                              {p.type && <span className="ml-2 text-sm text-slate-500">[{p.type}]</span>}
                          </li>
                      ))}
                  </ul>
              </section>

              {showArchived && (
                  <section>
                      <h2 className="text-lg font-medium mb-2">归档项目（{archived.data?.length ?? 0}）</h2>
                      <ul className="space-y-1">
                          {archived.data?.map(p => (
                              <li key={p.id}>
                                  <Link to={`/projects/${p.id}`} className="underline text-slate-500">{p.name}</Link>
                              </li>
                          ))}
                      </ul>
                  </section>
              )}
          </div>
      )
  }
  ```

- [ ] **Step 3: `pnpm tauri dev`，验证：能新建项目、能看到列表、能切显/隐归档**

- [ ] **Step 4: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 项目列表 + 新建/编辑表单（占位版）"
  ```

---

## Task 31: ProjectDetail + 视图切换占位

**Files:**
- Create: `src/features/projects/ProjectDetail.tsx`、`src/features/tasks/TaskList.tsx`、`src/features/tasks/TaskKanban.tsx`、`src/features/tasks/TaskGantt.tsx`、`src/features/tasks/TaskForm.tsx`

- [ ] **Step 1: TaskForm**（与 ProjectForm 同结构，字段参考 spec §5.3；略——逐字段 `<Input>` 即可，submit 调 `useCreateTask/useUpdateTask`）

- [ ] **Step 2: TaskList（项目内）**

  ```tsx
  // src/features/tasks/TaskList.tsx
  import { useTasksForProject, useSetTaskStatus, useSoftDeleteTask } from './queries'
  import { Button } from '@/components/ui/button'
  import type { Task, TaskStatus } from '@/lib/types'

  export function TaskList({ projectId }: { projectId: number }) {
      const q = useTasksForProject(projectId)
      const setStatus = useSetTaskStatus()
      const del = useSoftDeleteTask()
      if (q.isLoading) return <div>Loading...</div>
      return (
          <ul className="space-y-1">
              {q.data?.map((t: Task) => (
                  <li key={t.id} className="flex items-center gap-2 border-b py-1">
                      <select value={t.status} onChange={e => setStatus.mutate({ id: t.id, status: e.target.value as TaskStatus })}>
                          <option value="not_started">未开始</option>
                          <option value="in_progress">进行中</option>
                          <option value="done">已完成</option>
                      </select>
                      <span className={t.status === 'done' ? 'line-through text-slate-400' : ''}>{t.name}</span>
                      {t.dueDate && <span className="text-xs text-slate-500">{t.dueDate}</span>}
                      <Button size="sm" variant="ghost" onClick={() => del.mutate(t.id)}>删</Button>
                  </li>
              ))}
          </ul>
      )
  }
  ```

- [ ] **Step 3: TaskKanban（项目内看板）**

  ```tsx
  // src/features/tasks/TaskKanban.tsx
  import { useTasksForProject, useSetTaskStatus } from './queries'
  import type { TaskStatus } from '@/lib/types'

  const cols: { key: TaskStatus; label: string }[] = [
      { key: 'not_started', label: '未开始' },
      { key: 'in_progress', label: '进行中' },
      { key: 'done', label: '已完成' },
  ]

  export function TaskKanban({ projectId }: { projectId: number }) {
      const q = useTasksForProject(projectId)
      const setStatus = useSetTaskStatus()
      return (
          <div className="grid grid-cols-3 gap-4">
              {cols.map(c => (
                  <div key={c.key} className="border rounded p-2 min-h-[200px]">
                      <h3 className="font-medium mb-2">{c.label}</h3>
                      {q.data?.filter(t => t.status === c.key).map(t => (
                          <div key={t.id} className="bg-white border rounded p-2 mb-2">
                              <div>{t.name}</div>
                              <div className="flex gap-1 mt-1">
                                  {cols.filter(x => x.key !== c.key).map(x => (
                                      <button key={x.key} className="text-xs underline"
                                          onClick={() => setStatus.mutate({ id: t.id, status: x.key })}>
                                          → {x.label}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
              ))}
          </div>
      )
  }
  ```

- [ ] **Step 4: TaskGantt（占位 — 最简时间轴表格）**

  ```tsx
  // src/features/tasks/TaskGantt.tsx
  import { useTasksForProject } from './queries'

  export function TaskGantt({ projectId }: { projectId: number }) {
      const q = useTasksForProject(projectId)
      const withDates = q.data?.filter(t => t.startDate && t.dueDate) ?? []
      return (
          <div className="space-y-1">
              <p className="text-sm text-slate-500">甘特图（占位版）— 只展示有 startDate+dueDate 的任务</p>
              <table className="w-full text-sm">
                  <thead><tr><th className="text-left">任务</th><th>开始</th><th>截止</th><th>跨度</th></tr></thead>
                  <tbody>
                      {withDates.map(t => {
                          const days = Math.ceil((+new Date(t.dueDate!) - +new Date(t.startDate!)) / 86400000) + 1
                          return <tr key={t.id} className="border-t">
                              <td>{t.name}</td><td>{t.startDate}</td><td>{t.dueDate}</td><td>{days} 天</td>
                          </tr>
                      })}
                  </tbody>
              </table>
          </div>
      )
  }
  ```

- [ ] **Step 5: ProjectDetail — Tab 切换**

  ```tsx
  // src/features/projects/ProjectDetail.tsx
  import { useParams } from 'react-router-dom'
  import { useState } from 'react'
  import { useProject, useArchiveProject, useUnarchiveProject, useSoftDeleteProject } from './queries'
  import { Button } from '@/components/ui/button'
  import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
  import { TaskList } from '@/features/tasks/TaskList'
  import { TaskKanban } from '@/features/tasks/TaskKanban'
  import { TaskGantt } from '@/features/tasks/TaskGantt'
  import { TaskForm } from '@/features/tasks/TaskForm'
  import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

  export function ProjectDetail() {
      const { id } = useParams()
      const pid = Number(id)
      const p = useProject(pid)
      const archive = useArchiveProject()
      const unarchive = useUnarchiveProject()
      const del = useSoftDeleteProject()
      const [openTask, setOpenTask] = useState(false)
      if (!p.data) return <div>Loading...</div>
      return (
          <div className="space-y-4">
              <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-semibold">{p.data.name}</h1>
                  {p.data.status === 'archived' && <span className="text-sm text-slate-500">已归档</span>}
                  <div className="ml-auto flex gap-2">
                      {p.data.status === 'active'
                          ? <Button variant="outline" onClick={() => archive.mutate(pid)}>归档</Button>
                          : <Button variant="outline" onClick={() => unarchive.mutate(pid)}>重启</Button>}
                      <Button variant="destructive" onClick={() => del.mutate(pid)}>删除</Button>
                      <Dialog open={openTask} onOpenChange={setOpenTask}>
                          <DialogTrigger asChild><Button>+ 任务</Button></DialogTrigger>
                          <DialogContent>
                              <DialogHeader><DialogTitle>新建任务</DialogTitle></DialogHeader>
                              <TaskForm projectId={pid} onDone={() => setOpenTask(false)} />
                          </DialogContent>
                      </Dialog>
                  </div>
              </div>

              <Tabs defaultValue="list">
                  <TabsList>
                      <TabsTrigger value="list">列表</TabsTrigger>
                      <TabsTrigger value="kanban">看板</TabsTrigger>
                      <TabsTrigger value="gantt">甘特图</TabsTrigger>
                  </TabsList>
                  <TabsContent value="list"><TaskList projectId={pid} /></TabsContent>
                  <TabsContent value="kanban"><TaskKanban projectId={pid} /></TabsContent>
                  <TabsContent value="gantt"><TaskGantt projectId={pid} /></TabsContent>
              </Tabs>
          </div>
      )
  }
  ```

- [ ] **Step 6: `pnpm tauri dev` 手动验证**：建项目 → 进详情 → 建任务 → 切三种视图

- [ ] **Step 7: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 项目详情 + 任务三视图（占位版）"
  ```

---

## Task 32: TodayView

**Files:**
- Create: `src/features/today/TodayView.tsx`

- [ ] **Step 1: 实现（按项目分组）**

  ```tsx
  // src/features/today/TodayView.tsx
  import { Link } from 'react-router-dom'
  import { useTodayTasks, useSetTaskStatus } from '@/features/tasks/queries'
  import { useActiveProjects } from '@/features/projects/queries'
  import { todayIso } from '@/lib/date'

  export function TodayView() {
      const today = todayIso()
      const tasks = useTodayTasks(today)
      const projects = useActiveProjects()
      const setStatus = useSetTaskStatus()

      const groups = new Map<number, typeof tasks.data>()
      tasks.data?.forEach(t => {
          const arr = groups.get(t.projectId) ?? []
          arr.push(t); groups.set(t.projectId, arr)
      })

      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">今日（{today}）</h1>
              {[...groups.entries()].map(([pid, ts]) => {
                  const p = projects.data?.find(x => x.id === pid)
                  return (
                      <section key={pid}>
                          <h2 className="font-medium mb-2">
                              <Link to={`/projects/${pid}`} className="underline">{p?.name ?? `项目 #${pid}`}</Link>
                          </h2>
                          <ul className="space-y-1 ml-4">
                              {ts?.map(t => (
                                  <li key={t.id} className="flex gap-2">
                                      <input type="checkbox" checked={t.status === 'done'}
                                          onChange={e => setStatus.mutate({ id: t.id, status: e.target.checked ? 'done' : 'in_progress' })} />
                                      <span className={t.status === 'done' ? 'line-through text-slate-400' : ''}>{t.name}</span>
                                      {t.dueDate && <span className="text-xs text-slate-500">{t.dueDate}</span>}
                                  </li>
                              ))}
                          </ul>
                      </section>
                  )
              })}
              {tasks.data?.length === 0 && <p className="text-slate-500">今天没有待办。</p>}
          </div>
      )
  }
  ```

- [ ] **Step 2: 验证、Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 今日待办视图（按项目分组）"
  ```

---

## Task 33: HistoryView

**Files:**
- Create: `src/features/history/HistoryView.tsx`

- [ ] **Step 1: 实现**

  ```tsx
  // src/features/history/HistoryView.tsx
  import { useState } from 'react'
  import { Button } from '@/components/ui/button'
  import { Input } from '@/components/ui/input'
  import { useCompletedInRange, useInProgressTasks } from '@/features/tasks/queries'
  import { useActiveProjects } from '@/features/projects/queries'
  import { thisWeekRange, thisMonthRange } from '@/lib/date'

  export function HistoryView() {
      const [range, setRange] = useState(thisWeekRange())
      const [includeArchived, setIncludeArchived] = useState(false)
      const completed = useCompletedInRange(range.start, range.endExclusive, includeArchived)
      const inProgress = useInProgressTasks(includeArchived)
      const projects = useActiveProjects()
      const projectName = (pid: number) => projects.data?.find(p => p.id === pid)?.name ?? `#${pid}`

      const grouped = (tasks: typeof completed.data) => {
          const m = new Map<number, typeof completed.data>()
          tasks?.forEach(t => {
              const arr = m.get(t.projectId) ?? []
              arr.push(t); m.set(t.projectId, arr)
          })
          return m
      }

      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">历史回顾</h1>
              <div className="flex items-center gap-2">
                  <Button onClick={() => setRange(thisWeekRange())}>本周</Button>
                  <Button onClick={() => setRange(thisMonthRange())}>本月</Button>
                  <Input type="date" value={range.start} onChange={e => setRange(r => ({ ...r, start: e.target.value }))} />
                  <span>~</span>
                  <Input type="date" value={range.endExclusive} onChange={e => setRange(r => ({ ...r, endExclusive: e.target.value }))} />
                  <label className="ml-auto flex items-center gap-1 text-sm">
                      <input type="checkbox" checked={includeArchived} onChange={e => setIncludeArchived(e.target.checked)} />
                      包含归档
                  </label>
              </div>

              <section>
                  <h2 className="font-medium">已完成（{range.start} ~ {range.endExclusive}）</h2>
                  {[...grouped(completed.data).entries()].map(([pid, ts]) => (
                      <div key={pid} className="mt-2">
                          <div className="font-medium">{projectName(pid)}</div>
                          <ul className="ml-4">{ts?.map(t => <li key={t.id}>✓ {t.name}</li>)}</ul>
                      </div>
                  ))}
              </section>

              <section>
                  <h2 className="font-medium">进行中</h2>
                  {[...grouped(inProgress.data).entries()].map(([pid, ts]) => (
                      <div key={pid} className="mt-2">
                          <div className="font-medium">{projectName(pid)}</div>
                          <ul className="ml-4">{ts?.map(t => <li key={t.id}>· {t.name}</li>)}</ul>
                      </div>
                  ))}
              </section>
          </div>
      )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 历史回顾视图（本周/本月/自定义）"
  ```

---

## Task 34: GlobalSearch（Cmd+K）

**Files:**
- Create: `src/features/search/GlobalSearch.tsx`
- Modify: `src/App.tsx`（全局快捷键）

- [ ] **Step 1: GlobalSearch 页面版**

  ```tsx
  // src/features/search/GlobalSearch.tsx
  import { useState } from 'react'
  import { Link } from 'react-router-dom'
  import { Input } from '@/components/ui/input'
  import { useSearch } from './queries'

  export function GlobalSearch() {
      const [q, setQ] = useState('')
      const r = useSearch(q)
      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">搜索</h1>
              <Input autoFocus placeholder="搜项目 / 任务名 / 任务描述…" value={q} onChange={e => setQ(e.target.value)} />
              {q && (
                  <div className="space-y-3">
                      <section>
                          <h2 className="font-medium">项目（{r.data?.projects.length ?? 0}）</h2>
                          <ul>{r.data?.projects.map(p =>
                              <li key={p.id}><Link to={`/projects/${p.id}`} className="underline">{p.name}</Link></li>)}</ul>
                      </section>
                      <section>
                          <h2 className="font-medium">任务（{r.data?.tasks.length ?? 0}）</h2>
                          <ul>{r.data?.tasks.map(t =>
                              <li key={t.id}><Link to={`/projects/${t.projectId}`} className="underline">{t.name}</Link></li>)}</ul>
                      </section>
                  </div>
              )}
          </div>
      )
  }
  ```

- [ ] **Step 2: Cmd+K 快捷键导航到 /search**

  在 `src/App.tsx` 内加一个 `useEffect`：

  ```tsx
  import { useEffect } from 'react'
  import { useNavigate, Routes, Route } from 'react-router-dom'
  // ...
  export default function App() {
      const navigate = useNavigate()
      useEffect(() => {
          const fn = (e: KeyboardEvent) => {
              if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
                  e.preventDefault(); navigate('/search')
              }
          }
          window.addEventListener('keydown', fn)
          return () => window.removeEventListener('keydown', fn)
      }, [navigate])
      return <Routes>...</Routes>
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 全局搜索页 + Cmd+K 快捷键"
  ```

---

## Task 35: TrashView

**Files:**
- Create: `src/features/trash/TrashView.tsx`

- [ ] **Step 1: 实现**

  ```tsx
  // src/features/trash/TrashView.tsx
  import { useTrash, useRestoreProject, useRestoreTask, usePurgeProject, usePurgeTask } from './queries'
  import { Button } from '@/components/ui/button'

  export function TrashView() {
      const t = useTrash()
      const rp = useRestoreProject(), rt = useRestoreTask()
      const pp = usePurgeProject(), pt = usePurgeTask()
      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">回收站</h1>
              <section>
                  <h2 className="font-medium">项目</h2>
                  {t.data?.projects.map(p =>
                      <div key={p.id} className="flex items-center gap-2">
                          <span>{p.name}</span>
                          <span className="text-xs text-slate-500">{p.deletedAt}</span>
                          <Button size="sm" variant="outline" onClick={() => rp.mutate(p.id)}>恢复</Button>
                          <Button size="sm" variant="destructive" onClick={() => confirm('彻底删除？') && pp.mutate(p.id)}>彻底删除</Button>
                      </div>)}
              </section>
              <section>
                  <h2 className="font-medium">任务</h2>
                  {t.data?.tasks.map(x =>
                      <div key={x.id} className="flex items-center gap-2">
                          <span>{x.name}</span>
                          <span className="text-xs text-slate-500">{x.deletedAt}</span>
                          <Button size="sm" variant="outline" onClick={() => rt.mutate(x.id)}>恢复</Button>
                          <Button size="sm" variant="destructive" onClick={() => confirm('彻底删除？') && pt.mutate(x.id)}>彻底删除</Button>
                      </div>)}
              </section>
          </div>
      )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 回收站视图（恢复/彻底删除）"
  ```

---

## Task 36: SettingsView + ExportDialog

**Files:**
- Create: `src/features/settings/SettingsView.tsx`、`src/features/export/ExportDialog.tsx`

- [ ] **Step 1: SettingsView — 备份 + 导出入口**

  ```tsx
  // src/features/settings/SettingsView.tsx
  import { useEffect, useState } from 'react'
  import { Button } from '@/components/ui/button'
  import * as api from '@/lib/api'
  import { save } from '@tauri-apps/plugin-dialog'
  import { thisMonthRange } from '@/lib/date'

  export function SettingsView() {
      const [backupDir, setBackupDir] = useState('')
      const [msg, setMsg] = useState('')
      useEffect(() => { api.getDefaultBackupDir().then(setBackupDir) }, [])

      async function onBackup() {
          const p = await api.backupNow()
          setMsg(`已备份到 ${p}`)
      }
      async function onExportJson() {
          const path = await save({ defaultPath: 'pm-export.json', filters: [{ name: 'JSON', extensions: ['json'] }] })
          if (!path) return
          await api.exportJson({ outputPath: path })
          setMsg(`已导出 JSON 到 ${path}`)
      }
      async function onExportMd() {
          const path = await save({ defaultPath: 'pm-this-month.md', filters: [{ name: 'Markdown', extensions: ['md'] }] })
          if (!path) return
          const { start, endExclusive } = thisMonthRange()
          await api.exportMarkdown({ outputPath: path, start, endExclusive })
          setMsg(`已导出本月 Markdown 到 ${path}`)
      }

      return (
          <div className="space-y-4">
              <h1 className="text-2xl font-semibold">设置</h1>
              <section>
                  <h2 className="font-medium mb-2">备份</h2>
                  <p className="text-sm text-slate-500">默认目录：{backupDir}</p>
                  <Button onClick={onBackup}>立即备份</Button>
              </section>
              <section>
                  <h2 className="font-medium mb-2">导出</h2>
                  <div className="flex gap-2">
                      <Button variant="outline" onClick={onExportJson}>导出全部 JSON</Button>
                      <Button variant="outline" onClick={onExportMd}>导出本月 Markdown</Button>
                  </div>
              </section>
              {msg && <p className="text-sm text-green-700">{msg}</p>}
          </div>
      )
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 设置页（备份 + 导出入口）"
  ```

---

## Task 37: 跨项目 List + Kanban

**Files:**
- Create: `src/features/tasks/CrossProjectList.tsx`、`src/features/tasks/CrossProjectKanban.tsx`
- Modify: `src/App.tsx`（加入 /all 路由）

- [ ] **Step 1: CrossProjectList**

  ```tsx
  // src/features/tasks/CrossProjectList.tsx
  import { useAllActiveTasks } from './queries'
  import { useActiveProjects } from '@/features/projects/queries'

  export function CrossProjectList() {
      const tasks = useAllActiveTasks()
      const projects = useActiveProjects()
      const name = (pid: number) => projects.data?.find(p => p.id === pid)?.name ?? `#${pid}`
      return (
          <div>
              <h1 className="text-2xl font-semibold mb-4">所有任务</h1>
              <table className="w-full text-sm">
                  <thead><tr><th>任务</th><th>项目</th><th>状态</th><th>截止</th></tr></thead>
                  <tbody>{tasks.data?.map(t => (
                      <tr key={t.id} className="border-t">
                          <td>{t.name}</td><td>{name(t.projectId)}</td><td>{t.status}</td><td>{t.dueDate ?? ''}</td>
                      </tr>
                  ))}</tbody>
              </table>
          </div>
      )
  }
  ```

- [ ] **Step 2: CrossProjectKanban — 与项目内看板结构相同，但需在卡片上显示项目名**

  用 `useAllActiveTasks + useActiveProjects`，三列按 status 过滤，卡片显示 `{project.name} · {task.name}`。

- [ ] **Step 3: 在路由加入 `/all/list` 和 `/all/kanban`，在导航栏加入入口**

- [ ] **Step 4: Commit**

  ```bash
  git add -A && git commit -m "feat(frontend): 跨项目 List + Kanban 视图"
  ```

---

## Task 38: 端到端人工验证（Smoke Test）

**Files:** 无需创建

- [ ] **Step 1: 启动应用**

  ```bash
  cd ~/Desktop/pm && pnpm tauri dev
  ```

- [ ] **Step 2: 按顺序手动走以下流程，每步验证无错**

  1. 创建 3 个项目（类型分别写"售前"、"实施"、"运维"）
  2. 进入第一个项目 → 建 3 个任务（不同状态、不同 due_date，其中一个给一个 startDate）
  3. 切到看板视图，通过"→"按钮把任务挪列
  4. 切到甘特图，看有日期的任务出现在表格
  5. 回到"今日"视图，检查今天到期的任务出现
  6. 进"历史回顾"，切本周/本月/自定义区间，检查已完成任务出现
  7. 归档第一个项目，确认从"活跃"列表消失；在"显示归档"里看到，点进去能重启
  8. 删除一个任务 → 进回收站 → 恢复 → 返回项目看到任务回来
  9. Cmd+K 搜索，能找到项目和任务
  10. 设置页 → 立即备份 → 看到成功提示；到 `~/Documents/pm-backups/` 确认有 .db 文件
  11. 设置页 → 导出 JSON → 打开文件确认内容完整
  12. 设置页 → 导出本月 Markdown → 打开文件确认按项目分组

- [ ] **Step 3: 若全部通过，tag 一个里程碑**

  ```bash
  git tag v0.1-p4-complete
  git log --oneline | head -20
  ```

---

# P5 · UI 重构（等待设计稿）

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
P1 (1→2→3→4→5) — 独立地基
     ↓
P1 (6→7→8) — Rust 模型+错误+DB
     ↓
P1 (9) — IPC 打通
     ↓
P2 (10→11, 12, 13, 14→15, 16, 17, 18, 19, 20, 21, 22) — 后端数据层（10 之后可部分并行）
     ↓
P3 (23→24→25, 26, 27, 28) — 前端数据契约（23→24→25 串行，之后并行）
     ↓
P4 (29→30→31→32→33→34→35→36→37→38)
```
