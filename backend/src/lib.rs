pub mod app_monitor;
pub mod web_monitor;
pub mod database;
pub mod utils;

use app_monitor::AppMonitor;
use database::DatabaseService;
use std::sync::Arc;
use tokio::sync::Mutex;

pub struct MonitorService {
    app_monitor: Arc<Mutex<AppMonitor>>,
    db: Arc<Mutex<DatabaseService>>,
}

impl MonitorService {
    pub fn new() -> Self {
        let db = Arc::new(Mutex::new(DatabaseService::new()));
        let app_monitor = Arc::new(Mutex::new(AppMonitor::new(db.clone())));
        
        Self {
            app_monitor,
            db,
        }
    }

    pub async fn start_monitoring(&self) {
        let mut db = self.db.lock().await;
        let mut app_monitor = self.app_monitor.lock().await;
        
        db.init().await;
        app_monitor.start().await;
    }

    pub async fn stop_monitoring(&self) {
        let mut app_monitor = self.app_monitor.lock().await;
        app_monitor.stop().await;
    }
}
