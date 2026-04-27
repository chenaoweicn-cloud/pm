# Task 1: 初始化 Tauri + React + TypeScript 工程

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

