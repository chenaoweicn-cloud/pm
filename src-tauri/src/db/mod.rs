pub mod migrations;
pub mod project_relations;
pub mod projects;
pub mod tags;
pub mod task_groups;
pub mod tasks;

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
