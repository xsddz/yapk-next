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

/// Export data structure
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportData {
    pub version: String,
    pub exported_at: String,
    pub encrypted: bool,
    pub categories: Vec<ExportCategory>,
    pub records: Vec<ExportRecord>,
}

/// Export category (without id)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportCategory {
    pub name: String,
    pub icon: String,
    pub color: String,
}

/// Export record (without id, with category name)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportRecord {
    pub title: String,
    pub site_or_app: String,
    pub login_name: String,
    pub login_pass: String,
    pub remarks: String,
    pub category_name: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}
