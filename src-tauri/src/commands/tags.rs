use tauri::State;
use std::collections::HashMap;
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
pub fn list_first_tag_names_for_tasks(db: State<'_, DbState>, task_ids: Vec<i64>) -> AppResult<HashMap<i64, String>> {
    let conn = db.0.lock().unwrap();
    tags::list_first_names_for_tasks(&conn, &task_ids)
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
