use tauri::State;
use crate::db::{DbState, trash::{self, TrashItems}};
use crate::error::AppResult;

#[tauri::command]
pub fn list_trash(db: State<'_, DbState>) -> AppResult<TrashItems> {
    let conn = db.0.lock().unwrap();
    trash::list(&conn)
}

#[tauri::command]
pub fn restore_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    trash::restore_project(&conn, id)
}

#[tauri::command]
pub fn restore_task(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    trash::restore_task(&conn, id)
}

#[tauri::command]
pub fn purge_project(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    trash::purge_project(&conn, id)
}

#[tauri::command]
pub fn purge_task(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    trash::purge_task(&conn, id)
}
