use std::fs;
use std::path::PathBuf;
use crate::db::resolve_db_path;
use crate::error::{AppError, AppResult};

fn default_backup_dir() -> PathBuf {
    directories::UserDirs::new()
        .and_then(|u| u.document_dir().map(|d| d.join("pm-backups")))
        .unwrap_or_else(|| PathBuf::from("./pm-backups"))
}

pub fn default_backup_dir_public() -> PathBuf {
    default_backup_dir()
}

fn timestamp() -> String {
    chrono::Local::now().format("%Y%m%d-%H%M%S").to_string()
}

pub fn perform_backup(backup_dir: &std::path::Path) -> AppResult<PathBuf> {
    fs::create_dir_all(backup_dir)?;
    let src = resolve_db_path();
    if !src.exists() {
        return Err(AppError::NotFound("db file not found".into()));
    }
    let dst = backup_dir.join(format!("pm-{}.db", timestamp()));
    fs::copy(&src, &dst)?;
    // keep at most 30 backups, removing oldest first
    let mut entries: Vec<_> = fs::read_dir(backup_dir)?
        .filter_map(|e| e.ok())
        .filter(|e| e.path().extension().map(|s| s == "db").unwrap_or(false))
        .collect();
    entries.sort_by_key(|e| e.metadata().and_then(|m| m.modified()).ok());
    while entries.len() > 30 {
        let oldest = entries.remove(0);
        let _ = fs::remove_file(oldest.path());
    }
    Ok(dst)
}

#[tauri::command]
pub fn backup_now(custom_dir: Option<String>) -> AppResult<String> {
    let dir = custom_dir.map(PathBuf::from).unwrap_or_else(default_backup_dir);
    let path = perform_backup(&dir)?;
    Ok(path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_default_backup_dir() -> AppResult<String> {
    Ok(default_backup_dir().to_string_lossy().to_string())
}
