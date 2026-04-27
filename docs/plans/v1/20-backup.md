# Task 20: 自动备份

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

