# Task 17: 任务附件（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/attachments.rs`、`src-tauri/src/commands/attachments.rs`

- [ ] **Step 1: DB 层**

  ```rust
  // src-tauri/src/db/attachments.rs
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::TaskAttachment;

  fn row_to(r: &rusqlite::Row) -> rusqlite::Result<TaskAttachment> {
      Ok(TaskAttachment {
          id: r.get("id")?,
          task_id: r.get("task_id")?,
          r#type: r.get("type")?,
          url_or_path: r.get("url_or_path")?,
          label: r.get("label")?,
          created_at: r.get("created_at")?,
      })
  }

  pub fn create(conn: &Connection, task_id: i64, r#type: &str, url_or_path: &str, label: Option<&str>) -> AppResult<TaskAttachment> {
      conn.execute(
          "INSERT INTO task_attachments (task_id, type, url_or_path, label) VALUES (?1,?2,?3,?4)",
          params![task_id, r#type, url_or_path, label],
      )?;
      let id = conn.last_insert_rowid();
      conn.query_row("SELECT * FROM task_attachments WHERE id=?1", params![id], row_to).map_err(Into::into)
  }

  pub fn list_for_task(conn: &Connection, task_id: i64) -> AppResult<Vec<TaskAttachment>> {
      let mut stmt = conn.prepare("SELECT * FROM task_attachments WHERE task_id=?1 ORDER BY created_at")?;
      Ok(stmt.query_map(params![task_id], row_to)?.collect::<Result<_,_>>()?)
  }

  pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("DELETE FROM task_attachments WHERE id=?1", params![id])?;
      Ok(())
  }
  ```

- [ ] **Step 2: 命令层**

  ```rust
  // src-tauri/src/commands/attachments.rs
  use tauri::State;
  use crate::db::{DbState, attachments};
  use crate::error::AppResult;
  use crate::models::TaskAttachment;

  #[tauri::command]
  pub fn create_attachment(db: State<'_, DbState>, task_id: i64, r#type: String, url_or_path: String, label: Option<String>) -> AppResult<TaskAttachment> {
      let conn = db.0.lock().unwrap();
      attachments::create(&conn, task_id, &r#type, &url_or_path, label.as_deref())
  }

  #[tauri::command]
  pub fn list_attachments(db: State<'_, DbState>, task_id: i64) -> AppResult<Vec<TaskAttachment>> {
      let conn = db.0.lock().unwrap();
      attachments::list_for_task(&conn, task_id)
  }

  #[tauri::command]
  pub fn delete_attachment(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      attachments::delete(&conn, id)
  }
  ```

- [ ] **Step 3: 注册、编译、Commit**

  ```bash
  cargo build
  git add -A && git commit -m "feat(backend): 任务附件 CRUD + IPC"
  ```

