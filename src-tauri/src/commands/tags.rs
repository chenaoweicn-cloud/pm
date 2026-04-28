use tauri::State;
use crate::db::{DbState, tags};
use crate::error::AppResult;
use crate::models::Tag;

#[tauri::command]
pub fn upsert_tag(db: State<'_, DbState>, name: String) -> AppResult<Tag> {
    let conn = db.0.lock().unwrap();
    tags::upsert(&conn, &name)
}

#[tauri::command]
pub fn list_tags(db: State<'_, DbState>) -> AppResult<Vec<Tag>> {
    let conn = db.0.lock().unwrap();
    tags::list_all(&conn)
}

#[tauri::command]
pub fn list_tags_for_task(db: State<'_, DbState>, task_id: i64) -> AppResult<Vec<Tag>> {
    let conn = db.0.lock().unwrap();
    tags::list_for_task(&conn, task_id)
}

#[tauri::command]
pub fn attach_tag(db: State<'_, DbState>, task_id: i64, tag_id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    tags::attach(&conn, task_id, tag_id)
}

#[tauri::command]
pub fn detach_tag(db: State<'_, DbState>, task_id: i64, tag_id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    tags::detach(&conn, task_id, tag_id)
}
