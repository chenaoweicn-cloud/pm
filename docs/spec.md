# 项目管理工具 · 需求规格说明书（V1）

- **版本**：V1.0
- **日期**：2026-04-23
- **类型**：纯个人 Mac 桌面应用
- **技术栈**：Tauri 2.x + React + TypeScript + SQLite

---

## 1. 概述

为**项目经理 + 业务顾问**角色设计的纯个人任务管理工具。区别于传统"Todo List"和"甘特图"类工具，本工具强调两件事：

1. **项目/任务的统一库存视角**——打开即知"手上有哪些项目、每个项目下有哪些任务"
2. **时间驱动的历史回顾**——支持按时间区间查看已完成/进行中的任务，服务于周报手写

## 2. 问题背景

使用者当前工作流下有两个突出痛点：

- **痛点 A（最高）**：任务散落在 IM、邮件、纸笔、多个 todo app 等多处，没有统一视角；别人问"手上有什么项目"时答不出；工作中经常遗漏小任务
- **痛点 C（次高）**：写周报时记不清本周做了什么，需要翻聊天记录和文件

其他痛点（优先级管理混乱、项目状态不透明、上下文切换损耗）本版本不重点优化。

## 3. 目标与非目标

### 3.1 目标
- 提供"一查即有"的**外部记忆**，替代大脑完成项目/任务的库存记忆
- 支持**时间驱动**的历史回顾，直接服务于周报撰写
- 低摩擦录入（不追求秒级极速，但不拖累使用者）
- 本地优先、数据可控（单机 Mac、SQLite 本地单文件）

### 3.2 非目标（本版本明确不做）
- 多用户协作 / 权限 / 任务分配
- 云端同步 / 多端访问 / 账号体系
- **自动生成**周报文本（只做汇总视图，用户自己手写）
- 实际工时打卡
- 数据导入（无存量数据需要迁移）
- 决策/沟通/风险/阻塞等非任务型信息的捕获（推迟到 V2）

### 3.3 UI 范围说明（重要）

本 spec **只定义功能需求和信息架构**——即"需要哪些功能、数据之间的关系、用户需要能完成哪些目标"。

本 spec **不定义 UI 布局**——包括但不限于：
- 导航放在哪一侧（侧边栏 / 顶栏 / 抽屉 / 其他）
- 录入形式（模态框 / 抽屉 / 独立页 / 内联）
- 视觉风格、配色、组件形态
- 交互细节（除明确声明的快捷键外）

界面组织、视觉设计、交互细节由 UI 设计师基于本文档独立设计。实现阶段以 UI 设计稿为准。

## 4. 使用者与典型场景

### 4.1 使用者画像
- **角色**：项目经理 + 业务顾问（PM / BA）
- **职责**：项目管理 + 需求分析 + 原型设计（不只协调，也产出文档/原型）
- **设备**：Mac 桌面

### 4.2 规模估计
- 同时活跃项目：6-10 个（其中 5 左右常驻，其余为临时项目）
- 每个项目的活跃任务：10-30 个
- 系统中总活跃任务：100-300 个
- 任务颗粒度：以**中小任务为主**（30 分钟到 3 天），大任务会拆子任务

### 4.3 典型场景

| # | 场景 | 动作 |
|---|---|---|
| S1 | 早晨打开应用 | 看到今日待办（跨项目聚合，按项目分组） |
| S2 | 临时获得新任务 | 打开对应项目 → 新建任务 → 填写必要字段 |
| S3 | 周五写周报 | 打开"历史回顾" → 选"本周" → 按项目分组看完成和进行中的任务 → 手写周报 |
| S4 | 别人问"你手上有啥项目" | 快速查看活跃项目列表 → 立即答出 |
| S5 | 项目交付完成 | 将项目归档，使其不再出现在日常视图 |
| S6 | 归档项目启动二期 | 重启该归档项目 或 新建项目并关联到原项目 |
| S7 | 查找某个历史任务 | 用全局搜索 |

## 5. 功能需求

### 5.1 核心概念

- **项目（Project）**：一个可管理的工作单元，有名称、状态（活跃 / 归档）、可选类型和计划起止日期
- **任务（Task）**：从属于一个项目的工作事项，有 3 态（未开始 / 进行中 / 已完成）
- **任务分组（Task Group）**：项目内部的任务分组，用于区分"一期任务"、"二期任务"这类并行工作流
- **项目关联（Project Relation）**：项目之间的追溯关系，如"二期源自一期"

