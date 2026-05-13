# PM AI Inbox 与模型管理实施计划

- **版本**：V0.1
- **日期**：2026-05-13
- **状态**：待 UI 设计稿确认后实施
- **范围**：AI Inbox、模型管理、多模型选择、未归属任务暂存

---

## 1. 目标

本次迭代为 PM 桌面软件增加 AI 辅助录入能力，降低临时任务进入系统的摩擦。用户在软件打开后，通过应用内快捷键唤起 AI Inbox，输入自然语言，由 AI 识别任务内容并自动归入明确项目；无法明确归属的任务进入暂存任务模块，由用户后续手动归类。

本次不做系统全局快捷键，不内置任何 AI API Key，不自动创建项目，不自动修改或删除已有任务。

## 2. 总体清单

### 2.1 设计确认

- [ ] 生成 AI Inbox 快速录入弹窗设计图。
- [ ] 生成设置页 AI 模型管理设计图。
- [ ] 生成暂存任务视图设计图。
- [ ] 用户确认 UI 设计图后，锁定布局、入口、字段、交互状态。

### 2.2 数据模型

- [ ] 新增 `ai_models` 表，保存模型配置元数据。
- [ ] 新增 `ai_inbox_items` 表，保存 AI 暂存任务。
- [ ] API Key 保存到系统钥匙串，SQLite 不保存明文 Key。
- [ ] 增加迁移测试，确认新表和索引创建成功。

### 2.3 后端能力

- [ ] 新增模型 CRUD 命令。
- [ ] 新增当前模型切换命令。
- [ ] 新增 Keychain 保存、读取、删除能力。
- [ ] 新增 OpenAI-compatible Chat Completions 调用能力。
- [ ] 新增 AI 文本解析与任务路由能力。
- [ ] 新增暂存任务列表、归类、忽略命令。

### 2.4 前端能力

- [ ] `AppShell` 增加 AI Inbox 弹窗状态。
- [ ] 增加应用内快捷键 `Cmd/Ctrl+Shift+I`。
- [ ] `Toolbar` 增加 AI Inbox 入口按钮。
- [ ] `Sidebar` 增加“暂存任务”入口和 pending 数量。
- [ ] `SettingsView` 增加“AI 模型”管理区块。
- [ ] 新增 `src/features/ai` 功能目录。

### 2.5 测试与验收

- [ ] 编写 Rust 数据层测试。
- [ ] 编写 Rust AI 路由测试，使用 fake AI JSON，不依赖真实网络。
- [ ] 编写前端组件和交互测试。
- [ ] 运行 `pnpm test:run`。
- [ ] 运行 `pnpm run typecheck`。
- [ ] 运行 `cargo test`。
- [ ] 启动应用做手动验收。

---

## 3. 分步实施计划

### Step 1：UI 设计稿确认

在不修改代码的前提下，先产出一张或多张高保真 UI 设计图，覆盖三个核心界面：

1. AI Inbox 快速录入弹窗。
2. 设置页 AI 模型管理区块。
3. 暂存任务视图。

设计风格必须延续当前软件的方向：

- 轻量桌面工具，而不是 SaaS 后台。
- 左侧导航、顶部工具栏、安静的编辑感布局。
- 暖白背景、细边框、紧凑任务行、小型状态徽标。
- 不使用强装饰、渐变背景、大面积卡片堆叠。

**完成标准**：

- 用户明确确认 UI 设计稿可以进入实现。
- 设计中已经体现入口、主操作、错误态、空态和结果反馈。

### Step 2：数据库与类型建模

新增 AI 相关数据库表。

`ai_models` 用于保存用户配置的模型：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER | 主键 |
| display_name | TEXT | 用户可读名称 |
| base_url | TEXT | OpenAI-compatible Base URL |
| model_name | TEXT | 模型名称 |
| key_ref | TEXT | 系统钥匙串引用 |
| is_active | INTEGER | 是否当前使用模型 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

`ai_inbox_items` 用于保存暂存任务：

