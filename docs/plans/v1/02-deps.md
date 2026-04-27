# Task 2: 安装核心依赖

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

