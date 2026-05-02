pub mod app_monitor;
pub mod web_monitor;
pub mod database;
pub mod utils;

pub use app_monitor::{AppMonitor, AppInfo};
pub use web_monitor::{WebMonitor, WebInfo};
pub use database::{DatabaseService, UsageRecord, DailySummary};
pub use utils::{format_duration, format_time_percentage, get_category, get_productivity};

use std::sync::Arc;
use tokio::sync::Mutex;

pub struct MonitorService {
    db: Arc<Mutex<DatabaseService>>,
    app_monitor: Arc<Mutex<Option<AppMonitor>>>,
    web_monitor: Arc<Mutex<Option<WebMonitor>>>,
}

impl MonitorService {
    pub fn new() -> Self {
        let db = Arc::new(Mutex::new(DatabaseService::new()));
        let app_monitor = Arc::new(Mutex::new(None));
        let web_monitor = Arc::new(Mutex::new(None));
        
        Self {
            db,
            app_monitor,
            web_monitor,
        }
    }

    pub async fn start_monitoring(&self) {
        {
            let mut app_mon = self.app_monitor.lock().await;
            let app = AppMonitor::new(self.db.clone());
            app.start().await;
            *app_mon = Some(app);
        }

        {
            let mut web_mon = self.web_monitor.lock().await;
            let mut web = WebMonitor::new(self.db.clone());
            web.start().await;
            *web_mon = Some(web);
        }

        println!("Monitoring started");
    }

    pub async fn stop_monitoring(&self) {
        if let Some(mut app) = self.app_monitor.lock().await.take() {
            app.stop().await;
        }

        if let Some(mut web) = self.web_monitor.lock().await.take() {
            web.stop().await;
        }

        println!("Monitoring stopped");
    }

    pub async fn get_daily_summary(&self, date: u64) -> DailySummary {
        self.db.lock().await.get_daily_summary(date).await
    }

    pub async fn get_recent_usage(&self, limit: u32) -> Vec<UsageRecord> {
        self.db.lock().await.get_recent_usage(limit).await
    }

    pub async fn export_to_csv(&self) -> String {
        self.db.lock().await.export_to_csv().await
    }
}