### 5.2 项目管理

**字段**：

| 字段 | 必填 | 说明 |
|---|---|---|
| 名称 | ✅ | 项目名称 |
| 状态 | ✅ | active / archived，默认 active |
| 类型 | ❌ | 自由字符串标签，如"售前"/"实施"/"运维"/"二期挖掘" |
| 计划起止日期 | ❌ | 允许不填（你说过经常没有明确终点） |

**操作**：
- 创建 / 编辑 / 软删除
- **归档**：`status='archived'`，记录 `archived_at`，项目从日常视图中消失
- **重启**：将归档项目恢复为 `active`
- **关联**：指定该项目与另一项目的追溯关系（successor / related）

### 5.3 任务管理

**字段**：

| 字段 | 必填 | 说明 |
|---|---|---|
| 所属项目 | ✅ | |
| 名称 | ✅ | |
| 状态 | ✅ | not_started / in_progress / done |
| 所属分组 | ❌ | 属于项目内某个 task_group |
| 父任务 | ❌ | 用于子任务（仅支持一层嵌套） |
| 计划开始日期 | ❌ | |
| 计划截止日期 | ❌ | |
| 预估工时 | ❌ | 如 "4h"、"1d"，存储为 REAL（小时数） |
| 优先级 | ❌ | high / medium / low |
| 描述 | ❌ | 一段文字说明 |
| 标签 | ❌ | 多对多，标签字典共享 |
| 附件/链接 | ❌ | 一对多，可以是外部链接或本地文件路径 |

**完成时间戳**：`completed_at` 在状态变为 `done` 时自动设置；改回其他状态时清空。此字段是历史回顾的核心依据。

**操作**：
- 创建 / 编辑 / 软删除
- 状态流转：未开始 ⇄ 进行中 ⇄ 已完成（三向均可）
- 添加/移除子任务
- 分配/移除分组
- 管理标签和附件

### 5.4 视图体系

**默认落地页**：今日待办（跨项目聚合视图）

**全局访问需求**（功能性，不限定 UI 呈现方式）：
- **活跃项目列表需能随时快速访问**——这是缓解痛点 A 的关键，UI 设计必须让"我手上有哪些项目"在 1-2 秒内可答出
- 主要视图（今日待办、历史回顾、搜索、回收站、设置）都需有清晰入口
- 归档项目有可进入的入口，但不占据日常视图的主位置

**视图清单**：

| 视图 | 层级 | 说明 |
|---|---|---|
| 今日待办 | 跨项目 | 按项目分组展示**今日需关注的任务**，筛选规则：`status != 'done'` 且（`due_date ≤ today` 或 `start_date ≤ today`）。即：所有已到达开始日或已经到期的未完成任务 |
| 项目内 List | 项目内 | 按分组分节，每节内可按状态/优先级/日期排序 |
| 项目内 看板 | 项目内 | 按 3 态分三列 |
| 项目内 甘特图 | 项目内 | 展示有 start_date 和 due_date 的任务的时间跨度 |
| 跨项目 List | 跨项目 | 所有活跃项目任务汇总列表，支持按项目/状态/日期/标签筛选 |
| 跨项目 看板 | 跨项目 | 按 3 态分三列；卡片需显示所属项目名（项目之间的视觉区分方式由 UI 设计决定） |
| 历史回顾 | 跨项目 | 时间区间驱动，按项目分组 |

### 5.5 历史回顾（服务于周报）

**入口**：全局导航中的一级入口

**交互流程**：
1. 进入视图时默认选"本周"
2. 时间区间选择器：
   - 快捷按钮：**本周**、**本月**
   - 自定义：日期区间选择器
3. 视图内容：按项目分组，展示两部分：
   - **区间内完成的任务**：`completed_at` 落在区间内的任务
   - **仍在进行中的任务**：当前 `status='in_progress'` 的任务（快照当前状态，与区间无严格关联——是为了让用户在写周报时不遗漏"还在推进中"的工作；可通过附加过滤"仅显示 `updated_at` 在区间内的"收紧范围，V1 暂不做）
4. 开关：**包含归档项目**（默认关闭）

**用途**：用户参考此视图在外部工具（飞书/企业邮箱/钉钉）手写周报。**不**自动生成 markdown 或文本。

