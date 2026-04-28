use rusqlite::{params, Connection};
use crate::error::AppResult;
use crate::models::ProjectRelation;

fn row_to_relation(r: &rusqlite::Row) -> rusqlite::Result<ProjectRelation> {
    Ok(ProjectRelation {
        id: r.get("id")?,
        from_project_id: r.get("from_project_id")?,
        to_project_id: r.get("to_project_id")?,
        relation_type: r.get("relation_type")?,
        note: r.get("note")?,
        created_at: r.get("created_at")?,
    })
}

pub fn create(conn: &Connection, from_id: i64, to_id: i64, relation_type: &str, note: Option<&str>) -> AppResult<ProjectRelation> {
    conn.execute(
        "INSERT INTO project_relations (from_project_id, to_project_id, relation_type, note) VALUES (?1,?2,?3,?4)",
        params![from_id, to_id, relation_type, note],
    )?;
    let id = conn.last_insert_rowid();
    get(conn, id)
}

pub fn get(conn: &Connection, id: i64) -> AppResult<ProjectRelation> {
    conn.query_row(
        "SELECT * FROM project_relations WHERE id=?1",
        params![id],
        row_to_relation,
    ).map_err(Into::into)
}

pub fn list_for_project(conn: &Connection, project_id: i64) -> AppResult<Vec<ProjectRelation>> {
    let mut stmt = conn.prepare(
        "SELECT * FROM project_relations WHERE from_project_id=?1 OR to_project_id=?1 ORDER BY created_at DESC",
    )?;
    let rows = stmt.query_map(params![project_id], row_to_relation)?.collect::<Result<_, _>>()?;
    Ok(rows)
}

pub fn delete(conn: &Connection, id: i64) -> AppResult<()> {
    conn.execute("DELETE FROM project_relations WHERE id=?1", params![id])?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{in_memory_for_test, projects};

    #[test]
    fn create_and_list() {
        let conn = in_memory_for_test();
        let p1 = projects::create(&conn, "一期", None, None, None).unwrap();
        let p2 = projects::create(&conn, "二期", None, None, None).unwrap();
        create(&conn, p2.id, p1.id, "successor", Some("二期源自一期")).unwrap();
        let rels = list_for_project(&conn, p1.id).unwrap();
        assert_eq!(rels.len(), 1);
        assert_eq!(rels[0].relation_type, "successor");
    }
}
