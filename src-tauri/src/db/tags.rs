use rusqlite::{params, Connection};
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
}
