use usage_monitor::MonitorService;

#[tokio::main]
async fn main() {
    println!("Usage Monitor v1.0.0");
    
    let service = MonitorService::new();
    service.start_monitoring().await;
    
    println!("Monitoring started. Press Ctrl+C to stop.");
    
    tokio::signal::ctrl_c().await.expect("Failed to install Ctrl+C handler");
    
    println!("Shutting down...");
    service.stop_monitoring().await;
    
    println!("Monitoring stopped.");
}
