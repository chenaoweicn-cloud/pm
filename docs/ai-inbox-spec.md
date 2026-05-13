# PM AI Inbox 与模型管理功能规格说明书

- **版本**：V0.1
- **日期**：2026-05-13
- **类型**：V1 后续迭代功能规格
- **技术栈**：Tauri 2.x + React + TypeScript + SQLite + macOS Keychain

---

## 1. 概述

AI Inbox 是 PM 软件的低摩擦任务录入能力。用户在软件打开后，通过应用内快捷键唤起输入框，输入自然语言任务描述。系统调用用户自行配置的 AI 模型，识别任务名称、日期、优先级、描述和所属项目。

识别结果按置信度处理：

1. 明确归属到唯一项目的高置信任务，自动写入对应项目。
2. 未说明项目、低置信度或无法安全写入的任务，进入暂存任务模块。
3. 用户在暂存任务中手动选择项目并确认归类。

## 2. 用户与场景

### 2.1 用户

主要用户为单人 PM / BA，在 Mac 桌面端管理多个项目和大量中小任务。

### 2.2 典型场景

| 编号 | 场景 | 期望结果 |
|---|---|---|
| AI-S1 | 用户正在软件内，突然想到一个任务 | 按快捷键打开 AI Inbox，输入自然语言，快速入库 |
| AI-S2 | 用户从会议记录复制一段待办 | AI 拆分为多条任务，明确项目的自动写入 |
| AI-S3 | 用户输入没有项目归属的任务 | 任务进入暂存任务，避免误归类 |
| AI-S4 | 用户更换 AI 服务商 | 在设置页新增模型并切换当前模型 |
| AI-S5 | 用户担心 Key 泄露 | API Key 不内置、不明文显示、不保存到 SQLite |

## 3. 功能范围

### 3.1 必做

- 应用内快捷键唤起 AI Inbox。
- 自然语言多任务识别。
- AI 模型管理。
- 多模型保存与当前模型选择。
- API Key 用户自行输入。
- API Key 存入系统钥匙串。
- 明确项目的高置信任务自动创建。
- 不明确项目的任务进入暂存任务。
- 暂存任务手动归类为正式任务。
- 测试用例与自行验证。

### 3.2 不做

- 系统全局快捷键。
- 内置 AI API Key。
- 云同步模型配置。
- 非 OpenAI-compatible 协议适配。
- AI 自动创建项目。
- AI 自动修改已有任务。
- AI 自动删除任务。
- AI 自动完成任务。
- AI 自动生成周报。

## 4. 信息架构

### 4.1 新增入口

| 入口 | 位置 | 说明 |
|---|---|---|
| AI Inbox 快捷键 | 应用内 | `Cmd/Ctrl+Shift+I` |
| AI Inbox 按钮 | 顶部工具栏 | 鼠标可点击入口 |
| 暂存任务 | 左侧导航 | 显示 pending 数量 |
| AI 模型 | 设置页 | 模型管理区块 |

### 4.2 新增视图和组件

| 名称 | 类型 | 说明 |
|---|---|---|
| AI Inbox 弹窗 | modal | 快速自然语言录入 |
| AI 模型管理 | settings section | 管理模型配置和当前模型 |
| 暂存任务视图 | main view | 管理未归属任务 |

## 5. 详细功能需求

### 5.1 AI Inbox 快速录入

#### 5.1.1 唤起方式

- 用户在软件打开后，可按 `Cmd/Ctrl+Shift+I` 唤起 AI Inbox。
- 快捷键只要求应用内可用，不要求在其他软件中全局唤起。
- 用户也可以点击工具栏中的 AI Inbox 按钮。

#### 5.1.2 输入

用户可以输入一段自然语言文本，例如：

```text
把 A 项目的验收材料周五前整理完；B 项目明天提醒客户确认原型；还要找时间整理会议纪要
```

系统应支持从一段文本中识别多条任务。

#### 5.1.3 输出

提交后展示结果摘要：

- 已创建任务数量。
- 已进入暂存数量。
- 失败数量。
- 每条结果的任务名和目标位置。

#### 5.1.4 状态

| 状态 | 行为 |
|---|---|
| 未配置模型 | 显示提示，引导进入设置页 |
| 默认 | 可输入文本并提交 |
| 提交中 | 禁用输入和按钮，显示处理中 |
| 成功 | 显示处理摘要 |
| 失败 | 显示错误原因，可重试 |

### 5.2 AI 模型管理