| 字段 | 类型 | 说明 |
|---|---|---|
| id | INTEGER | 主键 |
| raw_input | TEXT | 用户原始输入片段 |
| parsed_name | TEXT | AI 解析出的任务名 |
| parsed_description | TEXT | AI 解析出的描述 |
| priority | TEXT | high / medium / low，可空 |
| start_date | TEXT | YYYY-MM-DD，可空 |
| due_date | TEXT | YYYY-MM-DD，可空 |
| project_candidate_id | INTEGER | AI 认为最可能的项目，可空 |
| confidence | REAL | 0 到 1 的归类置信度 |
| status | TEXT | pending / converted / dismissed |
| model_id | INTEGER | 使用的模型 ID，可空 |
| created_task_id | INTEGER | 转成正式任务后的任务 ID，可空 |
| created_at | TEXT | 创建时间 |
| updated_at | TEXT | 更新时间 |

**完成标准**：

- 迁移可在新库和旧库上重复运行。
- 测试确认新表存在。
- active 模型最多只有一个。

### Step 3：模型管理后端

新增 `db/ai_models.rs` 和对应 command。

命令清单：

- `list_ai_models`
- `save_ai_model`
- `delete_ai_model`
- `set_active_ai_model`
- `get_active_ai_model`

保存规则：

- 新增第一个模型时，自动设为 active。
- 保存模型时如果传入 API Key，则写入系统钥匙串。
- 编辑模型时 API Key 为空表示不修改旧 Key。
- 删除模型时同步删除系统钥匙串里的 secret。
- 删除当前模型后，如果还有模型，则自动选择第一个模型为 active；否则没有 active 模型。

**完成标准**：

- 模型列表可新增、编辑、删除、切换。
- API Key 不出现在 SQLite。
- 重启应用后模型元数据仍存在，Key 可从系统钥匙串读取。

### Step 4：AI 调用与解析路由

新增 `commands/ai.rs` 中的 `ai_capture_tasks`。

输入：

- 用户自然语言文本。
- 当前日期。
- 当前 active 模型。
- 活跃项目列表。

AI 协议：

- 固定使用 OpenAI-compatible Chat Completions。
- 请求地址由 `base_url` 拼接 `/chat/completions`。
- 请求体包含 `model`、`messages`、`temperature` 和 JSON 输出约束。
- 响应必须解析为结构化任务数组。

路由规则：

- 一次输入可以生成多条任务。
- 每条任务独立判断。
- `confidence >= 0.8` 且匹配唯一活跃项目时，直接创建正式任务。
- 低置信度、没有项目、项目不唯一、字段不合法或创建失败时，进入 `ai_inbox_items`。
- AI 不创建项目，不编辑项目，不修改已有任务，不删除任务。

**完成标准**：

- 未配置 active 模型时返回可理解错误。
- AI JSON 解析失败时不写入正式任务。
- 多任务中部分成功、部分暂存时返回清晰摘要。

### Step 5：暂存任务后端

新增 `db/ai_inbox.rs` 和对应 command。

命令清单：

- `list_ai_inbox_items`
- `count_pending_ai_inbox_items`
- `convert_ai_inbox_item`
- `dismiss_ai_inbox_item`

归类规则：

- 用户选择项目后，可修改任务名、描述、优先级、开始日期、截止日期。
- 确认归类后调用现有任务创建逻辑。
- 成功后将暂存项状态改为 `converted`，并记录 `created_task_id`。
- 忽略后状态改为 `dismissed`。

**完成标准**：

- pending 项不会出现在正式任务列表。
- converted 项对应任务可在所属项目中看到。
- dismissed 项不再显示在默认待处理列表。

### Step 6：前端 AI Inbox

新增 `AiQuickInbox.tsx`。

入口：

- 应用内快捷键：`Cmd/Ctrl+Shift+I`。
- 工具栏按钮：`AI Inbox`。

状态：

- 未配置模型：提示去设置模型。
- 默认态：自然语言输入框、当前模型显示、提交按钮。
- 提交中：禁用输入和按钮，展示处理中状态。
- 成功态：展示已创建数量、进入暂存数量、失败数量。
- 错误态：展示错误原因和重试入口。

