# Task 7: 定义 Rust 错误类型

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