#### 5.2.1 模型字段

| 字段 | 必填 | 说明 |
|---|---|---|
| 显示名称 | 是 | 用户自定义名称，如 DeepSeek、OpenAI、公司代理 |
| Base URL | 是 | OpenAI-compatible 服务地址 |
| 模型名称 | 是 | 实际调用的模型名 |
| API Key | 新增时是，编辑时可空 | 用户自行输入 |

#### 5.2.2 模型列表

- 用户可以保存多个模型。
- 用户可以选择当前使用模型。
- 当前模型在列表中有明显标记。
- 第一个新增模型自动成为当前模型。

#### 5.2.3 API Key 规则

- 软件不内置 API Key。
- 用户必须自行输入 API Key。
- API Key 保存到系统钥匙串。
- SQLite 不保存 API Key 明文。
- 编辑模型时，API Key 输入框不回显已有 Key。
- 编辑模型时，API Key 留空表示不修改旧 Key。
- 删除模型时，应删除对应钥匙串 secret。

### 5.3 AI 语义识别

#### 5.3.1 输入上下文

调用 AI 时应带入：

- 当前日期。
- 活跃项目列表。
- 允许输出的任务字段。
- 用户原始输入。

#### 5.3.2 输出字段

AI 每条任务应输出：

| 字段 | 说明 |
|---|---|
| name | 任务名称 |
| description | 任务描述，可空 |
| projectId | 匹配到的项目 ID，可空 |
| priority | high / medium / low，可空 |
| startDate | YYYY-MM-DD，可空 |
| dueDate | YYYY-MM-DD，可空 |
| confidence | 0 到 1 的项目归属置信度 |
| rawText | 对应的原始文本片段 |

#### 5.3.3 路由规则

| 条件 | 处理 |
|---|---|
| `confidence >= 0.8` 且 `projectId` 是唯一活跃项目 | 创建正式任务 |
| `projectId` 为空 | 进入暂存任务 |
| `confidence < 0.8` | 进入暂存任务 |
| 项目不存在或已归档 | 进入暂存任务 |
| 任务名称为空 | 进入暂存任务或失败 |
| 正式任务创建失败 | 进入暂存任务并记录错误上下文 |

### 5.4 暂存任务

#### 5.4.1 列表

暂存任务默认只显示 `pending` 状态。

每条暂存任务显示：

- 原始输入片段。
- AI 解析出的任务名。
- 描述。
- 日期。
- 优先级。
- 候选项目。
- 置信度。
- 创建时间。

#### 5.4.2 归类

用户可以为暂存任务选择项目，并可修改：

- 任务名称。
- 描述。
- 优先级。
- 开始日期。
- 截止日期。

确认后创建正式任务，并将暂存项状态更新为 `converted`。

#### 5.4.3 忽略

用户可以忽略暂存项。忽略后状态更新为 `dismissed`，不再显示在默认 pending 列表中。

## 6. 数据规格

### 6.1 `ai_models`

