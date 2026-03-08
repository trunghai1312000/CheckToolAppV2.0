use std::collections::HashMap;
use std::env;
use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct MachineRecord {
    pub mac_address: String,
    pub cpu_serial: String,
    pub status: String,
    pub check_date: String,
}

pub fn get_db_path() -> PathBuf {
    // Tạo file database.json nằm ngay cạnh file .exe thực thi
    let mut path = env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    path.pop();
    path.push("database.json");
    path
}

pub fn init_db() -> Result<(), String> {
    let path = get_db_path();
    // Nếu file chưa tồn tại thì tạo mới một JSON object rỗng
    if !path.exists() {
        let empty_db: HashMap<String, MachineRecord> = HashMap::new();
        let json_data = serde_json::to_string_pretty(&empty_db).map_err(|e| e.to_string())?;
        fs::write(path, json_data).map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn load_db() -> Result<HashMap<String, MachineRecord>, String> {
    let path = get_db_path();
    if !path.exists() {
        return Ok(HashMap::new());
    }
    let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let db: HashMap<String, MachineRecord> = serde_json::from_str(&data).unwrap_or_else(|_| HashMap::new());
    Ok(db)
}

fn save_db(db: &HashMap<String, MachineRecord>) -> Result<(), String> {
    let path = get_db_path();
    let json_data = serde_json::to_string_pretty(db).map_err(|e| e.to_string())?;
    fs::write(path, json_data).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn save_audit_log(mac: String, cpu: String, status: String) -> Result<(), String> {
    let mut db = load_db()?;
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    let record = MachineRecord {
        mac_address: mac.clone(),
        cpu_serial: cpu,
        status,
        check_date: now,
    };

    // Lưu hoặc ghi đè thông tin máy tính này
    db.insert(mac, record);
    save_db(&db)?;

    Ok(())
}

#[tauri::command]
pub fn get_audit_log(mac: String) -> Result<Option<String>, String> {
    let db = load_db()?;
    
    if let Some(record) = db.get(&mac) {
        Ok(Some(format!("Kiểm tra ngày: {} | Kết quả: {}", record.check_date, record.status)))
    } else {
        Ok(None)
    }
}