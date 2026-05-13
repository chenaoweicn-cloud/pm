use rusqlite::{params, Connection, OptionalExtension};

use crate::db::tasks::{self, TaskInput};
use crate::error::{AppError, AppResult};
use crate::models::{AiInboxItem, Task};

#[derive(Debug, Clone, Default)]
pub struct AiInboxInput {
    pub raw_input: String,
    pub parsed_name: String,
    pub parsed_description: Option<String>,
    pub priority: Option<String>,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
    pub project_candidate_id: Option<i64>,
    pub confidence: f64,
    pub model_id: Option<i64>,
}

pub(crate) fn row_to_ai_inbox_item(row: &rusqlite::Row) -> rusqlite::Result<AiInboxItem> {
    Ok(AiInboxItem {
        id: row.get("id")?,
        raw_input: row.get("raw_input")?,
        parsed_name: row.get("parsed_name")?,
        parsed_description: row.get("parsed_description")?,
        priority: row.get("priority")?,
        start_date: row.get("start_date")?,
        due_date: row.get("due_date")?,
        project_candidate_id: row.get("project_candidate_id")?,
        confidence: row.get("confidence")?,
        status: row.get("status")?,
        model_id: row.get("model_id")?,
        created_task_id: row.get("created_task_id")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn validate_status(status: &str) -> AppResult<()> {
    match status {
        "pending" | "converted" | "dismissed" => Ok(()),
        _ => Err(AppError::Invalid(format!(
            "invalid ai inbox status: {}",
            status
        ))),
    }
}

fn validate_priority(priority: Option<&str>) -> AppResult<()> {
    match priority {
        None | Some("high") | Some("medium") | Some("low") => Ok(()),
        Some(value) => Err(AppError::Invalid(format!("invalid priority: {}", value))),
    }
}

pub fn create(conn: &Connection, input: AiInboxInput) -> AppResult<AiInboxItem> {
    validate_priority(input.priority.as_deref())?;
    let parsed_name = if input.parsed_name.trim().is_empty() {
        "未识别任务".to_string()
    } else {
        input.parsed_name.trim().to_string()
    };

    conn.execute(
        "INSERT INTO ai_inbox_items (
           raw_input, parsed_name, parsed_description, priority, start_date, due_date,
           project_candidate_id, confidence, model_id
         )
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            input.raw_input,
            parsed_name,
            input.parsed_description,
            input.priority,
            input.start_date,
            input.due_date,
            input.project_candidate_id,
            input.confidence,
            input.model_id,
        ],
    )?;
    let id = conn.last_insert_rowid();
    get(conn, id)
}

pub fn get(conn: &Connection, id: i64) -> AppResult<AiInboxItem> {
    conn.query_row(
        "SELECT * FROM ai_inbox_items WHERE id=?1",
        params![id],
        row_to_ai_inbox_item,
    )
    .optional()?
    .ok_or_else(|| AppError::NotFound(format!("ai inbox item {}", id)))
}

pub fn list(conn: &Connection, status: Option<&str>) -> AppResult<Vec<AiInboxItem>> {
    if let Some(status) = status {
        validate_status(status)?;
        let mut stmt = conn.prepare(
            "SELECT * FROM ai_inbox_items WHERE status=?1 ORDER BY created_at DESC, id DESC",
        )?;
        let rows = stmt
            .query_map(params![status], row_to_ai_inbox_item)?
            .collect::<Result<_, _>>()?;
        Ok(rows)
    } else {
        let mut stmt =
            conn.prepare("SELECT * FROM ai_inbox_items ORDER BY created_at DESC, id DESC")?;
        let rows = stmt
            .query_map([], row_to_ai_inbox_item)?
            .collect::<Result<_, _>>()?;
        Ok(rows)
    }
}

pub fn count_pending(conn: &Connection) -> AppResult<i64> {
    conn.query_row(
        "SELECT count(*) FROM ai_inbox_items WHERE status='pending'",
        [],
        |row| row.get(0),
    )
    .map_err(Into::into)
}

pub fn convert(conn: &Connection, id: i64, input: TaskInput) -> AppResult<Task> {
    let item = get(conn, id)?;
    if item.status != "pending" {
        return Err(AppError::Invalid("暂存任务不是 pending 状态".into()));
    }

    let task = tasks::create(conn, input)?;
    conn.execute(
        "UPDATE ai_inbox_items
         SET status='converted', created_task_id=?1, updated_at=datetime('now')
         WHERE id=?2",
        params![task.id, id],
    )?;
    Ok(task)
}

pub fn dismiss(conn: &Connection, id: i64) -> AppResult<()> {
    let item = get(conn, id)?;
    if item.status != "pending" {
        return Err(AppError::Invalid("暂存任务不是 pending 状态".into()));
    }

    conn.execute(
        "UPDATE ai_inbox_items
         SET status='dismissed', updated_at=datetime('now')
         WHERE id=?1",
        params![id],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{in_memory_for_test, projects};

    #[test]
    fn pending_item_can_be_converted_and_dismissed() {
        let conn = in_memory_for_test();
        let project = projects::create(&conn, "P", None, None, None).unwrap();
        let item = create(
            &conn,
            AiInboxInput {
                raw_input: "整理纪要".into(),
                parsed_name: "整理纪要".into(),
                confidence: 0.2,
                ..Default::default()
            },
        )
        .unwrap();

        let task = convert(
            &conn,
            item.id,
            TaskInput {
                project_id: project.id,
                name: "整理纪要".into(),
                ..Default::default()
            },
        )
        .unwrap();

        let converted = get(&conn, item.id).unwrap();
        assert_eq!(converted.status, "converted");
        assert_eq!(converted.created_task_id, Some(task.id));

        let ignored = create(
            &conn,
            AiInboxInput {
                raw_input: "待归类".into(),
                parsed_name: "待归类".into(),
                ..Default::default()
            },
        )
        .unwrap();
        dismiss(&conn, ignored.id).unwrap();
        assert_eq!(get(&conn, ignored.id).unwrap().status, "dismissed");
        assert_eq!(count_pending(&conn).unwrap(), 0);
    }
}