**完成标准**：

- 软件打开时可用快捷键唤起。
- 不做系统全局快捷键。
- 提交后刷新任务和暂存任务相关 query。

### Step 7：前端模型管理

在 `SettingsView` 中加入 `AiModelSettings`。

能力：

- 查看模型列表。
- 新增模型。
- 编辑模型。
- 删除模型。
- 设置当前模型。
- 保存 API Key。

UI 约束：

- API Key 输入框不回显已有 Key。
- 编辑时显示“留空则不修改已保存 Key”。
- 当前模型有明确标记。
- 删除当前模型时需要用户确认。

**完成标准**：

- 模型配置可完整增删改选。
- 保存后下次进入设置页仍能看到模型列表。
- 用户无法在界面看到明文旧 Key。

### Step 8：前端暂存任务视图

新增 `AiInboxView.tsx`。

入口：

- `Sidebar` 增加“暂存任务”。
- 显示 pending 数量。

能力：

- 查看 pending 暂存任务。
- 看到原始输入片段和 AI 解析字段。
- 选择项目。
- 修改任务名、描述、优先级、开始日期、截止日期。
- 确认归类。
- 忽略。

**完成标准**：

- 归类后正式任务出现在对应项目。
- 忽略后不再出现在 pending 列表。
- 暂存数量实时刷新。

### Step 9：测试用例

Rust 测试：

- migration 创建 `ai_models` 和 `ai_inbox_items`。
- 新增第一个模型自动 active。
- 切换 active 模型时只有一个 active。
- 编辑模型时空 API Key 不覆盖旧 Key。
- 删除模型后 active 回退正确。
- 暂存项 pending -> converted。
- 暂存项 pending -> dismissed。
- fake AI JSON：高置信直写。
- fake AI JSON：低置信暂存。
- fake AI JSON：无项目暂存。
- fake AI JSON：多任务混合。
- fake AI JSON：无模型报错。
- fake AI JSON：JSON 解析失败不创建任务。

前端测试：

- AI Inbox 无模型时显示去设置提示。
- AI Inbox 可输入自然语言并提交。
- AI Inbox 提交中禁用按钮。
- AI Inbox 显示成功摘要。
- 模型设置可新增模型。
- 模型设置可切换当前模型。
- 模型设置编辑时 Key 留空文案正确。
- 暂存任务可选择项目并确认归类。
- 暂存任务可忽略。

手动验收：

- 打开软件后按 `Cmd/Ctrl+Shift+I` 可以唤起 AI Inbox。
- 应用未聚焦时不要求唤起 AI Inbox。
- 配置模型后重启应用，模型仍存在。
- API Key 不显示明文。
- 输入明确项目的任务后，高置信任务进入对应项目。
- 输入未说明项目的任务后，任务进入暂存任务。
- 暂存任务归类后，任务进入对应项目。

### Step 10：自行验证命令

实现完成后必须运行：

```bash
pnpm test:run
pnpm run typecheck
cd src-tauri && cargo test
```

如需要手动验证桌面端：

```bash
pnpm tauri dev
```

---

## 4. 风险与处理

| 风险 | 处理 |
|---|---|
| 用户填写的 Base URL 不兼容 OpenAI 协议 | 保存时只做格式校验，实际调用失败时显示明确错误 |
| 模型返回非 JSON | 后端做严格解析，失败则不创建正式任务 |
| AI 错误归类 | 只有高置信且唯一项目才直写，其余进入暂存 |
| API Key 泄露 | Key 存入系统钥匙串，界面不回显旧 Key，SQLite 不保存明文 |
| 快捷键冲突 | 本次仅应用内快捷键，冲突影响范围低；后续可做可配置快捷键 |

## 5. 暂不实施

- 系统全局快捷键。
- 多厂商非 OpenAI-compatible 适配。
- AI 自动创建项目。
- AI 自动修改、删除或完成已有任务。
- AI 自动生成周报。
- 暂存任务拖拽归类。
