use rusqlite::{params, Connection, OptionalExtension};
use crate::error::{AppError, AppResult};
use crate::models::Task;

#[derive(Default)]
pub struct TaskInput {
    pub project_id: i64,
    pub name: String,
    pub group_id: Option<i64>,
    pub parent_task_id: Option<i64>,
    pub priority: Option<String>,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
    pub estimate_hours: Option<f64>,
    pub description: Option<String>,
}

fn row_to_task(row: &rusqlite::Row) -> rusqlite::Result<Task> {
    Ok(Task {
        id: row.get("id")?,
        project_id: row.get("project_id")?,
        group_id: row.get("group_id")?,
        parent_task_id: row.get("parent_task_id")?,
        name: row.get("name")?,
        status: row.get("status")?,
        priority: row.get("priority")?,
        start_date: row.get("start_date")?,
        due_date: row.get("due_date")?,
        estimate_hours: row.get("estimate_hours")?,
        description: row.get("description")?,
        completed_at: row.get("completed_at")?,
        deleted_at: row.get("deleted_at")?,
        created_at: row.get("created_at")?,
        updated_at: row.get("updated_at")?,
    })
}

pub fn create(conn: &Connection, input: TaskInput) -> AppResult<Task> {
    if let Some(pid) = input.parent_task_id {
        let parent_of_parent: Option<i64> = conn
            .query_row(
                "SELECT parent_task_id FROM tasks WHERE id=?1",
                params![pid],
                |r| r.get(0),
            )
            .optional()
            .map_err(AppError::from)?
            .flatten();
        if parent_of_parent.is_some() {
            return Err(AppError::Invalid("只允许一层子任务".into()));
        }
    }

    conn.execute(
        "INSERT INTO tasks (project_id, group_id, parent_task_id, name, priority, start_date, due_date, estimate_hours, description)
         VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        params![
            input.project_id, input.group_id, input.parent_task_id, input.name,
            input.priority, input.start_date, input.due_date, input.estimate_hours, input.description,
        ],
    )?;
    let id = conn.last_insert_rowid();
    get(conn, id)
}

pub fn get(conn: &Connection, id: i64) -> AppResult<Task> {
    conn.query_row("SELECT * FROM tasks WHERE id=?1", params![id], row_to_task)
        .map_err(Into::into)
}

