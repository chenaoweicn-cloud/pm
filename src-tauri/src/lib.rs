pub mod commands;
pub mod db;
pub mod error;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  let db_path = db::resolve_db_path();
  let conn = db::init_connection(&db_path).expect("db init failed");

  tauri::Builder::default()
    .plugin(tauri_plugin_notification::init())
    .manage(db::DbState(std::sync::Mutex::new(conn)))
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      // trigger a backup on launch if last backup is >24h old
      tauri::async_runtime::spawn(async move {
        let dir = commands::backup::default_backup_dir_public();
        let should_backup = match std::fs::read_dir(&dir) {
          Ok(rd) => {
            let newest = rd
              .filter_map(|e| e.ok())
              .filter_map(|e| e.metadata().ok())
              .filter_map(|m| m.modified().ok())
              .max();
            match newest {
              Some(t) => t.elapsed().map(|d| d.as_secs() > 24 * 3600).unwrap_or(true),
              None => true,
            }
          }
          Err(_) => true,
        };
        if should_backup {
          let _ = commands::backup::perform_backup(&dir);
        }
      });
      // check due-date notifications on launch then every hour
      let notify_handle = app.handle().clone();
      tauri::async_runtime::spawn(async move {
        let _ = commands::notifications::check_and_notify(&notify_handle);
        loop {
          tokio::time::sleep(std::time::Duration::from_secs(3600)).await;
          let _ = commands::notifications::check_and_notify(&notify_handle);
        }
      });
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
      commands::tasks::create_task,
      commands::tasks::get_task,
      commands::tasks::list_tasks_for_project,
      commands::tasks::list_all_active_tasks,
      commands::tasks::update_task,
      commands::tasks::set_task_status,
      commands::tasks::soft_delete_task,
      commands::tasks::today_tasks,
      commands::tasks::completed_tasks_in_range,
      commands::tasks::in_progress_tasks,
      commands::tags::upsert_tag,
      commands::tags::list_tags,
      commands::tags::list_tags_for_task,
      commands::tags::attach_tag,
      commands::tags::detach_tag,
      commands::attachments::create_attachment,
      commands::attachments::list_attachments,
      commands::attachments::delete_attachment,
      commands::search::search_all,
      commands::trash::list_trash,
      commands::trash::restore_project,
      commands::trash::restore_task,
      commands::trash::purge_project,
      commands::trash::purge_task,
      commands::backup::backup_now,
      commands::backup::get_default_backup_dir,
      commands::export::export_json,
      commands::export::export_markdown,
      commands::notifications::check_notifications_now,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
