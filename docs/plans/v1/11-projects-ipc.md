# Task 11: 项目 CRUD（IPC 命令）

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

