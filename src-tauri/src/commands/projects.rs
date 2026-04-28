use tauri::State;
use crate::db::{DbState, projects};
use crate::error::AppResult;
use crate::models::Project;

#[tauri::command]
pub fn create_project(db: State<'_, DbState>, name: String, r#type: Option<String>, start_date: Option<String>, end_date: Option<String>) -> AppResult<Project> {
    let conn = db.0.lock().unwrap();
    projects::create(&conn, &name, r#type.as_deref(), start_date.as_deref(), end_date.as_deref())
}

#[tauri::command]
pub fn list_active_projects(db: State<'_, DbState>) -> AppResult<Vec<Project>> {
    let conn = db.0.lock().unwrap();
    projects::list_active(&conn)
}

#[tauri::command]
pub fn list_archived_projects(db: State<'_, DbState>) -> AppResult<Vec<Project>> {
    let conn = db.0.lock().unwrap();
    projects::list_archived(&conn)
}

#[tauri::command]
pub fn get_project(db: State<'_, DbState>, id: i64) -> AppResult<Project> {
    let conn = db.0.lock().unwrap();
    projects::get(&conn, id)
}

#[tauri::command]
pub fn update_project(db: State<'_, DbState>, id: i64, name: String, r#type: Option<String>, start_date: Option<String>, end_date: Option<String>) -> AppResult<Project> {
    let conn = db.0.lock().unwrap();
    projects::update(&conn, id, &name, r#type.as_deref(), start_date.as_deref(), end_date.as_deref())
}

#[tauri::command]
pub fn archive_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    projects::archive(&conn, id)
}

#[tauri::command]
pub fn unarchive_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    projects::unarchive(&conn, id)
}

#[tauri::command]
pub fn soft_delete_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    projects::soft_delete(&conn, id)
}
