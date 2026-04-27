# Task 8: 数据库连接与迁移（schema V1）

**Files:**
- Create: `src-tauri/src/db/mod.rs`、`src-tauri/src/db/migrations.rs`
- Modify: `src-tauri/src/main.rs`

- [ ] **Step 1: 创建 `src-tauri/src/db/migrations.rs`**（粘贴 spec §6.1 的完整 schema）

  ```rust
  use rusqlite::Connection;
  use crate::error::AppResult;

  pub const SCHEMA_V1: &str = r#"
  CREATE TABLE IF NOT EXISTS projects (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    name         TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','archived')),
    type         TEXT,
    start_date   TEXT,
    end_date     TEXT,
    archived_at  TEXT,
    deleted_at   TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS project_relations (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    from_project_id   INTEGER NOT NULL REFERENCES projects(id),
    to_project_id     INTEGER NOT NULL REFERENCES projects(id),
    relation_type     TEXT NOT NULL CHECK(relation_type IN ('successor','related')),
    note              TEXT,
    created_at        TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_groups (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id  INTEGER NOT NULL REFERENCES projects(id),
    name        TEXT NOT NULL,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    project_id      INTEGER NOT NULL REFERENCES projects(id),
    group_id        INTEGER REFERENCES task_groups(id),
    parent_task_id  INTEGER REFERENCES tasks(id),
    name            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'not_started'
                      CHECK(status IN ('not_started','in_progress','done')),
    priority        TEXT CHECK(priority IN ('high','medium','low')),
    start_date      TEXT,
    due_date        TEXT,
    estimate_hours  REAL,
    description     TEXT,
    completed_at    TEXT,
    deleted_at      TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT NOT NULL UNIQUE,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_tags (
    task_id  INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    tag_id   INTEGER NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, tag_id)
  );

  CREATE TABLE IF NOT EXISTS task_attachments (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id      INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    type         TEXT NOT NULL CHECK(type IN ('link','file')),
    url_or_path  TEXT NOT NULL,
    label        TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_project       ON tasks(project_id)     WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_tasks_status        ON tasks(status)         WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_tasks_due_date      ON tasks(due_date)       WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_tasks_completed_at  ON tasks(completed_at)   WHERE deleted_at IS NULL;
  CREATE INDEX IF NOT EXISTS idx_projects_status     ON projects(status)      WHERE deleted_at IS NULL;
  "#;

  pub fn run_migrations(conn: &Connection) -> AppResult<()> {
      conn.execute("PRAGMA foreign_keys = ON", [])?;
      conn.execute_batch(SCHEMA_V1)?;
      Ok(())
  }
  ```

- [ ] **Step 2: 创建 `src-tauri/src/db/mod.rs`**

  ```rust
  pub mod migrations;

  use rusqlite::Connection;
  use std::path::PathBuf;
  use std::sync::Mutex;
  use crate::error::AppResult;

  pub struct DbState(pub Mutex<Connection>);

  pub fn resolve_db_path() -> PathBuf {
      let base = directories::ProjectDirs::from("com", "pm", "pm")
          .expect("cannot resolve project dirs");
      let dir = base.data_dir().to_path_buf();
      std::fs::create_dir_all(&dir).ok();
      dir.join("pm.db")
  }

  pub fn init_connection(path: &std::path::Path) -> AppResult<Connection> {
      let conn = Connection::open(path)?;
      migrations::run_migrations(&conn)?;
      Ok(conn)
  }

  #[cfg(test)]
  pub fn in_memory_for_test() -> Connection {
      let conn = Connection::open_in_memory().unwrap();
      migrations::run_migrations(&conn).unwrap();
      conn
  }
  ```

- [ ] **Step 3: 在 `src-tauri/src/main.rs` 添加**

  ```rust
  mod db;
  ```

  并在 `tauri::Builder` 中 manage DB state（暂时只初始化，不暴露命令）：

  ```rust
  fn main() {
      let db_path = db::resolve_db_path();
      let conn = db::init_connection(&db_path).expect("db init failed");

      tauri::Builder::default()
          .manage(db::DbState(std::sync::Mutex::new(conn)))
          .plugin(tauri_plugin_notification::init())
          .plugin(tauri_plugin_dialog::init())
          .plugin(tauri_plugin_fs::init())
          .run(tauri::generate_context!())
          .expect("error while running tauri application");
  }
  ```

- [ ] **Step 4: 写一个迁移单元测试**

  在 `src-tauri/src/db/migrations.rs` 末尾追加：

  ```rust
  #[cfg(test)]
  mod tests {
      use super::*;
      use rusqlite::Connection;

      #[test]
      fn migrations_create_all_tables() {
          let conn = Connection::open_in_memory().unwrap();
          run_migrations(&conn).unwrap();

          let tables: Vec<String> = conn
              .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
              .unwrap()
              .query_map([], |row| row.get(0))
              .unwrap()
              .collect::<Result<_, _>>()
              .unwrap();

          assert!(tables.contains(&"projects".to_string()));
          assert!(tables.contains(&"tasks".to_string()));
          assert!(tables.contains(&"task_groups".to_string()));
          assert!(tables.contains(&"project_relations".to_string()));
          assert!(tables.contains(&"tags".to_string()));
          assert!(tables.contains(&"task_tags".to_string()));
          assert!(tables.contains(&"task_attachments".to_string()));
      }
  }
  ```

- [ ] **Step 5: 运行测试**

  ```bash
  cd ~/Desktop/pm/src-tauri && cargo test
  ```

  Expected: 1 passed。

- [ ] **Step 6: Commit**

  ```bash
  cd ~/Desktop/pm && git add -A && git commit -m "feat(backend): SQLite 连接 + schema V1 迁移"
  ```

