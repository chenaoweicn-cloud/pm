# Task 10: 项目 CRUD（DB 层）

**Files:**
- Create: `src-tauri/src/db/projects.rs`
- Modify: `src-tauri/src/db/mod.rs`

- [ ] **Step 1: 写失败测试**

  创建 `src-tauri/src/db/projects.rs`：

  ```rust
  use rusqlite::{params, Connection};
  use crate::error::AppResult;
  use crate::models::Project;

  pub fn create(conn: &Connection, name: &str, r#type: Option<&str>, start_date: Option<&str>, end_date: Option<&str>) -> AppResult<Project> {
      todo!()
  }

  pub fn list_active(conn: &Connection) -> AppResult<Vec<Project>> {
      todo!()
  }

  pub fn get(conn: &Connection, id: i64) -> AppResult<Project> {
      todo!()
  }

  pub fn update(conn: &Connection, id: i64, name: &str, r#type: Option<&str>, start_date: Option<&str>, end_date: Option<&str>) -> AppResult<Project> {
      todo!()
  }

  pub fn archive(conn: &Connection, id: i64) -> AppResult<()> {
      todo!()
  }

  pub fn unarchive(conn: &Connection, id: i64) -> AppResult<()> {
      todo!()
  }

  pub fn soft_delete(conn: &Connection, id: i64) -> AppResult<()> {
      todo!()
  }

  pub fn list_archived(conn: &Connection) -> AppResult<Vec<Project>> {
      todo!()
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use crate::db::in_memory_for_test;

      #[test]
      fn create_and_get() {
          let conn = in_memory_for_test();
          let p = create(&conn, "Test Project", Some("售前"), None, None).unwrap();
          assert_eq!(p.name, "Test Project");
          assert_eq!(p.status, "active");
          let got = get(&conn, p.id).unwrap();
          assert_eq!(got.id, p.id);
      }

      #[test]
      fn archive_and_unarchive() {
          let conn = in_memory_for_test();
          let p = create(&conn, "X", None, None, None).unwrap();
          archive(&conn, p.id).unwrap();
          assert!(list_active(&conn).unwrap().is_empty());
          assert_eq!(list_archived(&conn).unwrap().len(), 1);
          unarchive(&conn, p.id).unwrap();
          assert_eq!(list_active(&conn).unwrap().len(), 1);
      }

      #[test]
      fn soft_delete_hides_from_both_lists() {
          let conn = in_memory_for_test();
          let p = create(&conn, "X", None, None, None).unwrap();
          soft_delete(&conn, p.id).unwrap();
          assert!(list_active(&conn).unwrap().is_empty());
          assert!(list_archived(&conn).unwrap().is_empty());
      }
  }
  ```

- [ ] **Step 2: 在 `db/mod.rs` 加入 `pub mod projects;`**

- [ ] **Step 3: 运行测试看失败**

  ```bash
  cd ~/Desktop/pm/src-tauri && cargo test projects::
  ```

  Expected: 3 测试因 `todo!()` 全部 panic。

- [ ] **Step 4: 实现各函数**

  替换 `src-tauri/src/db/projects.rs` 中的 `todo!()` 为实际实现：

  ```rust
  fn row_to_project(row: &rusqlite::Row) -> rusqlite::Result<Project> {
      Ok(Project {
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

  pub fn create(conn: &Connection, name: &str, r#type: Option<&str>, start_date: Option<&str>, end_date: Option<&str>) -> AppResult<Project> {
      conn.execute(
          "INSERT INTO projects (name, type, start_date, end_date) VALUES (?1, ?2, ?3, ?4)",
          params![name, r#type, start_date, end_date],
      )?;
      let id = conn.last_insert_rowid();
      get(conn, id)
  }

  pub fn list_active(conn: &Connection) -> AppResult<Vec<Project>> {
      let mut stmt = conn.prepare(
          "SELECT * FROM projects WHERE status='active' AND deleted_at IS NULL ORDER BY created_at DESC",
      )?;
      let rows = stmt.query_map([], row_to_project)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn list_archived(conn: &Connection) -> AppResult<Vec<Project>> {
      let mut stmt = conn.prepare(
          "SELECT * FROM projects WHERE status='archived' AND deleted_at IS NULL ORDER BY archived_at DESC",
      )?;
      let rows = stmt.query_map([], row_to_project)?.collect::<Result<_,_>>()?;
      Ok(rows)
  }

  pub fn get(conn: &Connection, id: i64) -> AppResult<Project> {
      conn.query_row(
          "SELECT * FROM projects WHERE id = ?1",
          params![id],
          row_to_project,
      ).map_err(Into::into)
  }

  pub fn update(conn: &Connection, id: i64, name: &str, r#type: Option<&str>, start_date: Option<&str>, end_date: Option<&str>) -> AppResult<Project> {
      conn.execute(
          "UPDATE projects SET name=?1, type=?2, start_date=?3, end_date=?4, updated_at=datetime('now') WHERE id=?5",
          params![name, r#type, start_date, end_date, id],
      )?;
      get(conn, id)
  }

  pub fn archive(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute(
          "UPDATE projects SET status='archived', archived_at=datetime('now'), updated_at=datetime('now') WHERE id=?1",
          params![id],
      )?;
      Ok(())
  }

  pub fn unarchive(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute(
          "UPDATE projects SET status='active', archived_at=NULL, updated_at=datetime('now') WHERE id=?1",
          params![id],
      )?;
      Ok(())
  }

  pub fn soft_delete(conn: &Connection, id: i64) -> AppResult<()> {
      conn.execute(
          "UPDATE projects SET deleted_at=datetime('now'), updated_at=datetime('now') WHERE id=?1",
          params![id],
      )?;
      Ok(())
  }
  ```

- [ ] **Step 5: 测试全绿**

  ```bash
  cargo test projects::
  ```

  Expected: 3 passed。

- [ ] **Step 6: Commit**

  ```bash
  cd ~/Desktop/pm && git add -A && git commit -m "feat(backend): 项目 CRUD + 归档/重启/软删 DB 层"
  ```

