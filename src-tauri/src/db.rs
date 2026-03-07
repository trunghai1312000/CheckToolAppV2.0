use rusqlite::{Connection, Result};
use std::env;
use std::path::PathBuf;

pub fn get_db_path() -> PathBuf {
    let mut path = env::current_exe().unwrap_or_else(|_| PathBuf::from("."));
    path.pop(); 
    path.push("database.sqlite");
    path
}

pub fn init_db() -> Result<()> {
    let path = get_db_path();
    let conn = Connection::open(path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS Machines (
            id INTEGER PRIMARY KEY,
            mac_address TEXT UNIQUE,
            cpu_serial TEXT,
            status TEXT,
            check_date TEXT
        )",
        [],
    )?;
    Ok(())
}

#[tauri::command]
pub fn save_audit_log(mac: String, cpu: String, status: String) -> Result<(), String> {
    let path = get_db_path();
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

    conn.execute(
        "INSERT INTO Machines (mac_address, cpu_serial, status, check_date) 
         VALUES (?1, ?2, ?3, ?4)
         ON CONFLICT(mac_address) DO UPDATE SET 
            status = excluded.status,
            check_date = excluded.check_date",
        [&mac, &cpu, &status, &now],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_audit_log(mac: String) -> Result<Option<String>, String> {
    let path = get_db_path();
    let conn = Connection::open(path).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare("SELECT check_date, status FROM Machines WHERE mac_address = ?1")
        .map_err(|e| e.to_string())?;
    
    let mut rows = stmt.query_map([&mac], |row| {
        let date: String = row.get(0)?;
        let status: String = row.get(1)?;
        Ok(format!("Kiểm tra ngày: {} | Kết quả: {}", date, status))
    }).map_err(|e| e.to_string())?;

    if let Some(row) = rows.next() {
        Ok(Some(row.map_err(|e| e.to_string())?))
    } else {
        Ok(None)
    }
}