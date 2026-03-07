use winreg::enums::*;
use winreg::RegKey;
use sha2::{Sha256, Digest};

const SECRET_SALT: &str = "IT_AUDIT_2025_SECURE";

fn generate_hash(mac: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(format!("{}{}", mac, SECRET_SALT));
    format!("{:x}", hasher.finalize())
}

#[tauri::command]
pub fn apply_stamp(mac: String) -> Result<String, String> {
    let hash = generate_hash(&mac);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let (key, _) = hkcu.create_subkey("SOFTWARE\\ITCheckTool").map_err(|e| e.to_string())?;
    
    let now = chrono::Local::now().format("%Y-%m-%d").to_string();
    key.set_value("DigitalStamp", &hash).map_err(|e| e.to_string())?;
    key.set_value("StampDate", &now).map_err(|e| e.to_string())?;
    
    Ok(hash)
}

#[tauri::command]
pub fn verify_stamp(mac: String) -> bool {
    let hash_expected = generate_hash(&mac);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    
    if let Ok(key) = hkcu.open_subkey("SOFTWARE\\ITCheckTool") {
        let stamp: String = key.get_value("DigitalStamp").unwrap_or_default();
        return stamp == hash_expected;
    }
    false
}