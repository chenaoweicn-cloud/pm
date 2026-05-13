use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Project {
    pub id: i64,
    pub name: String,
    pub status: String, // "active" | "archived"
    pub r#type: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub archived_at: Option<String>,
    pub deleted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub id: i64,
    pub project_id: i64,
    pub group_id: Option<i64>,
    pub parent_task_id: Option<i64>,
    pub name: String,
    pub status: String, // "not_started" | "in_progress" | "done"
    pub priority: Option<String>,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
    pub estimate_hours: Option<f64>,
    pub description: Option<String>,
    pub completed_at: Option<String>,
    pub deleted_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskGroup {
    pub id: i64,
    pub project_id: i64,
    pub name: String,
    pub sort_order: i64,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TaskAttachment {
    pub id: i64,
    pub task_id: i64,
    pub r#type: String, // "link" | "file"
    pub url_or_path: String,
    pub label: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectRelation {
    pub id: i64,
    pub from_project_id: i64,
    pub to_project_id: i64,
    pub relation_type: String, // "successor" | "related"
    pub note: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiModel {
    pub id: i64,
    pub display_name: String,
    pub base_url: String,
    pub model_name: String,
    #[serde(skip)]
    pub key_ref: String,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AiInboxItem {
    pub id: i64,
    pub raw_input: String,
    pub parsed_name: String,
    pub parsed_description: Option<String>,
    pub priority: Option<String>,
    pub start_date: Option<String>,
    pub due_date: Option<String>,
    pub project_candidate_id: Option<i64>,
    pub confidence: f64,
    pub status: String,
    pub model_id: Option<i64>,
    pub created_task_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}