pub fn list_for_project(conn: &Connection, project_id: i64) -> AppResult<Vec<Task>> {
    let mut stmt = conn.prepare(
        "SELECT * FROM tasks WHERE project_id=?1 AND deleted_at IS NULL ORDER BY created_at DESC",
    )?;
    let rows = stmt.query_map(params![project_id], row_to_task)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn list_all_active(conn: &Connection) -> AppResult<Vec<Task>> {
    let mut stmt = conn.prepare(
        "SELECT t.* FROM tasks t
         JOIN projects p ON t.project_id = p.id
         WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
         ORDER BY t.created_at DESC",
    )?;
    let rows = stmt.query_map([], row_to_task)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn update(conn: &Connection, id: i64, input: TaskInput) -> AppResult<Task> {
    conn.execute(
        "UPDATE tasks SET
           project_id=?1, group_id=?2, parent_task_id=?3, name=?4,
           priority=?5, start_date=?6, due_date=?7, estimate_hours=?8, description=?9,
           updated_at=datetime('now')
         WHERE id=?10",
        params![
            input.project_id, input.group_id, input.parent_task_id, input.name,
            input.priority, input.start_date, input.due_date, input.estimate_hours, input.description,
            id,
        ],
    )?;
    get(conn, id)
}

pub fn set_status(conn: &Connection, id: i64, status: &str) -> AppResult<Task> {
    match status {
        "not_started" | "in_progress" => {
            conn.execute(
                "UPDATE tasks SET status=?1, completed_at=NULL, updated_at=datetime('now') WHERE id=?2",
                params![status, id],
            )?;
        }
        "done" => {
            conn.execute(
                "UPDATE tasks SET status='done', completed_at=datetime('now'), updated_at=datetime('now') WHERE id=?1",
                params![id],
            )?;
        }
        _ => return Err(AppError::Invalid(format!("invalid status: {}", status))),
    }
    get(conn, id)
}

pub fn soft_delete(conn: &Connection, id: i64) -> AppResult<()> {
    conn.execute(
        "UPDATE tasks SET deleted_at=datetime('now'), updated_at=datetime('now') WHERE id=?1",
        params![id],
    )?;
    Ok(())
}

pub fn today_tasks(conn: &Connection, today_iso: &str) -> AppResult<Vec<Task>> {
    let mut stmt = conn.prepare(
        "SELECT t.* FROM tasks t
         JOIN projects p ON t.project_id = p.id
         WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
           AND t.status != 'done'
           AND (t.due_date IS NOT NULL AND t.due_date <= ?1
                OR t.start_date IS NOT NULL AND t.start_date <= ?1)
         ORDER BY t.due_date ASC NULLS LAST",
    )?;
    let rows = stmt.query_map(params![today_iso], row_to_task)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn completed_in_range(conn: &Connection, start_iso: &str, end_iso_exclusive: &str, include_archived: bool) -> AppResult<Vec<Task>> {
    let sql = if include_archived {
        "SELECT t.* FROM tasks t JOIN projects p ON t.project_id=p.id
         WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL
           AND t.completed_at >= ?1 AND t.completed_at < ?2
         ORDER BY t.completed_at DESC"
    } else {
        "SELECT t.* FROM tasks t JOIN projects p ON t.project_id=p.id
         WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active'
           AND t.completed_at >= ?1 AND t.completed_at < ?2
         ORDER BY t.completed_at DESC"
    };
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt.query_map(params![start_iso, end_iso_exclusive], row_to_task)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn in_progress_tasks(conn: &Connection, include_archived: bool) -> AppResult<Vec<Task>> {
    let sql = if include_archived {
        "SELECT t.* FROM tasks t JOIN projects p ON t.project_id=p.id
         WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND t.status='in_progress'
         ORDER BY t.updated_at DESC"
    } else {
        "SELECT t.* FROM tasks t JOIN projects p ON t.project_id=p.id
         WHERE t.deleted_at IS NULL AND p.deleted_at IS NULL AND p.status='active' AND t.status='in_progress'
         ORDER BY t.updated_at DESC"
    };
    let mut stmt = conn.prepare(sql)?;
    let rows = stmt.query_map([], row_to_task)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{in_memory_for_test, projects};

    fn setup() -> (rusqlite::Connection, i64) {
        let conn = in_memory_for_test();
        let p = projects::create(&conn, "P", None, None, None).unwrap();
        (conn, p.id)
    }

    #[test]
    fn create_and_list() {
        let (conn, pid) = setup();
        let t = create(&conn, TaskInput { project_id: pid, name: "回邮件".into(), ..Default::default() }).unwrap();
        assert_eq!(t.status, "not_started");
        assert_eq!(list_for_project(&conn, pid).unwrap().len(), 1);
    }

    #[test]
    fn done_sets_completed_at() {
        let (conn, pid) = setup();
        let t = create(&conn, TaskInput { project_id: pid, name: "X".into(), ..Default::default() }).unwrap();
        let done = set_status(&conn, t.id, "done").unwrap();
        assert_eq!(done.status, "done");
        assert!(done.completed_at.is_some());
        let back = set_status(&conn, t.id, "in_progress").unwrap();
        assert!(back.completed_at.is_none());
    }

    #[test]
    fn subtask_only_one_level() {
        let (conn, pid) = setup();
        let root = create(&conn, TaskInput { project_id: pid, name: "R".into(), ..Default::default() }).unwrap();
        let child = create(&conn, TaskInput { project_id: pid, name: "C".into(), parent_task_id: Some(root.id), ..Default::default() }).unwrap();
        let err = create(&conn, TaskInput { project_id: pid, name: "GC".into(), parent_task_id: Some(child.id), ..Default::default() });
        assert!(err.is_err());
    }

    #[test]
    fn today_tasks_respects_due_and_start_dates() {
        let (conn, pid) = setup();
        create(&conn, TaskInput { project_id: pid, name: "due today".into(), due_date: Some("2026-04-23".into()), ..Default::default() }).unwrap();
        create(&conn, TaskInput { project_id: pid, name: "future".into(), due_date: Some("2026-05-01".into()), ..Default::default() }).unwrap();
        let list = today_tasks(&conn, "2026-04-23").unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "due today");
    }
}
