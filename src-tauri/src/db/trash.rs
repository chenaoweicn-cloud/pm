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
    conn.execute("DELETE FROM tasks WHERE id=?1", params![id])?;
    Ok(())
}
