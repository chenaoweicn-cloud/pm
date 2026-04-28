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
