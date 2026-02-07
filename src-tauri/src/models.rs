use serde::{Deserialize, Serialize};

/// Password record structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PasswordRecord {
    pub id: i64,
    pub title: String,
    pub site_or_app: String,
    pub login_name: String,
    pub login_pass: String,
    pub remarks: String,
    pub category_id: Option<i64>,
    pub created_at: String,
    pub updated_at: String,
}

/// New password record (without id)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NewPasswordRecord {
    pub title: String,
    pub site_or_app: String,
    pub login_name: String,
    pub login_pass: String,
    pub remarks: String,
    pub category_id: Option<i64>,
}

/// Category structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Category {
    pub id: i64,
    pub name: String,
    pub icon: String,
    pub color: String,
    pub created_at: String,
}
