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
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