### 5.6 基础横向能力（V1 必做）

#### 5.6.1 全局搜索
- 从任意视图可快速唤出（需支持 Cmd+K 快捷键）
- 搜索范围：任务名、项目名、任务描述
- 结果分项目/任务两类，可跳转到对应详情

#### 5.6.2 软删除 + 回收站
- 项目/任务删除 → `deleted_at` 打上时间戳，从主视图消失
- 回收站视图：查看所有软删除项，可**恢复**或**彻底删除**
- 无自动过期清理（用户手动管理）

#### 5.6.3 自动数据备份
- **备份时机**：
  - 应用启动时（如距上次备份 > 24h）
  - 每日定时（默认凌晨 2:00，应用在后台时触发，应用未启动则跳过）
- **备份路径**：默认 `~/Documents/pm-backups/`，可在设置中修改
- **保留策略**：最近 30 份，超过自动清理最旧
- **备份命名**：`pm-YYYYMMDD-HHMMSS.db`

#### 5.6.4 截止日提醒
- 通过 macOS 系统通知（`tauri-plugin-notification`）
- 触发规则：
  - 任务 due_date 当天 09:00 → "今天到期：[任务名]（项目）"
  - 任务 due_date 前一天 18:00 → "明天到期：[任务名]（项目）"
- 已完成的任务不再提醒

#### 5.6.5 数据导出
- **格式**：
  - **JSON**：完整结构（所有表），便于未来迁移
  - **Markdown**：按项目分组的人类可读摘要
- **范围**：
  - 全部数据
  - 指定项目
  - 指定时间区间
- 导出到用户选择的文件路径

## 6. 数据模型

### 6.1 SQLite Schema

```sql
-- 项目
CREATE TABLE projects (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
  type         TEXT,
  start_date   TEXT,  -- ISO 8601 (YYYY-MM-DD)
  end_date     TEXT,
  archived_at  TEXT,
  deleted_at   TEXT,  -- 软删除
  created_at   TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 项目之间的关联
CREATE TABLE project_relations (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  from_project_id   INTEGER NOT NULL REFERENCES projects(id),
  to_project_id     INTEGER NOT NULL REFERENCES projects(id),
  relation_type     TEXT NOT NULL CHECK(relation_type IN ('successor','related')),
  note              TEXT,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 项目内部的任务分组（如"一期任务"、"二期任务"）
CREATE TABLE task_groups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id  INTEGER NOT NULL REFERENCES projects(id),
  name        TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 任务
CREATE TABLE tasks (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id      INTEGER NOT NULL REFERENCES projects(id),
  group_id        INTEGER REFERENCES task_groups(id),
  parent_task_id  INTEGER REFERENCES tasks(id),  -- 只允许一层：被引用者的 parent_task_id 必须为 NULL
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'not_started'
                    CHECK(status IN ('not_started','in_progress','done')),
  priority        TEXT CHECK(priority IN ('high','medium','low')),
  start_date      TEXT,
  due_date        TEXT,
  estimate_hours  REAL,
  description     TEXT,
  completed_at    TEXT,  -- status='done' 时自动 = now()；改回非 done 时清空
  deleted_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 标签字典
CREATE TABLE tags (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT NOT NULL UNIQUE,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 任务-标签 多对多
CREATE TABLE task_tags (
  task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, tag_id)
);

-- 任务附件/链接
CREATE TABLE task_attachments (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK(type IN ('link','file')),
  url_or_path  TEXT NOT NULL,
  label        TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 关键索引
CREATE INDEX idx_tasks_project       ON tasks(project_id)     WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_status        ON tasks(status)         WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_due_date      ON tasks(due_date)       WHERE deleted_at IS NULL;
CREATE INDEX idx_tasks_completed_at  ON tasks(completed_at)   WHERE deleted_at IS NULL;
CREATE INDEX idx_projects_status     ON projects(status)      WHERE deleted_at IS NULL;
```

### 6.2 关键设计决策

