use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::sync::Mutex;
use chrono::Local;

use crate::models::PasswordRecord;

/// Database wrapper with thread-safe connection
pub struct Database {
    conn: Mutex<Connection>,
}

impl Database {
    /// Create a new database connection
    pub fn new(db_path: PathBuf) -> SqliteResult<Self> {
        // Ensure parent directory exists
        if let Some(parent) = db_path.parent() {
            std::fs::create_dir_all(parent).ok();
        }

        let conn = Connection::open(&db_path)?;
        let db = Self {
            conn: Mutex::new(conn),
        };
        db.init_schema()?;
        Ok(db)
    }

    /// Initialize database schema
    fn init_schema(&self) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "CREATE TABLE IF NOT EXISTS passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                site_or_app TEXT DEFAULT '',
                login_name TEXT DEFAULT '',
                login_pass TEXT DEFAULT '',
                remarks TEXT DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )",
            [],
        )?;
        Ok(())
    }

    /// Get current timestamp string
    fn now() -> String {
        Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
    }

    /// List all password records, optionally filtered by search term
    pub fn list_records(&self, search: &str) -> SqliteResult<Vec<PasswordRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = if search.is_empty() {
            conn.prepare(
                "SELECT id, title, site_or_app, login_name, login_pass, remarks, created_at, updated_at 
                 FROM passwords ORDER BY updated_at DESC"
            )?
        } else {
            conn.prepare(
                "SELECT id, title, site_or_app, login_name, login_pass, remarks, created_at, updated_at 
                 FROM passwords WHERE title LIKE ?1 ORDER BY updated_at DESC"
            )?
        };

        let rows = if search.is_empty() {
            stmt.query_map([], |row| {
                Ok(PasswordRecord {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    site_or_app: row.get(2)?,
                    login_name: row.get(3)?,
                    login_pass: row.get(4)?,
                    remarks: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?
        } else {
            let pattern = format!("%{}%", search);
            stmt.query_map([pattern], |row| {
                Ok(PasswordRecord {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    site_or_app: row.get(2)?,
                    login_name: row.get(3)?,
                    login_pass: row.get(4)?,
                    remarks: row.get(5)?,
                    created_at: row.get(6)?,
                    updated_at: row.get(7)?,
                })
            })?
        };

        let mut records = Vec::new();
        for row in rows {
            records.push(row?);
        }
        Ok(records)
    }

    /// Add a new password record
    pub fn add_record(&self, record: &PasswordRecord) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        let now = Self::now();
        conn.execute(
            "INSERT INTO passwords (title, site_or_app, login_name, login_pass, remarks, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            [
                &record.title,
                &record.site_or_app,
                &record.login_name,
                &record.login_pass,
                &record.remarks,
                &now,
                &now,
            ],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// Update an existing password record
    pub fn update_record(&self, record: &PasswordRecord) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        let now = Self::now();
        conn.execute(
            "UPDATE passwords SET title = ?1, site_or_app = ?2, login_name = ?3, 
             login_pass = ?4, remarks = ?5, updated_at = ?6 WHERE id = ?7",
            [
                &record.title,
                &record.site_or_app,
                &record.login_name,
                &record.login_pass,
                &record.remarks,
                &now,
                &record.id.to_string(),
            ],
        )?;
        Ok(())
    }

    /// Delete a password record by ID
    pub fn delete_record(&self, id: i64) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute("DELETE FROM passwords WHERE id = ?1", [id])?;
        Ok(())
    }

    /// Get a password record by ID
    pub fn get_record(&self, id: i64) -> SqliteResult<Option<PasswordRecord>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, title, site_or_app, login_name, login_pass, remarks, created_at, updated_at 
             FROM passwords WHERE id = ?1"
        )?;
        
        let mut rows = stmt.query([id])?;
        if let Some(row) = rows.next()? {
            Ok(Some(PasswordRecord {
                id: row.get(0)?,
                title: row.get(1)?,
                site_or_app: row.get(2)?,
                login_name: row.get(3)?,
                login_pass: row.get(4)?,
                remarks: row.get(5)?,
                created_at: row.get(6)?,
                updated_at: row.get(7)?,
            }))
        } else {
            Ok(None)
        }
    }
}
