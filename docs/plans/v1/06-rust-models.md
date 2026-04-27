# Task 6: 定义 Rust 数据模型

**Files:**
- Create: `src-tauri/src/models.rs`
- Modify: `src-tauri/src/main.rs`（添加 `mod models;`）

- [ ] **Step 1: 创建 `src-tauri/src/models.rs`**

  ```rust
  use serde::{Deserialize, Serialize};

  #[derive(Debug, Clone, Serialize, Deserialize)]
  #[serde(rename_all = "camelCase")]
  pub struct Project {
      pub id: i64,
      pub name: String,
      pub status: String,          // "active" | "archived"
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
      pub status: String,          // "not_started" | "in_progress" | "done"
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
      pub r#type: String,          // "link" | "file"
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
      pub relation_type: String,   // "successor" | "related"
      pub note: Option<String>,
      pub created_at: String,
  }
  ```

- [ ] **Step 2: 在 `src-tauri/src/main.rs` 顶部加入**

  ```rust
  mod models;
  ```

- [ ] **Step 3: 验证编译**

  ```bash
  cd ~/Desktop/pm/src-tauri && cargo build
  ```

  Expected: 无错误（可能有 dead_code 警告，忽略）。

- [ ] **Step 4: Commit**

  ```bash
  cd ~/Desktop/pm && git add -A && git commit -m "feat(backend): 定义 Rust 数据模型"
  ```