| # | 决策 | 理由 |
|---|---|---|
| D1 | **软删除用 `deleted_at` 时间戳**，所有主查询默认 `WHERE deleted_at IS NULL` | 回收站只需反向查询，简单 |
| D2 | **归档用 `status='archived'` + `archived_at` 时间戳** | 归档 ≠ 删除；允许可逆重启 |
| D3 | **子任务只允许一层嵌套** | 无限嵌套会让 UI/查询复杂度爆炸，一层已覆盖"大任务拆分"场景 |
| D4 | **任务分组独立建表**，不复用标签 | 分组是结构化分节，标签是属性；语义不同 |
| D5 | **不使用 ORM，直接原生 SQL** | 数据模型简单；ORM 的学习/调试成本大于收益 |
| D6 | **不预留 activity_log 表** | V2 再加迁移即可；YAGNI |
| D7 | **日期用 TEXT（ISO 8601）** | SQLite 无原生日期类型；字符串便于导出、可比较、时区安全 |

### 6.3 实现阶段需确认的小决策

- 软删除是否永久保留（默认：永不自动过期，用户自行清理）
- 附件"file"类型存的是路径还是拷贝一份到应用数据目录（默认：只存路径）
- 全局搜索是否支持 FTS5 全文检索（默认：V1 用 LIKE 足够，任务量级不需要 FTS5）

## 7. 架构

### 7.1 技术栈

| 层 | 选型 |
|---|---|
| 桌面容器 | Tauri 2.x |
| 后端语言 | Rust |
| 前端框架 | React 18 + TypeScript + Vite |
| UI 组件库 | shadcn/ui（Tailwind 底） |
| 数据访问 | `rusqlite` + 原生 SQL |
| 前端数据层 | TanStack Query（IPC 结果缓存 + 失效刷新） |
| 路由 | React Router |
| 日期工具 | date-fns |
| 图标 | lucide-react |
| 通知 | `tauri-plugin-notification` |
| 文件对话框 | `tauri-plugin-dialog` |
| 测试 | Vitest（前端）+ `cargo test`（后端） |
| 打包 | `tauri build` → `.dmg`（arm64） |

### 7.2 目录结构

```
pm/
├── src/                         # 前端（React + TS）
│   ├── features/
│   │   ├── projects/            # 项目 CRUD、归档、关联
│   │   ├── tasks/               # 任务 CRUD、状态流转、子任务、分组
│   │   ├── today/               # 今日待办
│   │   ├── history/             # 历史回顾
│   │   ├── search/              # 全局搜索
│   │   ├── trash/               # 回收站
│   │   ├── export/              # 导出
│   │   └── settings/            # 备份路径等设置
│   ├── components/
│   │   ├── ui/                  # shadcn/ui 基础组件
│   │   ├── layout/              # 全局布局相关组件（具体结构由 UI 设计决定）
│   │   └── views/               # List、Kanban、Gantt 通用组件
│   ├── lib/
│   │   ├── api.ts               # Tauri invoke 封装
│   │   ├── types.ts             # 全局 TS 类型
│   │   └── date.ts              # 日期工具
│   ├── App.tsx
│   └── main.tsx
├── src-tauri/                   # 后端（Rust）
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/            # Tauri IPC 命令
│   │   │   ├── projects.rs
│   │   │   ├── tasks.rs
│   │   │   ├── search.rs
│   │   │   ├── backup.rs
│   │   │   ├── export.rs
│   │   │   └── notifications.rs
│   │   ├── db/
│   │   │   ├── mod.rs
│   │   │   ├── migrations.rs
│   │   │   ├── projects.rs
│   │   │   └── tasks.rs
│   │   └── models.rs
│   ├── Cargo.toml
│   └── tauri.conf.json
├── docs/
│   └── spec.md
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

### 7.3 模块边界

- **前端 features/** 之间通过 react-router 跳转，不直接互相引用 hook/state
- **features/** 内部使用 TanStack Query 通过 `lib/api.ts` 调后端命令
- **lib/api.ts** 是前后端契约的唯一入口（所有 `invoke` 都在这里）
- **后端 commands/** 只做请求校验和参数转换，业务逻辑放 **db/** 模块
- **后端 db/** 每个 domain（projects、tasks）一个 .rs 文件，内部是纯函数 + `rusqlite::Connection`

### 7.4 数据流

```
React Component
   ↓ useQuery / useMutation
TanStack Query
   ↓ invoke("cmd_name", args)
Tauri IPC
   ↓
