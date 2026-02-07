pub mod crypto;
pub mod db;
pub mod models;

use std::path::PathBuf;
use std::sync::OnceLock;
use tauri::Manager;

use crypto::MasterPassword;
use db::Database;
use models::PasswordRecord;

/// Global database instance
static DATABASE: OnceLock<Database> = OnceLock::new();
/// Global master password instance
static MASTER_PASSWORD: OnceLock<MasterPassword> = OnceLock::new();

/// Get database instance
fn get_db() -> &'static Database {
    DATABASE.get().expect("Database not initialized")
}

/// Get master password instance
fn get_master_password() -> &'static MasterPassword {
    MASTER_PASSWORD.get().expect("MasterPassword not initialized")
}

/// Initialize the database
fn init_database(app_data_dir: PathBuf) -> Result<(), String> {
    let db_path = app_data_dir.clone().join("passwords.db");
    let db = Database::new(db_path).map_err(|e| e.to_string())?;
    DATABASE.set(db).map_err(|_| "Database already initialized".to_string())?;
    
    let mp = MasterPassword::new(app_data_dir);
    MASTER_PASSWORD.set(mp).map_err(|_| "MasterPassword already initialized".to_string())?;
    
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

// ============ 主密码相关命令 ============

/// 检查是否已设置主密码
#[tauri::command]
fn is_master_password_set() -> bool {
    get_master_password().is_set()
}

/// 设置主密码（首次使用）
#[tauri::command]
fn set_master_password(password: String) -> Result<(), String> {
    get_master_password().set(&password)
}

/// 验证主密码
#[tauri::command]
fn verify_master_password(password: String) -> Result<bool, String> {
    get_master_password().verify(&password)
}

/// 修改主密码
#[tauri::command]
fn change_master_password(old_password: String, new_password: String) -> Result<(), String> {
    get_master_password().change(&old_password, &new_password)
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
            is_master_password_set,
            set_master_password,
            verify_master_password,
            change_master_password,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