```sql
CREATE TABLE IF NOT EXISTS ai_models (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name  TEXT NOT NULL,
  base_url      TEXT NOT NULL,
  model_name    TEXT NOT NULL,
  key_ref       TEXT NOT NULL UNIQUE,
  is_active     INTEGER NOT NULL DEFAULT 0 CHECK(is_active IN (0, 1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 6.2 `ai_inbox_items`

```sql
CREATE TABLE IF NOT EXISTS ai_inbox_items (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_input             TEXT NOT NULL,
  parsed_name           TEXT NOT NULL,
  parsed_description    TEXT,
  priority              TEXT CHECK(priority IN ('high','medium','low')),
  start_date            TEXT,
  due_date              TEXT,
  project_candidate_id  INTEGER REFERENCES projects(id),
  confidence            REAL NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pending','converted','dismissed')),
  model_id              INTEGER REFERENCES ai_models(id),
  created_task_id       INTEGER REFERENCES tasks(id),
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 6.3 索引

```sql
CREATE INDEX IF NOT EXISTS idx_ai_models_active
  ON ai_models(is_active);

CREATE INDEX IF NOT EXISTS idx_ai_inbox_status
  ON ai_inbox_items(status, created_at);
```

## 7. Tauri Commands

### 7.1 模型管理

| Command | 输入 | 输出 |
|---|---|---|
| `list_ai_models` | 无 | `AiModel[]` |
| `save_ai_model` | 模型字段和可选 API Key | `AiModel` |
| `delete_ai_model` | `id` | `void` |
| `set_active_ai_model` | `id` | `void` |
| `get_active_ai_model` | 无 | `AiModel \| null` |

### 7.2 AI Inbox

| Command | 输入 | 输出 |
|---|---|---|
| `ai_capture_tasks` | `text` | `AiCaptureResult` |
| `list_ai_inbox_items` | 可选 status | `AiInboxItem[]` |
| `count_pending_ai_inbox_items` | 无 | `number` |
| `convert_ai_inbox_item` | 暂存项 ID 和任务字段 | `Task` |
| `dismiss_ai_inbox_item` | `id` | `void` |

## 8. 前端类型

### 8.1 `AiModel`

```ts
export interface AiModel {
  id: number
  displayName: string
  baseUrl: string
  modelName: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}
```

### 8.2 `AiInboxItem`

```ts
export interface AiInboxItem {
  id: number
  rawInput: string
  parsedName: string
  parsedDescription: string | null
  priority: Priority | null
  startDate: string | null
  dueDate: string | null
  projectCandidateId: number | null
  confidence: number
  status: 'pending' | 'converted' | 'dismissed'
  modelId: number | null
  createdTaskId: number | null
  createdAt: string
  updatedAt: string
}
```

### 8.3 `AiCaptureResult`

```ts
export interface AiCaptureResult {
  created: Task[]
  inboxItems: AiInboxItem[]
  failed: Array<{
    rawInput: string
    reason: string
  }>
}
```

## 9. 测试规格

### 9.1 后端测试

- 迁移创建 `ai_models`。
- 迁移创建 `ai_inbox_items`。
- 新增第一个模型自动 active。
- 切换 active 模型后只有一个 active。
- 编辑模型时空 API Key 不覆盖旧 Key。
- 删除模型时删除钥匙串引用。
- 删除当前模型后 active 回退。
- 暂存任务可创建。
- 暂存任务可 converted。
- 暂存任务可 dismissed。
- fake AI JSON 高置信任务直写。
- fake AI JSON 低置信任务暂存。
- fake AI JSON 无项目任务暂存。
- fake AI JSON 多任务混合处理。
- 无 active 模型时报错。
- AI JSON 解析失败不创建正式任务。

### 9.2 前端测试

- AI Inbox 无模型时显示设置引导。
- AI Inbox 可以输入自然语言。
- AI Inbox 提交时按钮禁用。
- AI Inbox 成功后显示摘要。
- 模型管理可以新增模型。
- 模型管理可以切换当前模型。
- 模型管理编辑时 API Key 不回显。
- 暂存任务列表显示 pending 项。
- 暂存任务可以选择项目后归类。
- 暂存任务可以忽略。

### 9.3 手动验收

- 打开软件后，按 `Cmd/Ctrl+Shift+I` 唤起 AI Inbox。
- 点击工具栏 AI Inbox 按钮可唤起。
- 应用外部不要求快捷键唤起。
- 配置模型后重启应用，模型仍存在。
- API Key 不显示明文。
- 明确项目任务能进入对应项目。
- 未明确项目任务进入暂存任务。
- 暂存任务归类后出现在对应项目。

## 10. 缺失核对表

实现完成后，用下表核对是否遗漏。

| 编号 | 核对项 | 状态 |
|---|---|---|
| C1 | 应用内快捷键存在 | 待核对 |
| C2 | 工具栏入口存在 | 待核对 |
| C3 | 模型列表存在 | 待核对 |
| C4 | 可新增模型 | 待核对 |
| C5 | 可编辑模型 | 待核对 |
| C6 | 可删除模型 | 待核对 |
| C7 | 可切换当前模型 | 待核对 |
| C8 | API Key 不保存到 SQLite | 待核对 |
| C9 | API Key 不回显 | 待核对 |
| C10 | AI 支持多任务解析 | 待核对 |
| C11 | 高置信任务自动创建 | 待核对 |
| C12 | 低置信任务进入暂存 | 待核对 |
| C13 | 无项目任务进入暂存 | 待核对 |
| C14 | 暂存任务入口存在 | 待核对 |
| C15 | 暂存任务 pending 数量存在 | 待核对 |
| C16 | 暂存任务可归类 | 待核对 |
| C17 | 暂存任务可忽略 | 待核对 |
| C18 | 测试已补充 | 待核对 |
| C19 | 自动测试已通过 | 待核对 |
| C20 | 手动验收已完成 | 待核对 |
