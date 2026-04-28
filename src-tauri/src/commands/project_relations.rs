use tauri::State;
use crate::db::{DbState, project_relations};
use crate::error::AppResult;
use crate::models::ProjectRelation;

#[tauri::command]
pub fn create_project_relation(db: State<'_, DbState>, from_id: i64, to_id: i64, relation_type: String, note: Option<String>) -> AppResult<ProjectRelation> {
    let conn = db.0.lock().unwrap();
    project_relations::create(&conn, from_id, to_id, &relation_type, note.as_deref())
}

#[tauri::command]
pub fn list_project_relations(db: State<'_, DbState>, project_id: i64) -> AppResult<Vec<ProjectRelation>> {
    let conn = db.0.lock().unwrap();
    project_relations::list_for_project(&conn, project_id)
}

#[tauri::command]
pub fn delete_project_relation(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    project_relations::delete(&conn, id)
}
