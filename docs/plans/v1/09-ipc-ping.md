# Task 9: 打通首个 IPC 命令（ping）

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

