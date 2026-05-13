pub mod ai;
pub mod attachments;
pub mod backup;
pub mod export;
pub mod notifications;
pub mod project_relations;
pub mod projects;
pub mod search;
pub mod tags;
pub mod task_groups;
pub mod tasks;
pub mod trash;

use crate::db::DbState;
use crate::error::AppResult;
use tauri::State;

#[tauri::command]
pub fn ping(db: State<'_, DbState>) -> AppResult<String> {
    let conn = db.0.lock().unwrap();
    let count: i64 = conn.query_row("SELECT count(*) FROM projects", [], |row| row.get(0))?;
    Ok(format!("pong: {} projects in db", count))
}
