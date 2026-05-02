use rusqlite::{Connection, params};
use std::path::Path;
use serde::{Serialize, Deserialize};
use tokio::sync::Mutex;
use std::sync::Arc;

pub struct DatabaseService {
    conn: Connection,
}

impl DatabaseService {
    pub fn new() -> Self {
        let db_path = Self::get_db_path();
        
        let conn = Connection::open(&db_path).expect("Failed to open database");
        
        conn.execute_batch(
            r#"
            CREATE TABLE IF NOT EXISTS usage_records (
                id TEXT PRIMARY KEY,
                type TEXT NOT NULL,
                name TEXT NOT NULL,
                url TEXT,
                domain TEXT,
                window_title TEXT,
                pid INTEGER,
                start_time INTEGER NOT NULL,
                end_time INTEGER NOT NULL,
                duration INTEGER NOT NULL,
                timestamp INTEGER NOT NULL,
                is_productive INTEGER
            );
            
            CREATE INDEX IF NOT EXISTS idx_timestamp ON usage_records(timestamp);
            CREATE INDEX IF NOT EXISTS idx_type ON usage_records(type);
            "#,
        ).expect("Failed to create tables");
        
        Self { conn }
    }

    fn get_db_path() -> String {
        let home_dir = std::env::var("HOME").unwrap_or_else(|_| ".".to_string());
        let data_dir = Path::new(&home_dir).join(".usage_monitor");
        
        std::fs::create_dir_all(&data_dir).ok();
        
        data_dir.join("usage.db").to_string_lossy().to_string()
    }

    pub async fn init(&self) {
        // Database is initialized in new()
    }

    pub async fn insert_app_usage(&self, app_info: &AppInfo, duration: u64) {
        use uuid::Uuid;
        
        let id = Uuid::new_v4().to_string();
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        let _ = self.conn.execute(
            r#"
            INSERT INTO usage_records (id, type, name, window_title, pid, start_time, end_time, duration, timestamp, is_productive)
            VALUES (?1, 'app', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                id,
                app_info.name,
                app_info.window_title,
                app_info.pid,
                app_info.start_time,
                timestamp,
                duration,
                timestamp,
                if app_info.is_productive { 1 } else { 0 },
            ],
        );
    }

    pub async fn insert_web_usage(&self, web_info: &WebInfo, duration: u64) {
        use uuid::Uuid;
        
        let id = Uuid::new_v4().to_string();
        let timestamp = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        
        let _ = self.conn.execute(
            r#"
            INSERT INTO usage_records (id, type, name, url, domain, start_time, end_time, duration, timestamp, is_productive)
            VALUES (?1, 'website', ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
            "#,
            params![
                id,
                web_info.title.as_ref().unwrap_or(&web_info.url),
                web_info.url,
                web_info.domain,
                web_info.start_time,
                timestamp,
                duration,
                timestamp,
                if web_info.is_productive { 1 } else { 0 },
            ],
        );
    }

    pub async fn get_daily_summary(&self, date: u64) -> DailySummary {
        let startOfDay = date;
        let endOfDay = date + 86400;
        
        let mut stmt = self.conn.prepare(
            r#"
            SELECT type, name, SUM(duration) as total_duration
            FROM usage_records
            WHERE timestamp >= ? AND timestamp <= ?
            GROUP BY type, name
            "#,
        ).expect("Failed to prepare statement");
        
        let mut app_breakdown = std::collections::HashMap::new();
        let mut web_breakdown = std::collections::HashMap::new();
        let mut total_app_time = 0u64;
        let mut total_web_time = 0u64;
        
        let rows = stmt.query_map(params![startOfDay, endOfDay], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, u64>(2)?))
        }).expect("Failed to query rows");
        
        for row in rows {
            if let Ok((type_str, name, duration)) = row {
                if type_str == "app" {
                    total_app_time += duration;
                    app_breakdown.insert(name, duration);
                } else if type_str == "website" {
                    total_web_time += duration;
                    web_breakdown.insert(name, duration);
                }
            }
        }
        
        DailySummary {
            total_app_time,
            total_web_time,
            total_time: total_app_time + total_web_time,
            app_breakdown,
            web_breakdown,
        }
    }

    pub async fn get_recent_usage(&self, limit: u32) -> Vec<UsageRecord> {
        let mut stmt = self.conn.prepare(
            "SELECT * FROM usage_records ORDER BY timestamp DESC LIMIT ?"
        ).expect("Failed to prepare statement");
        
        let rows = stmt.query_map(params![limit], |row| {
            Ok(UsageRecord {
                id: row.get(0)?,
                r#type: row.get(1)?,
                name: row.get(2)?,
                url: row.get(3)?,
                domain: row.get(4)?,
                window_title: row.get(5)?,
                pid: row.get(6)?,
                start_time: row.get(7)?,
                end_time: row.get(8)?,
                duration: row.get(9)?,
                timestamp: row.get(10)?,
                is_productive: row.get(11)? == 1,
            })
        }).expect("Failed to query rows");
        
        rows.filter_map(|r| r.ok()).collect()
    }

    pub async fn export_to_csv(&self) -> String {
        let mut stmt = self.conn.prepare(
            "SELECT * FROM usage_records ORDER BY timestamp DESC"
        ).expect("Failed to prepare statement");
        
        let mut csv = String::from("ID,Type,Name,URL,Domain,StartTime,EndTime,Duration,Timestamp,IsProductive\n");
        
        let rows = stmt.query_map(params![], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, String>(2)?, 
                row.get::<_, Option<String>>(3)?, row.get::<_, Option<String>>(4)?, 
                row.get::<_, i64>(5)?, row.get::<_, i64>(6)?, row.get::<_, i64>(7)?, 
                row.get::<_, i64>(8)?, row.get::<_, i64>(9)?, row.get::<_, i32>(10)?))
        }).expect("Failed to query rows");
        
        for row in rows {
            if let Ok((id, type_str, name, url, domain, start_time, end_time, duration, timestamp, is_productive)) = row {
                csv.push_str(&format!(
                    "{},{},{},{},{},{},{},{},{},{},{}\n",
                    id, type_str, name,
                    url.unwrap_or_default(),
                    domain.unwrap_or_default(),
                    start_time,
                    end_time,
                    duration,
                    timestamp,
                    if is_productive == 1 { "Yes" } else { "No" }
                ));
            }
        }
        
        csv
    }
}

#[derive(Default)]
pub struct DailySummary {
    pub total_app_time: u64,
    pub total_web_time: u64,
    pub total_time: u64,
    pub app_breakdown: std::collections::HashMap<String, u64>,
    pub web_breakdown: std::collections::HashMap<String, u64>,
}

#[derive(Deserialize, Serialize, Clone)]
pub struct UsageRecord {
    pub id: String,
    pub r#type: String,
    pub name: String,
    pub url: Option<String>,
    pub domain: Option<String>,
    pub window_title: Option<String>,
    pub pid: Option<u32>,
    pub start_time: u64,
    pub end_time: u64,
    pub duration: u64,
    pub timestamp: u64,
    pub is_productive: bool,
}
