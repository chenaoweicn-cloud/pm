pub mod project_relations;
pub mod projects;
pub mod task_groups;

use tauri::State;
use crate::db::DbState;
use crate::error::AppResult;

#[tauri::command]
pub fn ping(db: State<'_, DbState>) -> AppResult<String> {
    let conn = db.0.lock().unwrap();
    let count: i64 = conn.query_row(
        "SELECT count(*) FROM projects",
        [],
        |row| row.get(0),
    )?;
    Ok(format!("pong: {} projects in db", count))
}
