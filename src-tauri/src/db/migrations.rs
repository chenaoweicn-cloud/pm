use crate::error::AppResult;
use rusqlite::Connection;

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

CREATE TABLE IF NOT EXISTS ai_models (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  display_name  TEXT NOT NULL,
  base_url      TEXT NOT NULL,
  model_name    TEXT NOT NULL,
  key_ref       TEXT NOT NULL UNIQUE,
  is_active     INTEGER NOT NULL DEFAULT 0 CHECK(is_active IN (0, 1)),
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_inbox_items (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  raw_input             TEXT NOT NULL,
  parsed_name           TEXT NOT NULL,
  parsed_description    TEXT,
  priority              TEXT CHECK(priority IN ('high','medium','low')),
  start_date            TEXT,
  due_date              TEXT,
  project_candidate_id  INTEGER REFERENCES projects(id),
  confidence            REAL NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'pending'
                          CHECK(status IN ('pending','converted','dismissed')),
  model_id              INTEGER REFERENCES ai_models(id),
  created_task_id       INTEGER REFERENCES tasks(id),
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_models_active
  ON ai_models(is_active);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_models_one_active
  ON ai_models(is_active)
  WHERE is_active = 1;

CREATE INDEX IF NOT EXISTS idx_ai_inbox_status
  ON ai_inbox_items(status, created_at);
"#;

pub fn run_migrations(conn: &Connection) -> AppResult<()> {
    conn.execute("PRAGMA foreign_keys = ON", [])?;
    conn.execute_batch(SCHEMA_V1)?;
    Ok(())
}

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
        assert!(tables.contains(&"ai_models".to_string()));
        assert!(tables.contains(&"ai_inbox_items".to_string()));
    }

    #[test]
    fn migrations_are_idempotent_for_ai_tables() {
        let conn = Connection::open_in_memory().unwrap();
        run_migrations(&conn).unwrap();
        run_migrations(&conn).unwrap();

        let ai_models: i64 = conn
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='ai_models'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        let ai_inbox_items: i64 = conn
            .query_row(
                "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='ai_inbox_items'",
                [],
                |row| row.get(0),
            )
            .unwrap();

        assert_eq!(ai_models, 1);
        assert_eq!(ai_inbox_items, 1);
    }
}
