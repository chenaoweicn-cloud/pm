# Task 13: 任务分组（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/task_groups.rs`、`src-tauri/src/commands/task_groups.rs`
- Modify: `db/mod.rs`、`commands/mod.rs`、`main.rs`

- [ ] **Step 1: DB 层实现（`src-tauri/src/db/task_groups.rs`）**

  ```rust
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::TaskGroup;

  fn row_to_group(row: &rusqlite::Row) -> rusqlite::Result<TaskGroup> {
      Ok(TaskGroup {
          id: row.get("id")?,
          project_id: row.get("project_id")?,
          name: row.get("name")?,
          sort_order: row.get("sort_order")?,
          created_at: row.get("created_at")?,
      })
  }

  pub fn create(conn: &Connection, project_id: i64, name: &str, sort_order: i64) -> AppResult<TaskGroup> {
      conn.execute(
          "INSERT INTO task_groups (project_id, name, sort_order) VALUES (?1,?2,?3)",
          params![project_id, name, sort_order],
      )?;
      let id = conn.last_insert_rowid();
      get(conn, id)
  }

  pub fn get(conn: &Connection, id: i64) -> AppResult<TaskGroup> {
      conn.query_row("SELECT * FROM task_groups WHERE id=?1", params![id], row_to_group)
          .map_err(Into::into)
  }

  pub fn list_for_project(conn: &Connection, project_id: i64) -> AppResult<Vec<TaskGroup>> {
      let mut stmt = conn.prepare(
          "SELECT * FROM task_groups WHERE project_id=?1 ORDER BY sort_order, created_at",
      )?;
      let rows = stmt.query_map(params![project_id], row_to_group)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn rename(conn: &Connection, id: i64, name: &str) -> AppResult<TaskGroup> {
      conn.execute("UPDATE task_groups SET name=?1 WHERE id=?2", params![name, id])?;
      get(conn, id)
  }

  pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
      // 不级联删任务，只把任务的 group_id 置空
      conn.execute("UPDATE tasks SET group_id=NULL WHERE group_id=?1", params![id])?;
      conn.execute("DELETE FROM task_groups WHERE id=?1", params![id])?;
      Ok(())
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::{in_memory_for_test, projects};

      #[test]
      fn create_and_list() {
          let conn = in_memory_for_test();
          let p = projects::create(&conn, "X", None, None, None).unwrap();
          create(&conn, p.id, "一期", 0).unwrap();
          create(&conn, p.id, "二期", 1).unwrap();
          let groups = list_for_project(&conn, p.id).unwrap();
          assert_eq!(groups.len(), 2);
          assert_eq!(groups[0].name, "一期");
      }
  }
  ```

- [ ] **Step 2: 命令层（`src-tauri/src/commands/task_groups.rs`）**

  ```rust
  use tauri::State;
  use crate::db::{DbState, task_groups};
  use crate::error::AppResult;
  use crate::models::TaskGroup;

  #[tauri::command]
  pub fn create_task_group(db: State<'_, DbState>, project_id: i64, name: String, sort_order: i64) -> AppResult<TaskGroup> {
      let conn = db.0.lock().unwrap();
      task_groups::create(&conn, project_id, &name, sort_order)
  }

  #[tauri::command]
  pub fn list_task_groups(db: State<'_, DbState>, project_id: i64) -> AppResult<Vec<TaskGroup>> {
      let conn = db.0.lock().unwrap();
      task_groups::list_for_project(&conn, project_id)
  }

  #[tauri::command]
  pub fn rename_task_group(db: State<'_, DbState>, id: i64, name: String) -> AppResult<TaskGroup> {
      let conn = db.0.lock().unwrap();
      task_groups::rename(&conn, id, &name)
  }

  #[tauri::command]
  pub fn delete_task_group(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      task_groups::delete(&conn, id)
  }
  ```

- [ ] **Step 3: 在 `db/mod.rs` 加 `pub mod task_groups;`，`commands/mod.rs` 加 `pub mod task_groups;`，`main.rs` 注册 4 个命令**

- [ ] **Step 4: 测试 + 编译**

  ```bash
  cargo test task_groups:: && cargo build
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add -A && git commit -m "feat(backend): 任务分组 CRUD + IPC"
  ```

