use rusqlite::{params, Connection};
use std::collections::HashMap;
use crate::error::AppResult;
use crate::models::Tag;

fn row_to_tag(r: &rusqlite::Row) -> rusqlite::Result<Tag> {
    Ok(Tag { id: r.get("id")?, name: r.get("name")?, created_at: r.get("created_at")? })
}

pub fn upsert(conn: &Connection, name: &str) -> AppResult<Tag> {
    conn.execute("INSERT OR IGNORE INTO tags (name) VALUES (?1)", params![name])?;
    conn.query_row("SELECT * FROM tags WHERE name=?1", params![name], row_to_tag).map_err(Into::into)
}

pub fn list_all(conn: &Connection) -> AppResult<Vec<Tag>> {
    let mut stmt = conn.prepare("SELECT * FROM tags ORDER BY name")?;
    let rows = stmt.query_map([], row_to_tag)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn list_for_task(conn: &Connection, task_id: i64) -> AppResult<Vec<Tag>> {
    let mut stmt = conn.prepare(
        "SELECT t.* FROM tags t JOIN task_tags tt ON t.id=tt.tag_id WHERE tt.task_id=?1 ORDER BY t.name",
    )?;
    let rows = stmt.query_map(params![task_id], row_to_tag)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn list_first_names_for_tasks(conn: &Connection, task_ids: &[i64]) -> AppResult<HashMap<i64, String>> {
    if task_ids.is_empty() {
        return Ok(HashMap::new());
    }

    let placeholders = std::iter::repeat("?")
        .take(task_ids.len())
        .collect::<Vec<_>>()
        .join(",");
    let sql = format!(
        "SELECT tt.task_id, MIN(t.name) AS name
         FROM task_tags tt
         JOIN tags t ON t.id=tt.tag_id
         WHERE tt.task_id IN ({})
         GROUP BY tt.task_id",
        placeholders,
    );
    let mut stmt = conn.prepare(&sql)?;
    let rows = stmt.query_map(rusqlite::params_from_iter(task_ids.iter()), |row| {
        Ok((row.get::<_, i64>(0)?, row.get::<_, String>(1)?))
    })?;

    let mut tag_names = HashMap::new();
    for row in rows {
        let (task_id, name) = row?;
        tag_names.insert(task_id, name);
    }
    Ok(tag_names)
}

pub fn attach(conn: &Connection, task_id: i64, tag_id: i64) -> AppResult<()> {
    conn.execute("INSERT OR IGNORE INTO task_tags (task_id, tag_id) VALUES (?1,?2)", params![task_id, tag_id])?;
    Ok(())
}

pub fn detach(conn: &Connection, task_id: i64, tag_id: i64) -> AppResult<()> {
    conn.execute("DELETE FROM task_tags WHERE task_id=?1 AND tag_id=?2", params![task_id, tag_id])?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{in_memory_for_test, projects, tasks};

    #[test]
    fn upsert_attach_detach() {
        let conn = in_memory_for_test();
        let p = projects::create(&conn, "P", None, None, None).unwrap();
        let t = tasks::create(&conn, tasks::TaskInput { project_id: p.id, name: "X".into(), ..Default::default() }).unwrap();
        let tag = upsert(&conn, "urgent").unwrap();
        attach(&conn, t.id, tag.id).unwrap();
        assert_eq!(list_for_task(&conn, t.id).unwrap().len(), 1);
        detach(&conn, t.id, tag.id).unwrap();
        assert_eq!(list_for_task(&conn, t.id).unwrap().len(), 0);
    }

    #[test]
    fn list_first_names_for_tasks_batches_tag_lookup() {
        let conn = in_memory_for_test();
        let p = projects::create(&conn, "P", None, None, None).unwrap();
        let t1 = tasks::create(&conn, tasks::TaskInput { project_id: p.id, name: "A".into(), ..Default::default() }).unwrap();
        let t2 = tasks::create(&conn, tasks::TaskInput { project_id: p.id, name: "B".into(), ..Default::default() }).unwrap();
        let urgent = upsert(&conn, "urgent").unwrap();
        let later = upsert(&conn, "later").unwrap();

        attach(&conn, t1.id, urgent.id).unwrap();
        attach(&conn, t2.id, later.id).unwrap();

        let tags = list_first_names_for_tasks(&conn, &[t1.id, t2.id]).unwrap();
        assert_eq!(tags.get(&t1.id).map(String::as_str), Some("urgent"));
        assert_eq!(tags.get(&t2.id).map(String::as_str), Some("later"));
    }
}
