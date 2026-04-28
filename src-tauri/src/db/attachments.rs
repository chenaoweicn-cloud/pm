use rusqlite::{params, Connection};
use crate::error::AppResult;
use crate::models::TaskAttachment;

fn row_to(r: &rusqlite::Row) -> rusqlite::Result<TaskAttachment> {
    Ok(TaskAttachment {
        id: r.get("id")?,
        task_id: r.get("task_id")?,
        r#type: r.get("type")?,
        url_or_path: r.get("url_or_path")?,
        label: r.get("label")?,
        created_at: r.get("created_at")?,
    })
}

pub fn create(conn: &Connection, task_id: i64, r#type: &str, url_or_path: &str, label: Option<&str>) -> AppResult<TaskAttachment> {
    conn.execute(
        "INSERT INTO task_attachments (task_id, type, url_or_path, label) VALUES (?1,?2,?3,?4)",
        params![task_id, r#type, url_or_path, label],
    )?;
    let id = conn.last_insert_rowid();
    conn.query_row("SELECT * FROM task_attachments WHERE id=?1", params![id], row_to).map_err(Into::into)
}

pub fn list_for_task(conn: &Connection, task_id: i64) -> AppResult<Vec<TaskAttachment>> {
    let mut stmt = conn.prepare("SELECT * FROM task_attachments WHERE task_id=?1 ORDER BY created_at")?;
    let rows = stmt.query_map(params![task_id], row_to)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
    conn.execute("DELETE FROM task_attachments WHERE id=?1", params![id])?;
    Ok(())
}
