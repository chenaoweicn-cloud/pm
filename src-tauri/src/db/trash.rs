use rusqlite::{params, Connection};
use serde::Serialize;
use crate::error::AppResult;
use crate::models::{Project, Task};
use crate::db::{projects::row_to_project, tasks::row_to_task};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct TrashItems {
    pub projects: Vec<Project>,
    pub tasks: Vec<Task>,
}

pub fn list(conn: &Connection) -> AppResult<TrashItems> {
    let mut ps = conn.prepare("SELECT * FROM projects WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")?;
    let projects: Vec<Project> = ps.query_map([], row_to_project)?.collect::<Result<_, _>>()?;
    let mut ts = conn.prepare("SELECT * FROM tasks WHERE deleted_at IS NOT NULL ORDER BY deleted_at DESC")?;
    let tasks: Vec<Task> = ts.query_map([], row_to_task)?.collect::<Result<_, _>>()?;
    Ok(TrashItems { projects, tasks })
}

pub fn restore_project(conn: &Connection, id: i64) -> AppResult<()> {
    conn.execute("UPDATE projects SET deleted_at=NULL, updated_at=datetime('now') WHERE id=?1", params![id])?;
    Ok(())
}

pub fn restore_task(conn: &Connection, id: i64) -> AppResult<()> {
    conn.execute("UPDATE tasks SET deleted_at=NULL, updated_at=datetime('now') WHERE id=?1", params![id])?;
    Ok(())
}

pub fn purge_project(conn: &Connection, id: i64) -> AppResult<()> {
    conn.execute("DELETE FROM tasks WHERE project_id=?1", params![id])?;
    conn.execute("DELETE FROM project_relations WHERE from_project_id=?1 OR to_project_id=?1", params![id])?;
    conn.execute("DELETE FROM task_groups WHERE project_id=?1", params![id])?;
    conn.execute("DELETE FROM projects WHERE id=?1", params![id])?;
    Ok(())
}

pub fn purge_task(conn: &Connection, id: i64) -> AppResult<()> {
    conn.execute("DELETE FROM tasks WHERE parent_task_id=?1", params![id])?;
    conn.execute("DELETE FROM tasks WHERE id=?1", params![id])?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{in_memory_for_test, projects, tasks};

    #[test]
    fn purge_parent_task_deletes_children_first() {
        let conn = in_memory_for_test();
        let project = projects::create(&conn, "P", None, None, None).unwrap();
        let root = tasks::create(
            &conn,
            tasks::TaskInput {
                project_id: project.id,
                name: "R".into(),
                ..Default::default()
            },
        )
        .unwrap();
        let child = tasks::create(
            &conn,
            tasks::TaskInput {
                project_id: project.id,
                name: "C".into(),
                parent_task_id: Some(root.id),
                ..Default::default()
            },
        )
        .unwrap();

        tasks::soft_delete(&conn, root.id).unwrap();
        purge_task(&conn, root.id).unwrap();

        assert!(tasks::get(&conn, child.id).is_err());
        assert!(tasks::get(&conn, root.id).is_err());
    }
}
