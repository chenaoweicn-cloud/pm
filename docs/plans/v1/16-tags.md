# Task 16: 标签管理（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/tags.rs`、`src-tauri/src/commands/tags.rs`

- [ ] **Step 1: DB 层（`src-tauri/src/db/tags.rs`）**

  ```rust
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::Tag;

  fn row_to_tag(r: &rusqlite::Row) -> rusqlite::Result<Tag> {
      Ok(Tag { id: r.get("id")?, name: r.get("name")?, created_at: r.get("created_at")? })
  }

  pub fn upsert(conn: &Connection, name: &str) -> AppResult<Tag> {
      conn.execute("INSERT OR IGNORE INTO tags (name) VALUES (?1)", params![name])?;
      conn.query_row("SELECT * FROM tags WHERE name=?1", params![name], row_to_tag).map_err(Into::into)
  }

  pub fn list_all(conn: &Connection) -> AppResult<Vec<Tag>> {
      let mut stmt = conn.prepare("SELECT * FROM tags ORDER BY name")?;
      Ok(stmt.query_map([], row_to_tag)?.collect::<Result<_,_>>()?)
  }

  pub fn list_for_task(conn: &Connection, task_id: i64) -> AppResult<Vec<Tag>> {
      let mut stmt = conn.prepare(
          "SELECT t.* FROM tags t JOIN task_tags tt ON t.id=tt.tag_id WHERE tt.task_id=?1 ORDER BY t.name",
      )?;
      Ok(stmt.query_map(params![task_id], row_to_tag)?.collect::<Result<_,_>>()?)
  }

  pub fn attach(conn: &Connection, task_id: i64, tag_id: i64) -> AppResult<()> {
      conn.execute("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?1,?2)", params![task_id, tag_id])?;
      Ok(())
  }

  pub fn detach(conn: &Connection, task_id: i64, tag_id: i64) -> AppResult<()> {
      conn.execute("DELETE FROM task_tags WHERE task_id=?1 AND tag_id=?2", params![task_id, tag_id])?;
      Ok(())
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::{in_memory_for_test, projects, tasks};

      #[test]
      fn upsert_attach_detach() {
          let conn = in_memory_for_test();
          let p = projects::create(&conn, "P", None, None, None).unwrap();
          let t = tasks::create(&conn, tasks::TaskInput { project_id: p.id, name: "X".into(), ..Default::default() }).unwrap();
          let tag = upsert(&conn, "urgent").unwrap();
          attach(&conn, t.id, tag.id).unwrap();
          assert_eq!(list_for_task(&conn, t.id).unwrap().len(), 1);
          detach(&conn, t.id, tag.id).unwrap();
          assert_eq!(list_for_task(&conn, t.id).unwrap().len(), 0);
      }
  }
  ```

- [ ] **Step 2: 命令层（`src-tauri/src/commands/tags.rs`）**

  ```rust
  use tauri::State;
  use crate::db::{DbState, tags};
  use crate::error::AppResult;
  use crate::models::Tag;

  #[tauri::command]
  pub fn upsert_tag(db: State<'_, DbState>, name: String) -> AppResult<Tag> {
      let conn = db.0.lock().unwrap();
      tags::upsert(&conn, &name)
  }

  #[tauri::command]
  pub fn list_tags(db: State<'_, DbState>) -> AppResult<Vec<Tag>> {
      let conn = db.0.lock().unwrap();
      tags::list_all(&conn)
  }

  #[tauri::command]
  pub fn list_tags_for_task(db: State<'_, DbState>, task_id: i64) -> AppResult<Vec<Tag>> {
      let conn = db.0.lock().unwrap();
      tags::list_for_task(&conn, task_id)
  }

  #[tauri::command]
  pub fn attach_tag(db: State<'_, DbState>, task_id: i64, tag_id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      tags::attach(&conn, task_id, tag_id)
  }

  #[tauri::command]
  pub fn detach_tag(db: State<'_, DbState>, task_id: i64, tag_id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      tags::detach(&conn, task_id, tag_id)
  }
  ```

- [ ] **Step 3: 注册、测试、编译、Commit**

  ```bash
  # 在 db/mod.rs 加 pub mod tags;
  # 在 commands/mod.rs 加 pub mod tags;
  # 在 main.rs 注册 5 个命令
  cargo test tags:: && cargo build
  git add -A && git commit -m "feat(backend): 标签 CRUD + IPC"
  ```

