pub mod db;
pub mod models;

use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::Manager;

use db::Database;
use models::PasswordRecord;

/// Global database instance
static DATABASE: OnceLock<Database> = OnceLock::new();

/// Get database instance
fn get_db() -> &'static Database {
    DATABASE.get().expect("Database not initialized")
}

/// Initialize the database
fn init_database(app_data_dir: PathBuf) -> Result<(), String> {
    let db_path = app_data_dir.join("passwords.db");
    let db = Database::new(db_path).map_err(|e| e.to_string())?;
    DATABASE.set(db).map_err(|_| "Database already initialized".to_string())?;
    Ok(())
}

/// List password records
#[tauri::command]
fn list_records(search: String) -> Result<Vec<PasswordRecord>, String> {
    get_db()
        .list_records(&search)
        .map_err(|e| e.to_string())
}

/// Add a new password record
#[tauri::command]
fn add_record(record: PasswordRecord) -> Result<i64, String> {
    get_db()
        .add_record(&record)
        .map_err(|e| e.to_string())
}

/// Update an existing password record
#[tauri::command]
fn update_record(record: PasswordRecord) -> Result<(), String> {
    get_db()
        .update_record(&record)
        .map_err(|e| e.to_string())
}

/// Delete a password record
#[tauri::command]
fn delete_record(id: i64) -> Result<(), String> {
    get_db()
        .delete_record(id)
        .map_err(|e| e.to_string())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_fs::init())
        .setup(|app| {
            // Get app data directory
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");
            
            // Initialize database
            init_database(app_data_dir)?;
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            list_records,
            add_record,
            update_record,
            delete_record,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
