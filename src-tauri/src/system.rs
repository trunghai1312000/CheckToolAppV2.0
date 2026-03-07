use sysinfo::System;
use serde::Serialize;

#[derive(Serialize)]
pub struct SystemInfo {
    pub os: String,
    pub cpu: String,
    pub ram: String,
    pub mac: String,
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let os = format!("{} {}", sys.name().unwrap_or_default(), sys.os_version().unwrap_or_default());
    let cpu = sys.cpus().first().map(|c| c.brand().to_string()).unwrap_or_default();
    let ram = format!("{:.2} GB", sys.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0);
    
    let mut mac_addr = "N/A".to_string();
    for (_interface_name, data) in sys.networks() {
        let m = data.mac_address().to_string();
        if m != "00:00:00:00:00:00" && !m.is_empty() {
            mac_addr = m;
            break;
        }
    }

    SystemInfo { os, cpu, ram, mac: mac_addr }
}