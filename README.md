# pm · 个人项目管理工具

面向个人使用的 Mac 桌面项目管理应用，服务于“项目经理 + 业务顾问”工作流。

核心目标：
- 统一管理多个并行项目和任务，随时回答“手上现在有哪些项目、每个项目推进到哪了”
- 提供按时间区间回看的历史视图，支持周报整理

## 当前状态

当前仓库已经不是“前端原型”阶段，而是一个可运行的 Tauri + React + SQLite 桌面应用。

已具备：
- 活跃项目列表、项目详情、今日待办、跨项目任务、历史回顾、回收站、设置
- 项目创建 / 编辑 / 归档 / 删除 / 恢复
- 任务创建 / 编辑 / 状态流转 / 删除 / 恢复
- 全局搜索（`⌘K`）
- 本地 SQLite 存储
- 自动备份、JSON 导出、Markdown 导出
- 项目看板、项目时间轴

近期已收口：
- 导出路径兼容与默认值修复
- 小窗口下的内容滚动与弹窗滚动
- 看板列间迁移按钮
- 表单可访问性标签补全
- 移除“项目关联”前端功能

## 技术栈

- 前端：Vite 5 · React 18 · TypeScript 5
- 桌面端：Tauri 2
- 后端：Rust
- 数据库：SQLite（`rusqlite`）
- 数据请求：TanStack Query v5
- 测试：Vitest · cargo test
- 包管理：pnpm

## 文档

- 需求规格：[docs/spec.md](docs/spec.md)

说明：
- `docs/spec.md` 仍然是功能范围的主要参考
- 旧的 agent 执行计划文档已经从公开源码中移除，避免上传历史过程资料

## 本地开发

安装依赖：

```bash
pnpm install
```

前端开发：

```bash
pnpm dev
```

Tauri 桌面联调：

```bash
pnpm tauri dev
```

类型检查与构建：

```bash
pnpm typecheck
pnpm build
cd src-tauri && cargo check
```

测试：

```bash
pnpm test:run
cd src-tauri && cargo test
```

## 打包

生成桌面安装包：

```bash
pnpm tauri build
```

在 macOS 上会生成 `.app`，通常也会生成 `.dmg`。

发布前建议先确认：
- `src-tauri/tauri.conf.json` 中的 `identifier` 是否为正式值
- 图标、应用名、版本号是否已经确认
- 是否需要代码签名和 notarization

## 数据位置

默认数据库：

```text
~/Library/Application Support/com.pm.pm/pm.db
```

默认备份目录：

```text
~/Documents/pm-backups/
```

默认导出文件：

```text
~/Documents/pm-export.json
~/Documents/pm-this-month.md
```

## 目录概览

```text
src/
  components/layout/    应用壳、侧边栏、工具栏
  components/ui/        通用行、卡片、统计块等
  features/today/       今日待办
  features/tasks/       跨项目任务、任务表单、任务 hooks
  features/history/     历史回顾
  features/projects/    项目详情、列表/看板/时间轴、项目表单
  features/search/      全局搜索
  features/trash/       回收站
  features/settings/    备份与导出设置
  lib/                  类型、API 契约、日期工具、Query 配置

src-tauri/
  src/commands/         Tauri 命令入口
  src/db/               SQLite 访问层
  src/models.rs         Rust 数据模型
  tauri.conf.json       应用与打包配置
```

## 当前已知说明

- `pnpm dev` 只能看前端界面；要验证真实数据链路，请使用 `pnpm tauri dev`
- 当前仓库是单机本地优先设计，不包含云同步、多用户协作和账号体系
- 一些旧计划文档里仍保留“后端未开始”的描述，那些内容已经不再准确
# pm
# pm
