# Task 19: 回收站（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/trash.rs`、`src-tauri/src/commands/trash.rs`

- [ ] **Step 1: DB 层**

  ```rust
  // src-tauri/src/db/trash.rs
  use rusqlite::{params, Connection};
  use serde::Serialize;
  use crate::error::AppResult;
  use crate::models::{Project, Task};

  #[derive(Serialize)]
  #[serde(rename_all = "camelCase")]
  pub struct TrashItems {
      pub projects: Vec<Project>,
      pub tasks: Vec<Task>,
  }

  pub fn list(conn: &Connection) -> AppResult<TrashItems> {
      let mut ps = conn.prepare("SELECT * FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")?;
      let projects: Vec<Project> = ps.query_map([], crate::db::projects_row_helper)?.collect::<Result<_,_>>()?;
      let mut ts = conn.prepare("SELECT * FROM tasks WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")?;
      let tasks: Vec<Task> = ts.query_map([], crate::db::tasks_row_helper)?.collect::<Result<_,_>>()?;
      Ok(TrashItems { projects, tasks })
  }

  pub fn restore_project(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("UPDATE projects SET deleted_at=NULL, updated_at=datetime('now') WHERE id=?1", params![id])?;
      Ok(())
  }

  pub fn restore_task(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("UPDATE tasks SET deleted_at=NULL, updated_at=datetime('now') WHERE id=?1", params![id])?;
      Ok(())
  }

  pub fn purge_project(conn: &Connection, id: i64) -> AppResult<()> {
      // 先硬删该项目下所有软删任务
      conn.execute("DELETE FROM tasks WHERE project_id=?1", params![id])?;
      conn.execute("DELETE FROM project_relations WHERE from_project_id=?1 OR to_project_id=?1", params![id])?;
      conn.execute("DELETE FROM task_groups WHERE project_id=?1", params![id])?;
      conn.execute("DELETE FROM projects WHERE id=?1", params![id])?;
      Ok(())
  }

  pub fn purge_task(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("DELETE FROM tasks WHERE id=?1", params![id])?;
      Ok(())
  }
  ```

- [ ] **Step 2: 命令层**

  ```rust
  // src-tauri/src/commands/trash.rs
  use tauri::State;
  use crate::db::{DbState, trash::{self, TrashItems}};
  use crate::error::AppResult;

  #[tauri::command]
  pub fn list_trash(db: State<'_, DbState>) -> AppResult<TrashItems> {
      let conn = db.0.lock().unwrap();
      trash::list(&conn)
  }

  #[tauri::command]
  pub fn restore_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      trash::restore_project(&conn, id)
  }

  #[tauri::command]
  pub fn restore_task(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      trash::restore_task(&conn, id)
  }

  #[tauri::command]
  pub fn purge_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      trash::purge_project(&conn, id)
  }

  #[tauri::command]
  pub fn purge_task(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      trash::purge_task(&conn, id)
  }
  ```

- [ ] **Step 3: 注册、编译、Commit**

  ```bash
  cargo build
  git add -A && git commit -m "feat(backend): 回收站（列表/恢复/彻底删除）+ IPC"
  ```

