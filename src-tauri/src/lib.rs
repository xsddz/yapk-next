pub mod crypto;
pub mod db;
pub mod models;

use std::path::PathBuf;
use std::sync::{OnceLock, RwLock};
use tauri::Manager;

use crypto::{
    MasterPassword, encrypt_string, decrypt_string, generate_password, PasswordGeneratorOptions,
    check_password_strength, find_reused_passwords, HealthReport, PasswordHealthResult, PasswordIssue,
};
use db::Database;
use models::{PasswordRecord, Category};

/// Global database instance
static DATABASE: OnceLock<Database> = OnceLock::new();
/// Global master password instance
static MASTER_PASSWORD: OnceLock<MasterPassword> = OnceLock::new();
/// Cached encryption key (set after successful login)
static ENCRYPTION_KEY: OnceLock<RwLock<Option<[u8; 32]>>> = OnceLock::new();

/// Get database instance
fn get_db() -> &'static Database {
    DATABASE.get().expect("Database not initialized")
}

/// Get master password instance
fn get_master_password() -> &'static MasterPassword {
    MASTER_PASSWORD.get().expect("MasterPassword not initialized")
}

/// Get encryption key (returns error if not unlocked)
fn get_encryption_key() -> Result<[u8; 32], String> {
    let lock = ENCRYPTION_KEY.get().ok_or("Encryption key not initialized")?;
    let guard = lock.read().map_err(|_| "Failed to read encryption key")?;
    guard.ok_or_else(|| "App is locked".to_string())
}

/// Set encryption key after successful login
fn set_encryption_key(key: [u8; 32]) -> Result<(), String> {
    let lock = ENCRYPTION_KEY.get_or_init(|| RwLock::new(None));
    let mut guard = lock.write().map_err(|_| "Failed to write encryption key")?;
    *guard = Some(key);
    Ok(())
}

/// Clear encryption key (lock the app)
fn clear_encryption_key() -> Result<(), String> {
    let lock = ENCRYPTION_KEY.get().ok_or("Encryption key not initialized")?;
    let mut guard = lock.write().map_err(|_| "Failed to write encryption key")?;
    *guard = None;
    Ok(())
}

/// Initialize the database
fn init_database(app_data_dir: PathBuf) -> Result<(), String> {
    let db_path = app_data_dir.clone().join("passwords.db");
    let db = Database::new(db_path).map_err(|e| e.to_string())?;
    DATABASE.set(db).map_err(|_| "Database already initialized".to_string())?;
    
    let mp = MasterPassword::new(app_data_dir);
    MASTER_PASSWORD.set(mp).map_err(|_| "MasterPassword already initialized".to_string())?;
    
    // Initialize encryption key container
    ENCRYPTION_KEY.get_or_init(|| RwLock::new(None));
    
    Ok(())
}

/// Decrypt password record for frontend
fn decrypt_record(mut record: PasswordRecord) -> Result<PasswordRecord, String> {
    let key = get_encryption_key()?;
    record.login_pass = decrypt_string(&record.login_pass, &key)?;
    Ok(record)
}

/// Encrypt password record for storage
fn encrypt_record(mut record: PasswordRecord) -> Result<PasswordRecord, String> {
    let key = get_encryption_key()?;
    record.login_pass = encrypt_string(&record.login_pass, &key)?;
    Ok(record)
}

/// List password records (with decryption)
#[tauri::command]
fn list_records(search: String) -> Result<Vec<PasswordRecord>, String> {
    let records = get_db()
        .list_records(&search)
        .map_err(|e| e.to_string())?;
    
    // Decrypt each record's password
    records.into_iter()
        .map(decrypt_record)
        .collect()
}

/// Add a new password record (with encryption)
#[tauri::command]
fn add_record(record: PasswordRecord) -> Result<i64, String> {
    let encrypted_record = encrypt_record(record)?;
    get_db()
        .add_record(&encrypted_record)
        .map_err(|e| e.to_string())
}

/// Update an existing password record (with encryption)
#[tauri::command]
fn update_record(record: PasswordRecord) -> Result<(), String> {
    let encrypted_record = encrypt_record(record)?;
    get_db()
        .update_record(&encrypted_record)
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
    let mp = get_master_password();
    mp.set(&password)?;
    
    // 派生并设置加密密钥
    let key = mp.derive_key(&password)?;
    set_encryption_key(key)?;
    
    Ok(())
}

/// 验证主密码并解锁
#[tauri::command]
fn verify_master_password(password: String) -> Result<bool, String> {
    let mp = get_master_password();
    let is_valid = mp.verify(&password)?;
    
    if is_valid {
        // 派生并设置加密密钥
        let key = mp.derive_key(&password)?;
        set_encryption_key(key)?;
    }
    
    Ok(is_valid)
}

