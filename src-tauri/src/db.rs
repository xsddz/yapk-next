use rusqlite::{Connection, Result as SqliteResult};
use std::path::PathBuf;
use std::sync::Mutex;
use chrono::Local;

use crate::models::{PasswordRecord, Category};

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
        
        // Categories table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                icon TEXT DEFAULT '📁',
                color TEXT DEFAULT '#6b7280',
                created_at TEXT NOT NULL
            )",
            [],
        )?;
        
        // Passwords table
        conn.execute(
            "CREATE TABLE IF NOT EXISTS passwords (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                site_or_app TEXT DEFAULT '',
                login_name TEXT DEFAULT '',
                login_pass TEXT DEFAULT '',
                remarks TEXT DEFAULT '',
                category_id INTEGER,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
            )",
            [],
        )?;
        
        // Migration: add category_id column if not exists
        let _ = conn.execute(
            "ALTER TABLE passwords ADD COLUMN category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL",
            [],
        );
        
        Ok(())
    }

    /// Get current timestamp string
    fn now() -> String {
        Local::now().format("%Y-%m-%d %H:%M:%S").to_string()
    }

    /// List all password records, optionally filtered by search term
    pub fn list_records(&self, search: &str) -> SqliteResult<Vec<PasswordRecord>> {
        let conn = self.conn.lock().unwrap();
        
        let map_row = |row: &rusqlite::Row| -> rusqlite::Result<PasswordRecord> {
            Ok(PasswordRecord {
                id: row.get(0)?,
                title: row.get(1)?,
                site_or_app: row.get(2)?,
                login_name: row.get(3)?,
                login_pass: row.get(4)?,
                remarks: row.get(5)?,
                category_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        };

        let mut records = Vec::new();
        
        if search.is_empty() {
            let mut stmt = conn.prepare(
                "SELECT id, title, site_or_app, login_name, login_pass, remarks, category_id, created_at, updated_at 
                 FROM passwords ORDER BY updated_at DESC"
            )?;
            let rows = stmt.query_map([], map_row)?;
            for row in rows {
                records.push(row?);
            }
        } else {
            let mut stmt = conn.prepare(
                "SELECT id, title, site_or_app, login_name, login_pass, remarks, category_id, created_at, updated_at 
                 FROM passwords WHERE title LIKE ?1 ORDER BY updated_at DESC"
            )?;
            let pattern = format!("%{}%", search);
            let rows = stmt.query_map([pattern], map_row)?;
            for row in rows {
                records.push(row?);
            }
        }

        Ok(records)
    }

    /// List records by category
    pub fn list_records_by_category(&self, category_id: Option<i64>) -> SqliteResult<Vec<PasswordRecord>> {
        let conn = self.conn.lock().unwrap();
        
        let map_row = |row: &rusqlite::Row| -> rusqlite::Result<PasswordRecord> {
            Ok(PasswordRecord {
                id: row.get(0)?,
                title: row.get(1)?,
                site_or_app: row.get(2)?,
                login_name: row.get(3)?,
                login_pass: row.get(4)?,
                remarks: row.get(5)?,
                category_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            })
        };

        let mut records = Vec::new();
        
        match category_id {
            Some(cat_id) => {
                let mut stmt = conn.prepare(
                    "SELECT id, title, site_or_app, login_name, login_pass, remarks, category_id, created_at, updated_at 
                     FROM passwords WHERE category_id = ?1 ORDER BY updated_at DESC"
                )?;
                let rows = stmt.query_map([cat_id], map_row)?;
                for row in rows {
                    records.push(row?);
                }
            }
            None => {
                // Uncategorized records
                let mut stmt = conn.prepare(
                    "SELECT id, title, site_or_app, login_name, login_pass, remarks, category_id, created_at, updated_at 
                     FROM passwords WHERE category_id IS NULL ORDER BY updated_at DESC"
                )?;
                let rows = stmt.query_map([], map_row)?;
                for row in rows {
                    records.push(row?);
                }
            }
        }

        Ok(records)
    }

    /// Add a new password record
    pub fn add_record(&self, record: &PasswordRecord) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        let now = Self::now();
        conn.execute(
            "INSERT INTO passwords (title, site_or_app, login_name, login_pass, remarks, category_id, created_at, updated_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            rusqlite::params![
                &record.title,
                &record.site_or_app,
                &record.login_name,
                &record.login_pass,
                &record.remarks,
                &record.category_id,
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
             login_pass = ?4, remarks = ?5, category_id = ?6, updated_at = ?7 WHERE id = ?8",
            rusqlite::params![
                &record.title,
                &record.site_or_app,
                &record.login_name,
                &record.login_pass,
                &record.remarks,
                &record.category_id,
                &now,
                &record.id,
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
            "SELECT id, title, site_or_app, login_name, login_pass, remarks, category_id, created_at, updated_at 
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
                category_id: row.get(6)?,
                created_at: row.get(7)?,
                updated_at: row.get(8)?,
            }))
        } else {
            Ok(None)
        }
    }

    // ============ Category Operations ============

    /// List all categories
    pub fn list_categories(&self) -> SqliteResult<Vec<Category>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT id, name, icon, color, created_at FROM categories ORDER BY name"
        )?;
        
        let rows = stmt.query_map([], |row| {
            Ok(Category {
                id: row.get(0)?,
                name: row.get(1)?,
                icon: row.get(2)?,
                color: row.get(3)?,
                created_at: row.get(4)?,
            })
        })?;
        
        let mut categories = Vec::new();
        for row in rows {
            categories.push(row?);
        }
        Ok(categories)
    }

    /// Add a new category
    pub fn add_category(&self, name: &str, icon: &str, color: &str) -> SqliteResult<i64> {
        let conn = self.conn.lock().unwrap();
        let now = Self::now();
        conn.execute(
            "INSERT INTO categories (name, icon, color, created_at) VALUES (?1, ?2, ?3, ?4)",
            [name, icon, color, &now],
        )?;
        Ok(conn.last_insert_rowid())
    }

    /// Update a category
    pub fn update_category(&self, id: i64, name: &str, icon: &str, color: &str) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        conn.execute(
            "UPDATE categories SET name = ?1, icon = ?2, color = ?3 WHERE id = ?4",
            rusqlite::params![name, icon, color, id],
        )?;
        Ok(())
    }

    /// Delete a category
    pub fn delete_category(&self, id: i64) -> SqliteResult<()> {
        let conn = self.conn.lock().unwrap();
        // First, set category_id to NULL for all passwords in this category
        conn.execute(
            "UPDATE passwords SET category_id = NULL WHERE category_id = ?1",
            [id],
        )?;
        // Then delete the category
        conn.execute("DELETE FROM categories WHERE id = ?1", [id])?;
        Ok(())
    }

    /// Get category password count
    pub fn get_category_counts(&self) -> SqliteResult<Vec<(Option<i64>, i64)>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT category_id, COUNT(*) FROM passwords GROUP BY category_id"
        )?;
        
        let rows = stmt.query_map([], |row| {
            Ok((row.get(0)?, row.get(1)?))
        })?;
        
        let mut counts = Vec::new();
        for row in rows {
            counts.push(row?);
        }
        Ok(counts)
    }
}
