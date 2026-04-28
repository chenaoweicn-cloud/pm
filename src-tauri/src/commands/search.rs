use tauri::State;
use crate::db::{DbState, search::{self, SearchResults}};
use crate::error::AppResult;

#[tauri::command]
pub fn search_all(db: State<'_, DbState>, query: String) -> AppResult<SearchResults> {
    let conn = db.0.lock().unwrap();
    search::search(&conn, &query)
}
