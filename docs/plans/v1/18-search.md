# Task 18: 全局搜索（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/search.rs`、`src-tauri/src/commands/search.rs`

- [ ] **Step 1: DB 层**

  ```rust
  // src-tauri/src/db/search.rs
  use rusqlite::{params, Connection};
  use serde::Serialize;
  use crate::error::AppResult;
  use crate::models::{Project, Task};

  #[derive(Serialize)]
  #[serde(rename_all = "camelCase")]
  pub struct SearchResults {
      pub projects: Vec<Project>,
      pub tasks: Vec<Task>,
  }

  pub fn search(conn: &Connection, query: &str) -> AppResult<SearchResults> {
      let pattern = format!("%{}%", query.replace('%', "\\%").replace('_', "\\_"));

      let mut pstmt = conn.prepare(
          "SELECT * FROM projects WHERE deleted_at IS NULL AND name LIKE ?1 ESCAPE '\\' ORDER BY name LIMIT 20",
      )?;
      let projects: Vec<Project> = pstmt.query_map(params![pattern], crate::db::projects_row_helper)?
          .collect::<Result<_,_>>()?;

      let mut tstmt = conn.prepare(
          "SELECT * FROM tasks WHERE deleted_at IS NULL AND (name LIKE ?1 ESCAPE '\\' OR description LIKE ?1 ESCAPE '\\') ORDER BY updated_at DESC LIMIT 50",
      )?;
      let tasks: Vec<Task> = tstmt.query_map(params![pattern], crate::db::tasks_row_helper)?
          .collect::<Result<_,_>>()?;

      Ok(SearchResults { projects, tasks })
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::{in_memory_for_test, projects, tasks};

      #[test]
      fn search_matches_name() {
          let conn = in_memory_for_test();
          let p = projects::create(&conn, "ACME 二期", None, None, None).unwrap();
          tasks::create(&conn, tasks::TaskInput { project_id: p.id, name: "评审 PRD".into(), ..Default::default() }).unwrap();
          let r = search(&conn, "PRD").unwrap();
          assert_eq!(r.tasks.len(), 1);
          let r2 = search(&conn, "ACME").unwrap();
          assert_eq!(r2.projects.len(), 1);
      }
  }
  ```

- [ ] **Step 2: 在 `db/mod.rs` 导出 row helper**

  在 `src-tauri/src/db/mod.rs` 末尾加：

  ```rust
  pub(crate) fn projects_row_helper(row: &rusqlite::Row) -> rusqlite::Result<crate::models::Project> {
      Ok(crate::models::Project {
          id: row.get("id")?,
          name: row.get("name")?,
          status: row.get("status")?,
          r#type: row.get("type")?,
          start_date: row.get("start_date")?,
          end_date: row.get("end_date")?,
          archived_at: row.get("archived_at")?,
          deleted_at: row.get("deleted_at")?,
          created_at: row.get("created_at")?,
          updated_at: row.get("updated_at")?,
      })
  }

  pub(crate) fn tasks_row_helper(row: &rusqlite::Row) -> rusqlite::Result<crate::models::Task> {
      Ok(crate::models::Task {
          id: row.get("id")?,
          project_id: row.get("project_id")?,
          group_id: row.get("group_id")?,
          parent_task_id: row.get("parent_task_id")?,
          name: row.get("name")?,
          status: row.get("status")?,
          priority: row.get("priority")?,
          start_date: row.get("start_date")?,
          due_date: row.get("due_date")?,
          estimate_hours: row.get("estimate_hours")?,
          description: row.get("description")?,
          completed_at: row.get("completed_at")?,
          deleted_at: row.get("deleted_at")?,
          created_at: row.get("created_at")?,
          updated_at: row.get("updated_at")?,
      })
  }
  ```

  将 `db/projects.rs` 和 `db/tasks.rs` 里原有的 `row_to_project` / `row_to_task` 改为调用这两个 helper（或者删除本地私有版本，改用 `crate::db::projects_row_helper`）。

- [ ] **Step 3: 命令层**

  ```rust
  // src-tauri/src/commands/search.rs
  use tauri::State;
  use crate::db::{DbState, search::{self, SearchResults}};
  use crate::error::AppResult;

  #[tauri::command]
  pub fn search_all(db: State<'_, DbState>, query: String) -> AppResult<SearchResults> {
      let conn = db.0.lock().unwrap();
      search::search(&conn, &query)
  }
  ```

- [ ] **Step 4: 注册、测试、编译、Commit**

  ```bash
  cargo test search:: && cargo build
  git add -A && git commit -m "feat(backend): 全局搜索 + IPC"
  ```

