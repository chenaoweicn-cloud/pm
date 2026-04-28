use tauri::State;
use crate::db::{DbState, attachments};
use crate::error::AppResult;
use crate::models::TaskAttachment;

#[tauri::command]
pub fn create_attachment(db: State<'_, DbState>, task_id: i64, r#type: String, url_or_path: String, label: Option<String>) -> AppResult<TaskAttachment> {
    let conn = db.0.lock().unwrap();
    attachments::create(&conn, task_id, &r#type, &url_or_path, label.as_deref())
}

#[tauri::command]
pub fn list_attachments(db: State<'_, DbState>, task_id: i64) -> AppResult<Vec<TaskAttachment>> {
    let conn = db.0.lock().unwrap();
    attachments::list_for_task(&conn, task_id)
}

#[tauri::command]
pub fn delete_attachment(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    attachments::delete(&conn, id)
}
