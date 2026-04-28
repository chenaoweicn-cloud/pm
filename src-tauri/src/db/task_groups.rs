use rusqlite::{params, Connection};
use crate::error::AppResult;
use crate::models::TaskGroup;

fn row_to_group(row: &rusqlite::Row) -> rusqlite::Result<TaskGroup> {
    Ok(TaskGroup {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        name: row.get("name")?,
        sort_order: row.get("sort_order")?,
        created_at: row.get("created_at")?,
    })
}

pub fn create(conn: &Connection, project_id: i64, name: &str, sort_order: i64) -> AppResult<TaskGroup> {
    conn.execute(
        "INSERT INTO task_groups (project_id, name, sort_order) VALUES (?1,?2,?3)",
        params![project_id, name, sort_order],
    )?;
    let id = conn.last_insert_rowid();
    get(conn, id)
}

pub fn get(conn: &Connection, id: i64) -> AppResult<TaskGroup> {
    conn.query_row("SELECT * FROM task_groups WHERE id=?1", params![id], row_to_group)
        .map_err(Into::into)
}

pub fn list_for_project(conn: &Connection, project_id: i64) -> AppResult<Vec<TaskGroup>> {
    let mut stmt = conn.prepare(
        "SELECT * FROM task_groups WHERE project_id=?1 ORDER BY sort_order, created_at",
    )?;
    let rows = stmt.query_map(params![project_id], row_to_group)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn rename(conn: &Connection, id: i64, name: &str) -> AppResult<TaskGroup> {
    conn.execute("UPDATE task_groups SET name=?1 WHERE id=?2", params![name, id])?;
    get(conn, id)
}

pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
    // nullify group_id on tasks rather than cascade-deleting them
    conn.execute("UPDATE tasks SET group_id=NULL WHERE group_id=?1", params![id])?;
    conn.execute("DELETE FROM task_groups WHERE id=?1", params![id])?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{in_memory_for_test, projects};

    #[test]
    fn create_and_list() {
        let conn = in_memory_for_test();
        let p = projects::create(&conn, "X", None, None, None).unwrap();
        create(&conn, p.id, "一期", 0).unwrap();
        create(&conn, p.id, "二期", 1).unwrap();
        let groups = list_for_project(&conn, p.id).unwrap();
        assert_eq!(groups.len(), 2);
        assert_eq!(groups[0].name, "一期");
    }
}
