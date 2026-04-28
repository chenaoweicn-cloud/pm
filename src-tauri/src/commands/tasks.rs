use tauri::State;
use serde::Deserialize;
use crate::db::{DbState, tasks};
use crate::error::AppResult;
use crate::models::Task;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskInputDto {
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

impl From<TaskInputDto> for tasks::TaskInput {
    fn from(d: TaskInputDto) -> Self {
        Self {
            project_id: d.project_id,
            name: d.name,
            group_id: d.group_id,
            parent_task_id: d.parent_task_id,
            priority: d.priority,
            start_date: d.start_date,
            due_date: d.due_date,
            estimate_hours: d.estimate_hours,
            description: d.description,
        }
    }
}

#[tauri::command]
pub fn create_task(db: State<'_, DbState>, input: TaskInputDto) -> AppResult<Task> {
    let conn = db.0.lock().unwrap();
    tasks::create(&conn, input.into())
}

#[tauri::command]
pub fn get_task(db: State<'_, DbState>, id: i64) -> AppResult<Task> {
    let conn = db.0.lock().unwrap();
    tasks::get(&conn, id)
}

#[tauri::command]
pub fn list_tasks_for_project(db: State<'_, DbState>, project_id: i64) -> AppResult<Vec<Task>> {
    let conn = db.0.lock().unwrap();
    tasks::list_for_project(&conn, project_id)
}

#[tauri::command]
pub fn list_all_active_tasks(db: State<'_, DbState>) -> AppResult<Vec<Task>> {
    let conn = db.0.lock().unwrap();
    tasks::list_all_active(&conn)
}

#[tauri::command]
pub fn update_task(db: State<'_, DbState>, id: i64, input: TaskInputDto) -> AppResult<Task> {
    let conn = db.0.lock().unwrap();
    tasks::update(&conn, id, input.into())
}

#[tauri::command]
pub fn set_task_status(db: State<'_, DbState>, id: i64, status: String) -> AppResult<Task> {
    let conn = db.0.lock().unwrap();
    tasks::set_status(&conn, id, &status)
}

#[tauri::command]
pub fn soft_delete_task(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    tasks::soft_delete(&conn, id)
}

#[tauri::command]
pub fn today_tasks(db: State<'_, DbState>, today: String) -> AppResult<Vec<Task>> {
    let conn = db.0.lock().unwrap();
    tasks::today_tasks(&conn, &today)
}

#[tauri::command]
pub fn completed_tasks_in_range(db: State<'_, DbState>, start: String, end_exclusive: String, include_archived: bool) -> AppResult<Vec<Task>> {
    let conn = db.0.lock().unwrap();
    tasks::completed_in_range(&conn, &start, &end_exclusive, include_archived)
}

#[tauri::command]
pub fn in_progress_tasks(db: State<'_, DbState>, include_archived: bool) -> AppResult<Vec<Task>> {
    let conn = db.0.lock().unwrap();
    tasks::in_progress_tasks(&conn, include_archived)
}
