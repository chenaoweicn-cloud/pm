use tauri::State;
use std::fs;
use serde::Serialize;
use crate::db::{DbState, projects, tasks};
use crate::error::AppResult;
use crate::models::{Project, Task};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct Bundle {
    projects: Vec<Project>,
    tasks: Vec<Task>,
}

#[tauri::command]
pub fn export_json(db: State<'_, DbState>, output_path: String, project_id: Option<i64>) -> AppResult<String> {
    let conn = db.0.lock().unwrap();
    let (all_projects, all_tasks) = match project_id {
        Some(pid) => (vec![projects::get(&conn, pid)?], tasks::list_for_project(&conn, pid)?),
        None => {
            let mut ps = projects::list_active(&conn)?;
            ps.extend(projects::list_archived(&conn)?);
            let ts = tasks::list_all_active(&conn)?;
            (ps, ts)
        }
    };
    let bundle = Bundle { projects: all_projects, tasks: all_tasks };
    let json = serde_json::to_string_pretty(&bundle)?;
    fs::write(&output_path, json)?;
    Ok(output_path)
}

#[tauri::command]
pub fn export_markdown(db: State<'_, DbState>, output_path: String, start: Option<String>, end_exclusive: Option<String>) -> AppResult<String> {
    let conn = db.0.lock().unwrap();
    let all_projects = projects::list_active(&conn)?;
    let mut md = String::from("# pm · 数据导出\n\n");
    for p in &all_projects {
        md.push_str(&format!("## {}\n\n", p.name));
        let task_list = tasks::list_for_project(&conn, p.id)?;
        let filtered: Vec<_> = task_list.iter().filter(|t| {
            match (&start, &end_exclusive, &t.completed_at) {
                (Some(s), Some(e), Some(c)) => c.as_str() >= s.as_str() && c.as_str() < e.as_str(),
                _ => true,
            }
        }).collect();
        for t in filtered {
            let mark = match t.status.as_str() {
                "done" => "[x]",
                "in_progress" => "[~]",
                _ => "[ ]",
            };
            md.push_str(&format!("- {} {}\n", mark, t.name));
        }
        md.push('\n');
    }
    fs::write(&output_path, md)?;
    Ok(output_path)
}
