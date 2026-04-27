# Task 12: 项目关联（DB + IPC）

**Files:**
- Create: `src-tauri/src/db/project_relations.rs`
- Create: `src-tauri/src/commands/project_relations.rs`
- Modify: `src-tauri/src/db/mod.rs`、`src-tauri/src/commands/mod.rs`、`src-tauri/src/main.rs`

- [ ] **Step 1: 写 DB 层测试**（`src-tauri/src/db/project_relations.rs`）

  ```rust
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::ProjectRelation;

  pub fn create(conn: &Connection, from_id: i64, to_id: i64, relation_type: &str, note: Option<&str>) -> AppResult<ProjectRelation> {
      conn.execute(
          "INSERT INTO project_relations (from_project_id, to_project_id, relation_type, note) VALUES (?1,?2,?3,?4)",
          params![from_id, to_id, relation_type, note],
      )?;
      let id = conn.last_insert_rowid();
      get(conn, id)
  }

  pub fn get(conn: &Connection, id: i64) -> AppResult<ProjectRelation> {
      conn.query_row(
          "SELECT * FROM project_relations WHERE id=?1",
          params![id],
          |r| Ok(ProjectRelation {
              id: r.get("id")?,
              from_project_id: r.get("from_project_id")?,
              to_project_id: r.get("to_project_id")?,
              relation_type: r.get("relation_type")?,
              note: r.get("note")?,
              created_at: r.get("created_at")?,
          }),
      ).map_err(Into::into)
  }

  pub fn list_for_project(conn: &Connection, project_id: i64) -> AppResult<Vec<ProjectRelation>> {
      let mut stmt = conn.prepare(
          "SELECT * FROM project_relations WHERE from_project_id=?1 OR to_project_id=?1 ORDER BY created_at DESC",
      )?;
      let rows = stmt.query_map(params![project_id], |r| Ok(ProjectRelation {
          id: r.get("id")?,
          from_project_id: r.get("from_project_id")?,
          to_project_id: r.get("to_project_id")?,
          relation_type: r.get("relation_type")?,
          note: r.get("note")?,
          created_at: r.get("created_at")?,
      }))?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute("DELETE FROM project_relations WHERE id=?1", params![id])?;
      Ok(())
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::{in_memory_for_test, projects};

      #[test]
      fn create_and_list() {
          let conn = in_memory_for_test();
          let p1 = projects::create(&conn, "一期", None, None, None).unwrap();
          let p2 = projects::create(&conn, "二期", None, None, None).unwrap();
          create(&conn, p2.id, p1.id, "successor", Some("二期源自一期")).unwrap();
          let rels = list_for_project(&conn, p1.id).unwrap();
          assert_eq!(rels.len(), 1);
          assert_eq!(rels[0].relation_type, "successor");
      }
  }
  ```

- [ ] **Step 2: 在 `db/mod.rs` 加入 `pub mod project_relations;`**

- [ ] **Step 3: 创建命令层 `src-tauri/src/commands/project_relations.rs`**

  ```rust
  use tauri::State;
  use crate::db::{DbState, project_relations};
  use crate::error::AppResult;
  use crate::models::ProjectRelation;

  #[tauri::command]
  pub fn create_project_relation(db: State<'_, DbState>, from_id: i64, to_id: i64, relation_type: String, note: Option<String>) -> AppResult<ProjectRelation> {
      let conn = db.0.lock().unwrap();
      project_relations::create(&conn, from_id, to_id, &relation_type, note.as_deref())
  }

  #[tauri::command]
  pub fn list_project_relations(db: State<'_, DbState>, project_id: i64) -> AppResult<Vec<ProjectRelation>> {
      let conn = db.0.lock().unwrap();
      project_relations::list_for_project(&conn, project_id)
  }

  #[tauri::command]
  pub fn delete_project_relation(db: State<'_, DbState>, id: i64) -> AppResult<()> {
      let conn = db.0.lock().unwrap();
      project_relations::delete(&conn, id)
  }
  ```

- [ ] **Step 4: 在 `commands/mod.rs` 加入 `pub mod project_relations;`，在 `main.rs` 注册三个命令**

- [ ] **Step 5: 测试 + 编译**

  ```bash
  cargo test project_relations:: && cargo build
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add -A && git commit -m "feat(backend): 项目关联 CRUD + IPC"
  ```