/// 修改主密码
#[tauri::command]
fn change_master_password(old_password: String, new_password: String) -> Result<(), String> {
    let mp = get_master_password();
    
    // 获取旧密钥
    let old_key = mp.derive_key(&old_password)?;
    
    // 修改主密码
    mp.change(&old_password, &new_password)?;
    
    // 派生新密钥
    let new_key = mp.derive_key(&new_password)?;
    
    // 重新加密所有密码记录
    let records = get_db().list_records("").map_err(|e| e.to_string())?;
    for mut record in records {
        // 用旧密钥解密
        record.login_pass = decrypt_string(&record.login_pass, &old_key)?;
        // 用新密钥加密
        record.login_pass = encrypt_string(&record.login_pass, &new_key)?;
        // 更新记录
        get_db().update_record(&record).map_err(|e| e.to_string())?;
    }
    
    // 更新缓存的密钥
    set_encryption_key(new_key)?;
    
    Ok(())
}

/// 锁定应用
#[tauri::command]
fn lock_app() -> Result<(), String> {
    clear_encryption_key()
}

// ============ 密码生成器 ============

/// 生成随机密码
#[tauri::command]
fn generate_random_password(options: PasswordGeneratorOptions) -> Result<String, String> {
    generate_password(&options)
}

// ============ 密码健康检查 ============

/// 检查所有密码的健康状态
#[tauri::command]
fn check_passwords_health() -> Result<HealthReport, String> {
    let key = get_encryption_key()?;
    
    // 获取所有记录
    let records = get_db().list_records("").map_err(|e| e.to_string())?;
    
    // 解密所有密码
    let passwords: Vec<(i64, String)> = records
        .iter()
        .map(|r| {
            let decrypted = decrypt_string(&r.login_pass, &key).unwrap_or_default();
            (r.id, decrypted)
        })
        .collect();
    
    // 检测重复密码
    let reused_map = find_reused_passwords(&passwords);
    
    // 计算重复密码组数 (每组只算一次)
    let reused_count = reused_map.len() / 2;
    
    // 检查每个密码的健康状态
    let mut results = Vec::new();
    let mut weak_count = 0;
    
    for (id, password) in &passwords {
        let (strength, score, mut issues) = check_password_strength(password);
        
        // 添加重复密码问题
        if let Some(duplicate_ids) = reused_map.get(id) {
            issues.push(PasswordIssue {
                issue_type: "reused".to_string(),
                message: format!("此密码与其他 {} 个账户重复", duplicate_ids.len()),
            });
        }
        
        if strength == crypto::PasswordStrength::Weak {
            weak_count += 1;
        }
        
        results.push(PasswordHealthResult {
            record_id: *id,
            strength,
            score,
            issues,
        });
    }
    
    Ok(HealthReport {
        total_count: records.len(),
        weak_count,
        reused_count,
        results,
    })
}

// ============ 分类管理 ============

/// 获取所有分类
#[tauri::command]
fn list_categories() -> Result<Vec<Category>, String> {
    get_db()
        .list_categories()
        .map_err(|e| e.to_string())
}

/// 添加分类
#[tauri::command]
fn add_category(name: String, icon: String, color: String) -> Result<i64, String> {
    get_db()
        .add_category(&name, &icon, &color)
        .map_err(|e| e.to_string())
}

/// 更新分类
#[tauri::command]
fn update_category(id: i64, name: String, icon: String, color: String) -> Result<(), String> {
    get_db()
        .update_category(id, &name, &icon, &color)
        .map_err(|e| e.to_string())
}

/// 删除分类
#[tauri::command]
fn delete_category(id: i64) -> Result<(), String> {
    get_db()
        .delete_category(id)
        .map_err(|e| e.to_string())
}

/// 获取分类密码数量统计
#[tauri::command]
fn get_category_counts() -> Result<Vec<(Option<i64>, i64)>, String> {
    get_db()
        .get_category_counts()
        .map_err(|e| e.to_string())
}

/// 按分类筛选记录
#[tauri::command]
fn list_records_by_category(category_id: Option<i64>) -> Result<Vec<PasswordRecord>, String> {
    let records = get_db()
        .list_records_by_category(category_id)
        .map_err(|e| e.to_string())?;
    
    // Decrypt each record's password
    records.into_iter()
        .map(decrypt_record)
        .collect()
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
            lock_app,
            generate_random_password,
            check_passwords_health,
            list_categories,
            add_category,
            update_category,
            delete_category,
            get_category_counts,
            list_records_by_category,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
