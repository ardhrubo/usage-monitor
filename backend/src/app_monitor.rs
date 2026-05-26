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

            // Get the PID of the focused window with xdotool
            let pid_output = match Command::new("xdotool")
                .args(["getwindowfocus", "getwindowpid"])
                .output()
            {
                Ok(out) => out,
                Err(e) => {
                    eprintln!("xdotool not available or failed: {e}");
                    return None;
                }
            };

            let pid_str = String::from_utf8_lossy(&pid_output.stdout).trim().to_string();
            let pid: Option<u32> = pid_str.parse().ok();

            // Resolve process name from /proc/<pid>/comm
            let name = if let Some(p) = pid {
                std::fs::read_to_string(format!("/proc/{}/comm", p))
                    .ok()
                    .map(|s| s.trim().to_string())
                    .unwrap_or_else(|| {
                        // Fallback: first segment of /proc/<pid>/cmdline
                        std::fs::read_to_string(format!("/proc/{}/cmdline", p))
                            .ok()
                            .and_then(|s| {
                                s.split('\0')
                                    .next()
                                    .and_then(|exe| exe.split('/').last())
                                    .map(|s| s.to_string())
                            })
                            .unwrap_or_else(|| "unknown".to_string())
                    })
            } else {
                eprintln!("xdotool returned non-numeric PID: {pid_str:?}");
                return None;
            };

            // Get the window title
            let title_output = match Command::new("xdotool")
                .args(["getwindowfocus", "getwindowname"])
                .output()
            {
                Ok(out) => out,
                Err(e) => {
                    eprintln!("xdotool getwindowname failed: {e}");
                    return None;
                }
            };

            let window_title = String::from_utf8_lossy(&title_output.stdout)
                .trim()
                .to_string();

            Some(AppInfo {
                name,
                pid,
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
