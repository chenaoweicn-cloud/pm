pub mod commands;
pub mod db;
pub mod error;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let db_path = db::resolve_db_path();
  let conn = db::init_connection(&db_path).expect("db init failed");

  tauri::Builder::default()
    .manage(db::DbState(std::sync::Mutex::new(conn)))
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      commands::ping,
      commands::projects::create_project,
      commands::projects::list_active_projects,
      commands::projects::list_archived_projects,
      commands::projects::get_project,
      commands::projects::update_project,
      commands::projects::archive_project,
      commands::projects::unarchive_project,
      commands::projects::soft_delete_project,
      commands::project_relations::create_project_relation,
      commands::project_relations::list_project_relations,
      commands::project_relations::delete_project_relation,
      commands::task_groups::create_task_group,
      commands::task_groups::list_task_groups,
      commands::task_groups::rename_task_group,
      commands::task_groups::delete_task_group,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
