use chrono::Local;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::io::Write;
use std::process::{Command, Stdio};
use tauri::State;

use crate::commands::tasks::TaskInputDto;
use crate::db::{ai_inbox, ai_models, projects, tasks, DbState};
use crate::error::{AppError, AppResult};
use crate::models::{AiInboxItem, AiModel, Project, Task};

const AI_KEYCHAIN_SERVICE: &str = "pm.ai_model";
const AUTO_CREATE_CONFIDENCE: f64 = 0.8;

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SaveAiModelInput {
    pub id: Option<i64>,
    pub display_name: String,
    pub base_url: String,
    pub model_name: String,
    pub api_key: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCaptureFailure {
    pub raw_input: String,
    pub reason: String,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AiCaptureResult {
    pub created: Vec<Task>,
    pub inbox_items: Vec<AiInboxItem>,
    pub failed: Vec<AiCaptureFailure>,
}

trait KeyStore {
    fn set_api_key(&self, key_ref: &str, api_key: &str) -> AppResult<()>;
    fn get_api_key(&self, key_ref: &str) -> AppResult<String>;
    fn delete_api_key(&self, key_ref: &str) -> AppResult<()>;
}

struct SecurityKeyStore;

impl SecurityKeyStore {
    fn command_error(action: &str, output: std::process::Output) -> AppError {
        let stderr = String::from_utf8_lossy(&output.stderr).trim().to_string();
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        let detail = if stderr.is_empty() { stdout } else { stderr };
        AppError::Invalid(format!("Keychain {} failed: {}", action, detail))
    }
}

impl KeyStore for SecurityKeyStore {
    fn set_api_key(&self, key_ref: &str, api_key: &str) -> AppResult<()> {
        let output = Command::new("security")
            .args([
                "add-generic-password",
                "-a",
                key_ref,
                "-s",
                AI_KEYCHAIN_SERVICE,
                "-w",
                api_key,
                "-U",
            ])
            .output()?;
        if output.status.success() {
            Ok(())
        } else {
            Err(Self::command_error("save", output))
        }
    }

    fn get_api_key(&self, key_ref: &str) -> AppResult<String> {
        let output = Command::new("security")
            .args([
                "find-generic-password",
                "-a",
                key_ref,
                "-s",
                AI_KEYCHAIN_SERVICE,
                "-w",
            ])
            .output()?;
        if output.status.success() {
            Ok(String::from_utf8_lossy(&output.stdout)
                .trim_end()
                .to_string())
        } else {
            Err(Self::command_error("read", output))
        }
    }

    fn delete_api_key(&self, key_ref: &str) -> AppResult<()> {
        let output = Command::new("security")
            .args([
                "delete-generic-password",
                "-a",
                key_ref,
                "-s",
                AI_KEYCHAIN_SERVICE,
            ])
            .output()?;
        if output.status.success() {
            Ok(())
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            if stderr.contains("could not be found")
                || stderr.contains("The specified item could not be found")
            {
                Ok(())
            } else {
                Err(Self::command_error("delete", output))
            }
        }
    }
}

trait AiChatClient {
    fn capture_tasks(
        &self,
        model: &AiModel,
        api_key: &str,
        today: &str,
        active_projects: &[Project],
        text: &str,
    ) -> AppResult<String>;
}

struct CurlAiChatClient;

impl AiChatClient for CurlAiChatClient {
    fn capture_tasks(
        &self,
        model: &AiModel,
        api_key: &str,
        today: &str,
        active_projects: &[Project],
        text: &str,
    ) -> AppResult<String> {
        let url = format!("{}/chat/completions", model.base_url.trim_end_matches('/'));
        let payload = build_chat_payload(model, today, active_projects, text)?;
        let payload_text = serde_json::to_string(&payload)?;

        let mut child = Command::new("curl")
            .args([
                "-sS",
                "-X",
                "POST",
                &url,
                "-H",
                "Content-Type: application/json",
                "-H",
                &format!("Authorization: Bearer {}", api_key),
                "--data-binary",
                "@-",
            ])
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()?;

        if let Some(stdin) = child.stdin.as_mut() {
            stdin.write_all(payload_text.as_bytes())?;
        }

        let output = child.wait_with_output()?;
        if !output.status.success() {
            return Err(AppError::Invalid(format!(
                "AI 请求失败: {}",
                String::from_utf8_lossy(&output.stderr).trim()
            )));
        }

        let response: Value = serde_json::from_slice(&output.stdout)?;
        if let Some(error) = response.get("error") {
            return Err(AppError::Invalid(format!("AI 返回错误: {}", error)));
        }

        response
            .pointer("/choices/0/message/content")
            .and_then(Value::as_str)
            .map(ToString::to_string)
            .ok_or_else(|| AppError::Invalid("AI 返回缺少 choices[0].message.content".into()))
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase")]
struct AiParsedTask {
    name: Option<String>,
    description: Option<String>,
    project_id: Option<i64>,
    priority: Option<String>,
    start_date: Option<String>,
    due_date: Option<String>,
    confidence: Option<f64>,
    raw_text: Option<String>,
}

#[tauri::command]
pub fn list_ai_models(db: State<'_, DbState>) -> AppResult<Vec<AiModel>> {
    let conn = db.0.lock().unwrap();
    ai_models::list(&conn)
}

#[tauri::command]
pub fn get_active_ai_model(db: State<'_, DbState>) -> AppResult<Option<AiModel>> {
    let conn = db.0.lock().unwrap();
    ai_models::get_active(&conn)
}

#[tauri::command]
pub fn save_ai_model(db: State<'_, DbState>, input: SaveAiModelInput) -> AppResult<AiModel> {
    let conn = db.0.lock().unwrap();
    save_ai_model_with_store(&conn, input, &SecurityKeyStore)
}

#[tauri::command]
pub fn delete_ai_model(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    delete_ai_model_with_store(&conn, id, &SecurityKeyStore)
}

#[tauri::command]
pub fn set_active_ai_model(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    ai_models::set_active(&conn, id)
}

#[tauri::command]
pub fn ai_capture_tasks(db: State<'_, DbState>, text: String) -> AppResult<AiCaptureResult> {
    let conn = db.0.lock().unwrap();
    let today = Local::now().format("%Y-%m-%d").to_string();
    capture_tasks_with_services(&conn, &text, &today, &SecurityKeyStore, &CurlAiChatClient)
}

#[tauri::command]
pub fn list_ai_inbox_items(
    db: State<'_, DbState>,
    status: Option<String>,
) -> AppResult<Vec<AiInboxItem>> {
    let conn = db.0.lock().unwrap();
    ai_inbox::list(&conn, status.as_deref())
}

#[tauri::command]
pub fn count_pending_ai_inbox_items(db: State<'_, DbState>) -> AppResult<i64> {
    let conn = db.0.lock().unwrap();
    ai_inbox::count_pending(&conn)
}

#[tauri::command]
pub fn convert_ai_inbox_item(
    db: State<'_, DbState>,
    id: i64,
    input: TaskInputDto,
) -> AppResult<Task> {
    let conn = db.0.lock().unwrap();
    ai_inbox::convert(&conn, id, input.into())
}

#[tauri::command]
pub fn dismiss_ai_inbox_item(db: State<'_, DbState>, id: i64) -> AppResult<()> {
    let conn = db.0.lock().unwrap();
    ai_inbox::dismiss(&conn, id)
}

fn save_ai_model_with_store(
    conn: &rusqlite::Connection,
    input: SaveAiModelInput,
    key_store: &dyn KeyStore,
) -> AppResult<AiModel> {
    let api_key = input
        .api_key
        .as_deref()
        .map(str::trim)
        .filter(|key| !key.is_empty());

    if let Some(id) = input.id {
        let model = ai_models::update(
            conn,
            id,
            &input.display_name,
            &input.base_url,
            &input.model_name,
        )?;
        if let Some(api_key) = api_key {
            key_store.set_api_key(&model.key_ref, api_key)?;
        }
        Ok(model)
    } else {
        let Some(api_key) = api_key else {
            return Err(AppError::Invalid("新增模型必须填写 API Key".into()));
        };
        let model = ai_models::create(
            conn,
            &input.display_name,
            &input.base_url,
            &input.model_name,
        )?;
        if let Err(err) = key_store.set_api_key(&model.key_ref, api_key) {
            let _ = ai_models::delete(conn, model.id);
            return Err(err);
        }
        Ok(model)
    }
}

fn delete_ai_model_with_store(
    conn: &rusqlite::Connection,
    id: i64,
    key_store: &dyn KeyStore,
) -> AppResult<()> {
    let model = ai_models::delete(conn, id)?;
    key_store.delete_api_key(&model.key_ref)?;
    Ok(())
}

fn capture_tasks_with_services(
    conn: &rusqlite::Connection,
    text: &str,
    today: &str,
    key_store: &dyn KeyStore,
    ai_client: &dyn AiChatClient,
) -> AppResult<AiCaptureResult> {
    if text.trim().is_empty() {
        return Err(AppError::Invalid("AI Inbox 输入不能为空".into()));
    }

    let model = ai_models::get_active(conn)?
        .ok_or_else(|| AppError::Invalid("未配置当前 AI 模型".into()))?;
    let api_key = key_store.get_api_key(&model.key_ref)?;
    let active_projects = projects::list_active(conn)?;
    let content = ai_client.capture_tasks(&model, &api_key, today, &active_projects, text)?;
    let parsed_tasks = parse_ai_tasks(&content)?;

    route_parsed_tasks(conn, text, &model, &active_projects, parsed_tasks)
}

fn route_parsed_tasks(
    conn: &rusqlite::Connection,
    original_text: &str,
    model: &AiModel,
    active_projects: &[Project],
    parsed_tasks: Vec<AiParsedTask>,
) -> AppResult<AiCaptureResult> {
    let mut created = Vec::new();
    let mut inbox_items = Vec::new();
    let mut failed = Vec::new();

    for parsed in parsed_tasks {
        let raw_input = normalize_optional_string(parsed.raw_text.as_deref())
            .unwrap_or_else(|| original_text.trim().to_string());
        let name = normalize_optional_string(parsed.name.as_deref());
        let confidence = parsed.confidence.unwrap_or(0.0).clamp(0.0, 1.0);

        let Some(name) = name else {
            failed.push(AiCaptureFailure {
                raw_input,
                reason: "任务名称为空".into(),
            });
            continue;
        };

        let priority = normalize_priority(parsed.priority.as_deref())?;
        let start_date = normalize_optional_string(parsed.start_date.as_deref());
        let due_date = normalize_optional_string(parsed.due_date.as_deref());
        let description = normalize_optional_string(parsed.description.as_deref());
        let project_candidate_id = match parsed.project_id {
            Some(project_id) if project_exists(conn, project_id)? => Some(project_id),
            _ => None,
        };
        let active_project_id = parsed.project_id.filter(|project_id| {
            active_projects
                .iter()
                .any(|project| project.id == *project_id)
        });

        if confidence >= AUTO_CREATE_CONFIDENCE {
            if let Some(project_id) = active_project_id {
                match tasks::create(
                    conn,
                    tasks::TaskInput {
                        project_id,
                        name: name.clone(),
                        priority: priority.clone(),
                        start_date: start_date.clone(),
                        due_date: due_date.clone(),
                        description: description.clone(),
                        ..Default::default()
                    },
                ) {
                    Ok(task) => {
                        created.push(task);
                        continue;
                    }
                    Err(err) => {
                        let fallback_description = match description {
                            Some(value) => Some(format!("{}\n创建失败: {}", value, err)),
                            None => Some(format!("创建失败: {}", err)),
                        };
                        let item = ai_inbox::create(
                            conn,
                            ai_inbox::AiInboxInput {
                                raw_input,
                                parsed_name: name,
                                parsed_description: fallback_description,
                                priority,
                                start_date,
                                due_date,
                                project_candidate_id: Some(project_id),
                                confidence,
                                model_id: Some(model.id),
                            },
                        )?;
                        inbox_items.push(item);
                        continue;
                    }
                }
            }
        }

        let item = ai_inbox::create(
            conn,
            ai_inbox::AiInboxInput {
                raw_input,
                parsed_name: name,
                parsed_description: description,
                priority,
                start_date,
                due_date,
                project_candidate_id,
                confidence,
                model_id: Some(model.id),
            },
        )?;
        inbox_items.push(item);
    }

    Ok(AiCaptureResult {
        created,
        inbox_items,
        failed,
    })
}

fn project_exists(conn: &rusqlite::Connection, id: i64) -> AppResult<bool> {
    let count: i64 = conn.query_row(
        "SELECT count(*) FROM projects WHERE id=?1 AND deleted_at IS NULL",
        [id],
        |row| row.get(0),
    )?;
    Ok(count == 1)
}

fn normalize_optional_string(value: Option<&str>) -> Option<String> {
    value
        .map(str::trim)
        .filter(|value| !value.is_empty())
        .map(ToString::to_string)
}

fn normalize_priority(value: Option<&str>) -> AppResult<Option<String>> {
    match normalize_optional_string(value).as_deref() {
        None => Ok(None),
        Some("high") => Ok(Some("high".into())),
        Some("medium") => Ok(Some("medium".into())),
        Some("low") => Ok(Some("low".into())),
        Some(other) => Err(AppError::Invalid(format!("AI 返回了无效优先级: {}", other))),
    }
}

fn parse_ai_tasks(content: &str) -> AppResult<Vec<AiParsedTask>> {
    let cleaned = strip_json_fence(content);
    let value: Value = serde_json::from_str(&cleaned)?;
    let tasks_value = if value.is_array() {
        value
    } else {
        value
            .get("tasks")
            .cloned()
            .ok_or_else(|| AppError::Invalid("AI JSON 缺少 tasks 数组".into()))?
    };
    let tasks: Vec<AiParsedTask> = serde_json::from_value(tasks_value)?;
    Ok(tasks)
}

fn strip_json_fence(content: &str) -> String {
    let trimmed = content.trim();
    if let Some(without_prefix) = trimmed.strip_prefix("```json") {
        without_prefix.trim_end_matches("```").trim().to_string()
    } else if let Some(without_prefix) = trimmed.strip_prefix("```") {
        without_prefix.trim_end_matches("```").trim().to_string()
    } else {
        trimmed.to_string()
    }
}

fn build_chat_payload(
    model: &AiModel,
    today: &str,
    active_projects: &[Project],
    text: &str,
) -> AppResult<Value> {
    let project_context: Vec<Value> = active_projects
        .iter()
        .map(|project| {
            serde_json::json!({
                "id": project.id,
                "name": project.name,
            })
        })
        .collect();

    Ok(serde_json::json!({
        "model": model.model_name,
        "temperature": 0.1,
        "messages": [
            {
                "role": "system",
                "content": "你是 PM 软件的任务解析器。只返回严格 JSON，不要解释。输出格式为 {\"tasks\":[{\"name\":string,\"description\":string|null,\"projectId\":number|null,\"priority\":\"high\"|\"medium\"|\"low\"|null,\"startDate\":\"YYYY-MM-DD\"|null,\"dueDate\":\"YYYY-MM-DD\"|null,\"confidence\":number,\"rawText\":string}]}。只能使用提供的项目 ID，不要创建项目。"
            },
            {
                "role": "user",
                "content": format!(
                    "当前日期: {}\n活跃项目列表: {}\n用户输入: {}",
                    today,
                    serde_json::to_string(&project_context)?,
                    text
                )
            }
        ]
    }))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{ai_inbox, in_memory_for_test, projects};
    use std::cell::RefCell;
    use std::collections::HashMap;

    struct MemoryKeyStore {
        values: RefCell<HashMap<String, String>>,
        deleted: RefCell<Vec<String>>,
    }

    impl MemoryKeyStore {
        fn new() -> Self {
            Self {
                values: RefCell::new(HashMap::new()),
                deleted: RefCell::new(Vec::new()),
            }
        }
    }

    impl KeyStore for MemoryKeyStore {
        fn set_api_key(&self, key_ref: &str, api_key: &str) -> AppResult<()> {
            self.values
                .borrow_mut()
                .insert(key_ref.to_string(), api_key.to_string());
            Ok(())
        }

        fn get_api_key(&self, key_ref: &str) -> AppResult<String> {
            self.values
                .borrow()
                .get(key_ref)
                .cloned()
                .ok_or_else(|| AppError::NotFound(format!("key {}", key_ref)))
        }

        fn delete_api_key(&self, key_ref: &str) -> AppResult<()> {
            self.values.borrow_mut().remove(key_ref);
            self.deleted.borrow_mut().push(key_ref.to_string());
            Ok(())
        }
    }

    struct FakeAiClient {
        content: String,
    }

    impl AiChatClient for FakeAiClient {
        fn capture_tasks(
            &self,
            _model: &AiModel,
            _api_key: &str,
            _today: &str,
            _active_projects: &[Project],
            _text: &str,
        ) -> AppResult<String> {
            Ok(self.content.clone())
        }
    }

    fn save_model(conn: &rusqlite::Connection, key_store: &MemoryKeyStore) -> AiModel {
        save_ai_model_with_store(
            conn,
            SaveAiModelInput {
                id: None,
                display_name: "Test".into(),
                base_url: "https://example.test/v1".into(),
                model_name: "test-model".into(),
                api_key: Some("secret".into()),
            },
            key_store,
        )
        .unwrap()
    }

    #[test]
    fn save_edit_and_delete_model_uses_key_store_without_sqlite_plaintext() {
        let conn = in_memory_for_test();
        let key_store = MemoryKeyStore::new();
        let model = save_model(&conn, &key_store);

        assert_eq!(key_store.get_api_key(&model.key_ref).unwrap(), "secret");
        let stored_count: i64 = conn
            .query_row(
                "SELECT count(*) FROM ai_models WHERE key_ref LIKE '%secret%'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(stored_count, 0);

        let edited = save_ai_model_with_store(
            &conn,
            SaveAiModelInput {
                id: Some(model.id),
                display_name: "Edited".into(),
                base_url: "https://edited.test/v1".into(),
                model_name: "edited-model".into(),
                api_key: Some("".into()),
            },
            &key_store,
        )
        .unwrap();

        assert_eq!(edited.display_name, "Edited");
        assert_eq!(key_store.get_api_key(&model.key_ref).unwrap(), "secret");

        delete_ai_model_with_store(&conn, model.id, &key_store).unwrap();
        assert!(key_store.deleted.borrow().contains(&model.key_ref));
    }

    #[test]
    fn capture_routes_high_confidence_task_to_real_task() {
        let conn = in_memory_for_test();
        let key_store = MemoryKeyStore::new();
        save_model(&conn, &key_store);
        let project = projects::create(&conn, "A 项目", None, None, None).unwrap();
        let client = FakeAiClient {
            content: format!(
                r#"{{"tasks":[{{"name":"整理验收材料","description":null,"projectId":{},"priority":"high","startDate":null,"dueDate":"2026-05-15","confidence":0.91,"rawText":"A 项目整理验收材料"}}]}}"#,
                project.id
            ),
        };

        let result = capture_tasks_with_services(
            &conn,
            "A 项目整理验收材料",
            "2026-05-13",
            &key_store,
            &client,
        )
        .unwrap();

        assert_eq!(result.created.len(), 1);
        assert_eq!(result.created[0].project_id, project.id);
        assert_eq!(result.inbox_items.len(), 0);
    }

    #[test]
    fn capture_routes_low_confidence_and_missing_project_to_inbox() {
        let conn = in_memory_for_test();
        let key_store = MemoryKeyStore::new();
        save_model(&conn, &key_store);
        let project = projects::create(&conn, "A 项目", None, None, None).unwrap();
        let client = FakeAiClient {
            content: format!(
                r#"{{"tasks":[{{"name":"确认原型","description":null,"projectId":{},"priority":"medium","startDate":null,"dueDate":null,"confidence":0.4,"rawText":"确认原型"}},{{"name":"整理会议纪要","description":null,"projectId":null,"priority":null,"startDate":null,"dueDate":null,"confidence":0.0,"rawText":"整理会议纪要"}},{{"name":"不存在项目","description":null,"projectId":999999,"priority":null,"startDate":null,"dueDate":null,"confidence":0.95,"rawText":"不存在项目"}}]}}"#,
                project.id
            ),
        };

        let result = capture_tasks_with_services(
            &conn,
            "确认原型；整理会议纪要",
            "2026-05-13",
            &key_store,
            &client,
        )
        .unwrap();

        assert_eq!(result.created.len(), 0);
        assert_eq!(result.inbox_items.len(), 3);
        assert_eq!(result.inbox_items[2].project_candidate_id, None);
        assert_eq!(ai_inbox::count_pending(&conn).unwrap(), 3);
    }

    #[test]
    fn capture_handles_mixed_tasks_independently() {
        let conn = in_memory_for_test();
        let key_store = MemoryKeyStore::new();
        save_model(&conn, &key_store);
        let project = projects::create(&conn, "A 项目", None, None, None).unwrap();
        let client = FakeAiClient {
            content: format!(
                r#"{{"tasks":[{{"name":"自动创建","description":null,"projectId":{},"priority":"low","startDate":null,"dueDate":null,"confidence":0.95,"rawText":"自动创建"}},{{"name":"进入暂存","description":null,"projectId":null,"priority":"low","startDate":null,"dueDate":null,"confidence":0.2,"rawText":"进入暂存"}}]}}"#,
                project.id
            ),
        };

        let result = capture_tasks_with_services(
            &conn,
            "自动创建；进入暂存",
            "2026-05-13",
            &key_store,
            &client,
        )
        .unwrap();

        assert_eq!(result.created.len(), 1);
        assert_eq!(result.inbox_items.len(), 1);
    }

    #[test]
    fn capture_fails_without_active_model() {
        let conn = in_memory_for_test();
        let key_store = MemoryKeyStore::new();
        let client = FakeAiClient {
            content: r#"{"tasks":[]}"#.into(),
        };

        let result = capture_tasks_with_services(&conn, "test", "2026-05-13", &key_store, &client);

        assert!(result.is_err());
    }

    #[test]
    fn invalid_ai_json_does_not_create_tasks() {
        let conn = in_memory_for_test();
        let key_store = MemoryKeyStore::new();
        save_model(&conn, &key_store);
        let project = projects::create(&conn, "A 项目", None, None, None).unwrap();
        let client = FakeAiClient {
            content: "not json".into(),
        };

        let result = capture_tasks_with_services(&conn, "test", "2026-05-13", &key_store, &client);

        assert!(result.is_err());
        assert!(tasks::list_for_project(&conn, project.id)
            .unwrap()
            .is_empty());
    }
}
