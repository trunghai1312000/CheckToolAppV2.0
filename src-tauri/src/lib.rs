mod db;
mod system;
mod stamp;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    if let Err(e) = db::init_db() {
        eprintln!("Lỗi khởi tạo Database: {}", e);
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            system::get_system_info,
            db::save_audit_log,
            db::get_audit_log,
            stamp::apply_stamp,
            stamp::verify_stamp
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}