Rust command handler (src-tauri/src/commands/*)
   ↓
DB module (src-tauri/src/db/*)
   ↓ rusqlite
SQLite (~/Library/Application Support/pm/pm.db)
```

## 8. 关键用户旅程（User Journey）

> 以下描述**用户要达成的目标**与**系统要完成的动作**，不规定具体 UI 形式。具体交互设计由 UI 设计师决定。

### 8.1 新建任务
**用户目标**：快速录入一个任务
1. 用户在任意视图触发"新建任务"（需支持 Cmd+N 快捷键）
2. 系统提供录入界面
3. 必填：项目（若当前处于项目上下文则自动预选）、任务名
4. 选填字段：可全部留空
5. 提交后，新任务立即出现在当前视图

### 8.2 写周报
**用户目标**：回忆本周推进，用于在外部工具撰写周报
1. 用户进入"历史回顾"
2. 系统默认展示"本周"区间
3. 用户查看按项目分组的"本周完成任务 + 进行中任务"
4. 用户在外部工具（飞书/企业邮箱）手写周报，参考此视图内容
5. 用户可切换到"本月"做月报，或用自定义区间回顾任意时段

### 8.3 归档与重启
**用户目标**：把不再日常管理的项目移出主视图，必要时恢复
1. 用户在项目的操作界面触发"归档"
2. 确认后：项目状态变为 `archived`，从日常视图中消失
3. 用户可通过归档入口查看已归档项目
4. 需要重启：用户在归档入口触发"重启"，项目回到 `active` 状态

### 8.4 项目关联
**用户目标**：记录"二期源自一期"这类追溯关系
1. 用户在新建项目或项目管理流程中，可选择"关联到已有项目"
2. 选择源项目 + 关系类型（successor / related）
3. 两个项目的详情视图中都会显示该关联

### 8.5 全局搜索
**用户目标**：快速定位某个任务或项目
1. 用户从任意视图触发全局搜索（需支持 Cmd+K）
2. 输入关键字，系统实时展示匹配的项目和任务
3. 用户选中某条结果后，系统跳转到对应详情

## 9. 范围边界

### 9.1 V1 必做（本版本交付）
- 项目 CRUD + 归档/重启 + 项目间关联
- 任务 CRUD + 3 态流转 + 一层子任务 + 任务分组
- 视图：今日待办、项目内 List/看板/甘特图、跨项目 List/看板、历史回顾
- 全局搜索（至少支持 Cmd+K 唤出）
- 软删除 + 回收站
- 自动数据备份
- 截止日 macOS 通知
- 数据导出（JSON + Markdown）

### 9.2 V2 推迟（结构不预留，需要时再做迁移）
- 捕获类：Inbox、任务模板、周期任务、全局快捷键
- 效率类：批量操作、拖拽排序、自定义视图保存
- 追溯类：操作日志（`activity_log` 表）
- 通知类：每日晨间推送
- 拓展类：统计 Dashboard
- 场景类：决策、沟通、风险、阻塞记录

### 9.3 永不做
- 数据导入
- 实际工时打卡

## 10. 成功标准

**使用者视角**：
1. 打开应用 3 秒内能清楚回答"手上有哪些项目"（解决痛点 A）
2. 写周报时能通过历史回顾还原本周推进（解决痛点 C）
3. 启动冷启动 <1 秒，内存占用稳态 <150 MB
4. 连续使用 1 个月无数据丢失（软删除 + 自动备份生效）

**技术视角**：
1. SQLite 单文件完全可移植（复制 `.db` 即搬家）
2. JSON 导出包含所有数据，可作为未来迁移基础
3. 百级任务量下，所有 CRUD 查询 <100ms
4. 应用包 <30 MB（Tauri 目标）

## 11. 待定事项（不阻塞开发）

- App Icon 设计（实现期间用占位图标）
- 完整快捷键方案（V1 至少支持 Cmd+K 搜索、Cmd+N 新建任务，其他由 UI 设计补充）
- UI 主题（V1 跟随系统，其他留给 UI 设计师决定）
- 多语言（V1 只做中文）
- **整体 UI/UX 设计稿**（由 UI 设计师产出，本 spec 不含任何布局约束）

---

## 附录 A：决策变更记录

| 日期 | 决策 | 背景 |
|---|---|---|
| 2026-04-23 | 初版确认 | 11 轮需求澄清后锁定 V1 范围 |
| 2026-04-23 | 去除 UI 布局约束 | 用户要求把界面布局决策权交给 UI 设计师，spec 只定义功能和信息架构 |
