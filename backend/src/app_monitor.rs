use std::sync::Arc;
use tokio::sync::Mutex;
use crate::database::{DatabaseService, AppInfo};

pub struct AppMonitor {
    db: Arc<Mutex<DatabaseService>>,
    current_app: Option<AppInfo>,
}

impl AppMonitor {
    pub fn new(db: Arc<Mutex<DatabaseService>>) -> Self {
        Self {
            db,
            current_app: None,
        }
    }

    pub async fn start(&mut self) {
        #[cfg(target_os = "windows")]
        self.start_windows_monitor().await;
        
        #[cfg(target_os = "linux")]
        self.start_linux_monitor().await;
    }

    async fn start_windows_monitor(&mut self) {
        println!("Starting Windows app monitoring...");
        
        loop {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            
            let app_info = self.get_active_window_windows().await;
            
            if let Some(app) = app_info {
                if self.current_app.is_none() 
                    || self.current_app.as_ref().unwrap().name != app.name {
                    
                    if let Some(current) = self.current_app.take() {
                        self.save_app_usage(current).await;
                    }
                    
                    self.current_app = Some(app);
                }
            }
        }
    }

    async fn start_linux_monitor(&mut self) {
        println!("Starting Linux app monitoring...");
        
        loop {
            tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
            
            let app_info = self.get_active_window_linux().await;
            
            if let Some(app) = app_info {
                if self.current_app.is_none() 
                    || self.current_app.as_ref().unwrap().name != app.name {
                    
                    if let Some(current) = self.current_app.take() {
                        self.save_app_usage(current).await;
                    }
                    
                    self.current_app = Some(app);
                }
            }
        }
    }

    async fn get_active_window_windows(&self) -> Option<AppInfo> {
        None
    }

    async fn get_active_window_linux(&self) -> Option<AppInfo> {
        #[cfg(target_os = "linux")]
        {
            use std::process::Command;
            
            match Command::new("sh").arg("-c").arg(
                "xdotool getwindowfocus getwindowname 2>/dev/null || wmctrl -l 2>/dev/null | head -1 | awk '{print $3}'"
            ).output() {
                Ok(output) => {
                    let window_title = String::from_utf8_lossy(&output.stdout).trim().to_string();
                    
                    Some(AppInfo {
                        name: "unknown".to_string(),
                        pid: None,
                        window_title: if window_title.is_empty() {
                            None
                        } else {
                            Some(window_title)
                        },
                        start_time: std::time::SystemTime::now()
                            .duration_since(std::time::UNIX_EPOCH)
                            .unwrap_or_default()
                            .as_secs(),
                        is_productive: false,
                    })
                }
                Err(_) => None,
            }
        }
        
        #[cfg(not(target_os = "linux"))]
        {
            None
        }
    }

    async fn save_app_usage(&self, app_info: AppInfo) {
        let mut db = self.db.lock().await;
        let duration = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs() - app_info.start_time;
        
        db.insert_app_usage(&app_info, duration).await;
    }

    pub async fn stop(&mut self) {
        if let Some(app) = self.current_app.take() {
            let mut db = self.db.lock().await;
            let duration = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() - app.start_time;
            
            db.insert_app_usage(&app, duration).await;
        }
    }
}
