//! 加密模块 - 处理主密码和数据加密

use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use rand::Rng;
use std::fs;
use std::path::PathBuf;

/// 主密码管理器
pub struct MasterPassword {
    config_path: PathBuf,
}

impl MasterPassword {
    /// 创建新的主密码管理器
    pub fn new(app_data_dir: PathBuf) -> Self {
        Self {
            config_path: app_data_dir.join("master.key"),
        }
    }

    /// 检查是否已设置主密码
    pub fn is_set(&self) -> bool {
        self.config_path.exists()
    }

    /// 设置主密码（首次使用）
    pub fn set(&self, password: &str) -> Result<(), String> {
        if self.is_set() {
            return Err("主密码已存在".to_string());
        }

        let hash = self.hash_password(password)?;
        
        // 确保目录存在
        if let Some(parent) = self.config_path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        
        fs::write(&self.config_path, hash).map_err(|e| e.to_string())?;
        Ok(())
    }

    /// 验证主密码
    pub fn verify(&self, password: &str) -> Result<bool, String> {
        if !self.is_set() {
            return Err("主密码未设置".to_string());
        }

        let stored_hash = fs::read_to_string(&self.config_path).map_err(|e| e.to_string())?;
        
        let parsed_hash = PasswordHash::new(&stored_hash)
            .map_err(|e| format!("解析密码哈希失败: {}", e))?;
        
        Ok(Argon2::default()
            .verify_password(password.as_bytes(), &parsed_hash)
            .is_ok())
    }

    /// 修改主密码
    pub fn change(&self, old_password: &str, new_password: &str) -> Result<(), String> {
        // 先验证旧密码
        if !self.verify(old_password)? {
            return Err("旧密码错误".to_string());
        }

        // 生成新密码哈希
        let hash = self.hash_password(new_password)?;
        fs::write(&self.config_path, hash).map_err(|e| e.to_string())?;
        
        Ok(())
    }

    /// 使用 Argon2 哈希密码
    fn hash_password(&self, password: &str) -> Result<String, String> {
        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        
        let password_hash = argon2
            .hash_password(password.as_bytes(), &salt)
            .map_err(|e| format!("密码哈希失败: {}", e))?;
        
        Ok(password_hash.to_string())
    }

    /// 从主密码派生加密密钥 (用于后续加密功能)
    pub fn derive_key(&self, password: &str) -> Result<[u8; 32], String> {
        // 使用固定的盐值派生密钥（与密码哈希使用的盐不同）
        let key_salt_path = self.config_path.with_extension("salt");
        
        let salt = if key_salt_path.exists() {
            fs::read(&key_salt_path).map_err(|e| e.to_string())?
        } else {
            let salt: [u8; 16] = rand::thread_rng().gen();
            fs::write(&key_salt_path, &salt).map_err(|e| e.to_string())?;
            salt.to_vec()
        };

        let mut key = [0u8; 32];
        Argon2::default()
            .hash_password_into(password.as_bytes(), &salt, &mut key)
            .map_err(|e| format!("密钥派生失败: {}", e))?;
        
        Ok(key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_master_password() {
        let temp_dir = TempDir::new().unwrap();
        let mp = MasterPassword::new(temp_dir.path().to_path_buf());

        // 初始状态未设置
        assert!(!mp.is_set());

        // 设置密码
        mp.set("test123").unwrap();
        assert!(mp.is_set());

        // 验证正确密码
        assert!(mp.verify("test123").unwrap());

        // 验证错误密码
        assert!(!mp.verify("wrong").unwrap());

        // 修改密码
        mp.change("test123", "newpass").unwrap();
        assert!(mp.verify("newpass").unwrap());
        assert!(!mp.verify("test123").unwrap());
    }
}
