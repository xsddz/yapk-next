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

// ============ AES-256-GCM 加密/解密 ============

use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

/// 使用 AES-256-GCM 加密字符串
/// 返回 Base64 编码的密文 (nonce + ciphertext)
pub fn encrypt_string(plaintext: &str, key: &[u8; 32]) -> Result<String, String> {
    if plaintext.is_empty() {
        return Ok(String::new());
    }

    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| format!("创建加密器失败: {}", e))?;
    
    // 生成随机 12 字节 nonce
    let nonce_bytes: [u8; 12] = rand::thread_rng().gen();
    let nonce = Nonce::from_slice(&nonce_bytes);
    
    let ciphertext = cipher
        .encrypt(nonce, plaintext.as_bytes())
        .map_err(|e| format!("加密失败: {}", e))?;
    
    // 将 nonce 和密文拼接后 Base64 编码
    let mut combined = nonce_bytes.to_vec();
    combined.extend(ciphertext);
    
    Ok(BASE64.encode(combined))
}

/// 使用 AES-256-GCM 解密字符串
/// 输入为 Base64 编码的密文 (nonce + ciphertext)
pub fn decrypt_string(ciphertext: &str, key: &[u8; 32]) -> Result<String, String> {
    if ciphertext.is_empty() {
        return Ok(String::new());
    }

    let combined = BASE64.decode(ciphertext)
        .map_err(|e| format!("Base64 解码失败: {}", e))?;
    
    if combined.len() < 12 {
        return Err("密文格式错误".to_string());
    }
    
    let (nonce_bytes, ciphertext_bytes) = combined.split_at(12);
    let nonce = Nonce::from_slice(nonce_bytes);
    
    let cipher = Aes256Gcm::new_from_slice(key)
        .map_err(|e| format!("创建解密器失败: {}", e))?;
    
    let plaintext = cipher
        .decrypt(nonce, ciphertext_bytes)
        .map_err(|e| format!("解密失败: {}", e))?;
    
    String::from_utf8(plaintext)
        .map_err(|e| format!("UTF-8 解码失败: {}", e))
}

// ============ 密码生成器 ============

use serde::{Deserialize, Serialize};

/// 密码生成选项
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasswordGeneratorOptions {
    /// 密码长度
    pub length: usize,
    /// 包含大写字母
    pub uppercase: bool,
    /// 包含小写字母
    pub lowercase: bool,
    /// 包含数字
    pub numbers: bool,
    /// 包含特殊符号
    pub symbols: bool,
    /// 排除易混淆字符 (0, O, l, 1, I 等)
    pub exclude_ambiguous: bool,
}

impl Default for PasswordGeneratorOptions {
    fn default() -> Self {
        Self {
            length: 16,
            uppercase: true,
            lowercase: true,
            numbers: true,
            symbols: true,
            exclude_ambiguous: true,
        }
    }
}

/// 生成随机密码
pub fn generate_password(options: &PasswordGeneratorOptions) -> Result<String, String> {
    if options.length == 0 {
        return Err("密码长度必须大于 0".to_string());
    }
    
    if options.length > 128 {
        return Err("密码长度不能超过 128".to_string());
    }

    let mut charset = String::new();
    
    // 定义字符集
    let uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lowercase = "abcdefghijklmnopqrstuvwxyz";
    let numbers = "0123456789";
    let symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";
    
    // 易混淆字符
    let ambiguous = "0OlI1";

    if options.uppercase {
        charset.push_str(uppercase);
    }
    if options.lowercase {
        charset.push_str(lowercase);
    }
    if options.numbers {
        charset.push_str(numbers);
    }
    if options.symbols {
        charset.push_str(symbols);
    }

    // 排除易混淆字符
    if options.exclude_ambiguous {
        charset = charset.chars().filter(|c| !ambiguous.contains(*c)).collect();
    }

    if charset.is_empty() {
        return Err("至少选择一种字符类型".to_string());
    }

    let charset: Vec<char> = charset.chars().collect();
    let mut rng = rand::thread_rng();
    
    let password: String = (0..options.length)
        .map(|_| {
            let idx = rng.gen_range(0..charset.len());
            charset[idx]
        })
        .collect();

    // 确保密码包含所有选中的字符类型
    let has_upper = !options.uppercase || password.chars().any(|c| c.is_ascii_uppercase());
    let has_lower = !options.lowercase || password.chars().any(|c| c.is_ascii_lowercase());
    let has_number = !options.numbers || password.chars().any(|c| c.is_ascii_digit());
    let has_symbol = !options.symbols || password.chars().any(|c| symbols.contains(c));

    // 如果缺少某类字符，递归重新生成
    if !has_upper || !has_lower || !has_number || !has_symbol {
        return generate_password(options);
    }

    Ok(password)
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
