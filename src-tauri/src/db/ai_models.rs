use rusqlite::{params, Connection, OptionalExtension};
use std::time::{SystemTime, UNIX_EPOCH};

use crate::error::{AppError, AppResult};
use crate::models::AiModel;

pub(crate) fn row_to_ai_model(row: &rusqlite::Row) -> rusqlite::Result<AiModel> {
    Ok(AiModel {
        id: row.get("id")?,
        display_name: row.get("display_name")?,
        base_url: row.get("base_url")?,
        model_name: row.get("model_name")?,
        key_ref: row.get("key_ref")?,
        is_active: row.get::<_, i64>("is_active")? == 1,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

fn ensure_not_blank(value: &str, label: &str) -> AppResult<()> {
    if value.trim().is_empty() {
        return Err(AppError::Invalid(format!("{}不能为空", label)));
    }
    Ok(())
}

pub fn list(conn: &Connection) -> AppResult<Vec<AiModel>> {
    let mut stmt =
        conn.prepare("SELECT * FROM ai_models ORDER BY is_active DESC, updated_at DESC, id DESC")?;
    let rows = stmt
        .query_map([], row_to_ai_model)?
        .collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn get(conn: &Connection, id: i64) -> AppResult<AiModel> {
    conn.query_row(
        "SELECT * FROM ai_models WHERE id=?1",
        params![id],
        row_to_ai_model,
    )
    .optional()?
    .ok_or_else(|| AppError::NotFound(format!("ai model {}", id)))
}

pub fn get_active(conn: &Connection) -> AppResult<Option<AiModel>> {
    conn.query_row(
        "SELECT * FROM ai_models WHERE is_active=1 ORDER BY id LIMIT 1",
        [],
        row_to_ai_model,
    )
    .optional()
    .map_err(Into::into)
}

pub fn create(
    conn: &Connection,
    display_name: &str,
    base_url: &str,
    model_name: &str,
) -> AppResult<AiModel> {
    ensure_not_blank(display_name, "显示名称")?;
    ensure_not_blank(base_url, "Base URL")?;
    ensure_not_blank(model_name, "模型名称")?;

    let count: i64 = conn.query_row("SELECT count(*) FROM ai_models", [], |row| row.get(0))?;
    let is_active = if count == 0 { 1 } else { 0 };
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    let temporary_key_ref = format!("ai-model-pending-{}", nanos);

    conn.execute(
        "INSERT INTO ai_models (display_name, base_url, model_name, key_ref, is_active)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![
            display_name.trim(),
            base_url.trim(),
            model_name.trim(),
            temporary_key_ref,
            is_active,
        ],
    )?;
    let id = conn.last_insert_rowid();
    let key_ref = format!("ai-model-{}", id);
    conn.execute(
        "UPDATE ai_models SET key_ref=?1, updated_at=datetime('now') WHERE id=?2",
        params![key_ref, id],
    )?;
    get(conn, id)
}

pub fn update(
    conn: &Connection,
    id: i64,
    display_name: &str,
    base_url: &str,
    model_name: &str,
) -> AppResult<AiModel> {
    ensure_not_blank(display_name, "显示名称")?;
    ensure_not_blank(base_url, "Base URL")?;
    ensure_not_blank(model_name, "模型名称")?;
    get(conn, id)?;

    conn.execute(
        "UPDATE ai_models
         SET display_name=?1, base_url=?2, model_name=?3, updated_at=datetime('now')
         WHERE id=?4",
        params![display_name.trim(), base_url.trim(), model_name.trim(), id],
    )?;
    get(conn, id)
}

pub fn delete(conn: &Connection, id: i64) -> AppResult<AiModel> {
    let model = get(conn, id)?;
    conn.execute("DELETE FROM ai_models WHERE id=?1", params![id])?;

    if model.is_active {
        if let Some(next_id) = conn
            .query_row("SELECT id FROM ai_models ORDER BY id LIMIT 1", [], |row| {
                row.get::<_, i64>(0)
            })
            .optional()?
        {
            set_active(conn, next_id)?;
        }
    }

    Ok(model)
}

pub fn set_active(conn: &Connection, id: i64) -> AppResult<()> {
    get(conn, id)?;
    conn.execute(
        "UPDATE ai_models SET is_active=0, updated_at=datetime('now')",
        [],
    )?;
    conn.execute(
        "UPDATE ai_models SET is_active=1, updated_at=datetime('now') WHERE id=?1",
        params![id],
    )?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::in_memory_for_test;

    #[test]
    fn first_model_is_active_and_active_is_unique() {
        let conn = in_memory_for_test();
        let first = create(&conn, "OpenAI", "https://api.openai.com/v1", "gpt-4.1").unwrap();
        let second = create(
            &conn,
            "DeepSeek",
            "https://api.deepseek.com/v1",
            "deepseek-chat",
        )
        .unwrap();

        assert!(first.is_active);
        assert!(!second.is_active);

        set_active(&conn, second.id).unwrap();
        let models = list(&conn).unwrap();
        assert_eq!(models.iter().filter(|model| model.is_active).count(), 1);
        assert_eq!(get_active(&conn).unwrap().unwrap().id, second.id);
    }

    #[test]
    fn deleting_active_model_falls_back_to_first_remaining_model() {
        let conn = in_memory_for_test();
        let first = create(&conn, "A", "https://a.test/v1", "a").unwrap();
        let second = create(&conn, "B", "https://b.test/v1", "b").unwrap();
        set_active(&conn, second.id).unwrap();

        let deleted = delete(&conn, second.id).unwrap();

        assert_eq!(deleted.id, second.id);
        assert_eq!(get_active(&conn).unwrap().unwrap().id, first.id);
    }
}
