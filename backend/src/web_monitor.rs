use tokio::sync::Mutex;
use std::sync::Arc;
use serde::{Serialize, Deserialize};
use crate::database::DatabaseService;

#[derive(Serialize, Deserialize, Clone)]
pub struct WebInfo {
    pub url: String,
    pub domain: String,
    pub title: Option<String>,
    pub start_time: u64,
    pub is_productive: bool,
}

pub struct WebMonitor {
    db: Arc<Mutex<DatabaseService>>,
    current_site: Option<WebInfo>,
}

impl WebMonitor {
    pub fn new(db: Arc<Mutex<DatabaseService>>) -> Self {
        Self {
            db,
            current_site: None,
        }
    }

    pub async fn start(&mut self) {
        println!("Starting web monitoring...");
        println!("Web monitor started - placeholder");
    }

    pub async fn track_url(&mut self, url: &str, title: Option<&str>) {
        let domain = self.extract_domain(url);
        
        if let Some(site) = self.current_site.take() {
            let duration = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();
            
            let mut db = self.db.lock().await;
            db.insert_web_usage(&site, duration).await;
        }
        
        self.current_site = Some(WebInfo {
            url: url.to_string(),
            domain,
            title: title.map(|t| t.to_string()),
            start_time: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs(),
            is_productive: self.is_productive_site(url),
        });
    }

    fn extract_domain(&self, url: &str) -> String {
        match url::Url::parse(url) {
            Ok(parsed) => {
                let hostname = parsed.host_str().unwrap_or("unknown");
                hostname.trim_start_matches("www.").to_string()
            }
            Err(_) => "unknown".to_string(),
        }
    }

    fn is_productive_site(&self, url: &str) -> bool {
        let productive_domains = [
            "github.com", "stackoverflow.com", "stackoverflow.co", "gitlab.com",
            "bitbucket.org", "vscode.dev", "code.visualstudio.com",
            "developer.mozilla.org", "docs.microsoft.com", "docs.python.org",
            "www.typescriptlang.org", "nodejs.org", "npmjs.com", "webpack.js.org",
            "react.dev", "angular.io", "vuejs.org", "tailwindcss.com",
            "figma.com", "adobe.com", "dribbble.com", "postman.com",
        ];

        for domain in productive_domains {
            if url.contains(domain) {
                return true;
            }
        }
        
        false
    }

    pub async fn stop(&mut self) {
        if let Some(site) = self.current_site.take() {
            let duration = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs() - site.start_time;
            
            let mut db = self.db.lock().await;
            db.insert_web_usage(&site, duration).await;
        }
    }
}
