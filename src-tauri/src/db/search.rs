use rusqlite::{params, Connection};
use serde::Serialize;
use crate::error::AppResult;
use crate::models::{Project, Task};
use crate::db::{projects::row_to_project, tasks::row_to_task};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchResults {
    pub projects: Vec<Project>,
    pub tasks: Vec<Task>,
}

pub fn search(conn: &Connection, query: &str) -> AppResult<SearchResults> {
    let pattern = format!("%{}%", query.replace('%', "\\%").replace('_', "\\_"));

    let mut pstmt = conn.prepare(
        "SELECT * FROM projects WHERE deleted_at IS NULL AND name LIKE ?1 ESCAPE '\\' ORDER BY name LIMIT 20",
    )?;
    let projects: Vec<Project> = pstmt.query_map(params![pattern], row_to_project)?.collect::<Result<_, _>>()?;

    let mut tstmt = conn.prepare(
        "SELECT * FROM tasks WHERE deleted_at IS NULL AND (name LIKE ?1 ESCAPE '\\' OR description LIKE ?1 ESCAPE '\\') ORDER BY updated_at DESC LIMIT 50",
    )?;
    let tasks: Vec<Task> = tstmt.query_map(params![pattern], row_to_task)?.collect::<Result<_, _>>()?;

    Ok(SearchResults { projects, tasks })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{in_memory_for_test, projects, tasks};

    #[test]
    fn search_matches_name() {
        let conn = in_memory_for_test();
        let p = projects::create(&conn, "ACME 二期", None, None, None).unwrap();
        tasks::create(&conn, tasks::TaskInput { project_id: p.id, name: "评审 PRD".into(), ..Default::default() }).unwrap();
        let r = search(&conn, "PRD").unwrap();
        assert_eq!(r.tasks.len(), 1);
        let r2 = search(&conn, "ACME").unwrap();
        assert_eq!(r2.projects.len(), 1);
    }
}
