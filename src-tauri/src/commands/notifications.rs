use tauri::{AppHandle, Manager};
use tauri_plugin_notification::NotificationExt;
use chrono::Local;
use crate::db::DbState;
use crate::error::AppResult;

pub fn check_and_notify(app: &AppHandle) -> AppResult<()> {
    let state = app.state::<DbState>();
    let conn = state.0.lock().unwrap();
    let today = Local::now().format("%Y-%m-%d").to_string();
    let tomorrow = (Local::now() + chrono::Duration::days(1)).format("%Y-%m-%d").to_string();

    let mut stmt = conn.prepare(
        "SELECT t.name, p.name FROM tasks t
         JOIN projects p ON t.project_id=p.id
         WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
           AND t.status != 'done' AND t.due_date = ?1",
    )?;
    let today_rows: Vec<(String, String)> = stmt
        .query_map([&today], |r| Ok((r.get(0)?, r.get(1)?)))?
        .collect::<Result<_, _>>()?;
    for (task_name, proj) in today_rows {
        let _ = app.notification().builder()
            .title("今天到期")
            .body(format!("{}（{}）", task_name, proj))
            .show();
    }

    let mut stmt2 = conn.prepare(
        "SELECT t.name, p.name FROM tasks t
         JOIN projects p ON t.project_id=p.id
         WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
           AND t.status != 'done' AND t.due_date = ?1",
    )?;
    let tomorrow_rows: Vec<(String, String)> = stmt2
        .query_map([&tomorrow], |r| Ok((r.get(0)?, r.get(1)?)))?
        .collect::<Result<_, _>>()?;
    for (task_name, proj) in tomorrow_rows {
        let _ = app.notification().builder()
            .title("明天到期")
            .body(format!("{}（{}）", task_name, proj))
            .show();
    }
    Ok(())
}

#[tauri::command]
pub fn check_notifications_now(app: AppHandle) -> AppResult<()> {
    check_and_notify(&app)
}
