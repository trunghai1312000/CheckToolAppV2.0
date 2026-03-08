use sysinfo::System;
use serde::Serialize;
use std::net::UdpSocket;
use std::process::Command;
use std::os::windows::process::CommandExt;

const CREATE_NO_WINDOW: u32 = 0x08000000;

#[derive(Serialize)]
pub struct NetworkAdapter { pub name: String, pub mac: String }

#[derive(Serialize)]
pub struct SystemInfo {
    pub os: String, pub cpu: String, pub ram: String, pub mac: String, pub ipv4: String,
    pub baseboard_serial: String, pub internet_connected: bool, pub adapters: Vec<NetworkAdapter>,
}

#[tauri::command]
pub fn get_system_info() -> SystemInfo {
    let mut sys = System::new_all();
    sys.refresh_all();

    let os_name = System::name().unwrap_or_else(|| "Unknown".to_string());
    let os_ver = System::os_version().unwrap_or_else(|| "".to_string());
    let os = format!("{} {}", os_name, os_ver);
    let cpu = sys.cpus().first().map(|c| c.brand().to_string()).unwrap_or_else(|| "Unknown".to_string());
    let ram = format!("{:.2} GB", sys.total_memory() as f64 / 1024.0 / 1024.0 / 1024.0);
    
    let mut adapters = Vec::new();
    let mut mac_addr = "N/A".to_string();
    let networks = sysinfo::Networks::new_with_refreshed_list();
    for (name, data) in &networks {
        let m = data.mac_address().to_string();
        if m != "00:00:00:00:00:00" && !m.is_empty() {
            if mac_addr == "N/A" { mac_addr = m.clone(); }
            adapters.push(NetworkAdapter { name: name.to_string(), mac: m });
        }
    }

    let mut ipv4_addr = "N/A".to_string();
    let internet_connected = if let Ok(socket) = UdpSocket::bind("0.0.0.0:0") {
        if socket.connect("8.8.8.8:53").is_ok() { 
            if let Ok(addr) = socket.local_addr() { ipv4_addr = addr.ip().to_string(); }
            true 
        } else { false }
    } else { false };

    let bb_script = "(Get-CimInstance Win32_BaseBoard -ErrorAction SilentlyContinue).SerialNumber";
    let baseboard_serial = if let Ok(out) = Command::new("powershell").args(&["-NoProfile", "-Command", bb_script]).creation_flags(CREATE_NO_WINDOW).output() {
        let serial = String::from_utf8_lossy(&out.stdout).trim().to_string();
        if serial.is_empty() { "Unknown".to_string() } else { serial }
    } else { "Unknown".to_string() };

    SystemInfo { os, cpu, ram, mac: mac_addr, ipv4: ipv4_addr, baseboard_serial, internet_connected, adapters }
}

#[derive(Serialize)]
pub struct OsDetails {
    pub build: String, pub install_date: String, pub license_key: String, 
    pub is_genuine: bool, pub license_status_text: String,
    pub is_ghost: bool, pub ghost_reasons: Vec<String>
}

#[tauri::command]
pub fn get_os_details() -> OsDetails {
    let script = "
        $os = Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue;
        $build = $os.BuildNumber;
        $date = if ($os.InstallDate) { $os.InstallDate.ToString('yyyy-MM-dd HH:mm:ss') } else { '' };
        
        $sls = Get-CimInstance SoftwareLicensingService -ErrorAction SilentlyContinue;
        $key = if ($sls -and $sls.OA3xOriginalProductKey) { $sls.OA3xOriginalProductKey } else { '' };

        $status = 'Not Activated';
        $is_kms = $false;
        $products = Get-CimInstance SoftwareLicensingProduct -Filter \"PartialProductKey IS NOT NULL\" -ErrorAction SilentlyContinue;
        foreach ($p in $products) {
            if ($p.LicenseStatus -eq 1) {
                $status = 'Activated';
                if ($p.Description -match 'KMSCLIENT' -or $p.Name -match 'KMSCLIENT') { $is_kms = $true; }
            }
        }

        # CHECK GHOST OS
        $is_ghost = $false;
        $ghost_reasons = @();
        $uac = (Get-ItemProperty HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Policies\\System -Name EnableLUA -ErrorAction SilentlyContinue).EnableLUA;
        if ($uac -eq 0) { $ghost_reasons += 'UAC bị tắt hoàn toàn (Dấu hiệu Ghost)'; }
        
        $oem = (Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\OEMInformation -ErrorAction SilentlyContinue);
        if ($oem -and ($oem.Manufacturer -match 'Ghost|GHO|Mod|Phien ban|Team')) { $ghost_reasons += 'OEM Info bị chỉnh sửa bởi bản Ghost'; }
        
        $users = Get-WmiObject Win32_UserAccount | Select-Object -ExpandProperty Name;
        if ($users -contains 'Ghost' -or $users -contains 'Admin') { $ghost_reasons += 'Phát hiện Tên User mặc định của Ghost'; }

        if ($ghost_reasons.Count -gt 0) { $is_ghost = $true; }

        @{ 
            build = $build; install_date = $date; license_key = $key; 
            license_status = $status; is_kms = $is_kms;
            is_ghost = $is_ghost; ghost_reasons = $ghost_reasons
        } | ConvertTo-Json
    ";
    
    if let Ok(out) = Command::new("powershell").args(&["-NoProfile", "-Command", script]).creation_flags(CREATE_NO_WINDOW).output() {
        let json_str = String::from_utf8_lossy(&out.stdout);
        if let Ok(details) = serde_json::from_str::<serde_json::Value>(&json_str) {
            let key_str = details["license_key"].as_str().unwrap_or("");
            let status_str = details["license_status"].as_str().unwrap_or("Not Activated");
            let is_kms = details["is_kms"].as_bool().unwrap_or(false);
            
            let is_ghost = details["is_ghost"].as_bool().unwrap_or(false);
            let mut ghost_reasons = Vec::new();
            if let Some(reasons) = details["ghost_reasons"].as_array() {
                for r in reasons { ghost_reasons.push(r.as_str().unwrap_or("").to_string()); }
            }

            let (is_genuine, status_text) = if status_str == "Activated" {
                if is_kms { (false, "Crack / Dùng thử (KMS)") } else { (true, "Bản quyền chính hãng") }
            } else { (false, "Chưa kích hoạt") };

            return OsDetails {
                build: details["build"].as_str().unwrap_or("N/A").to_string(),
                install_date: details["install_date"].as_str().unwrap_or("N/A").to_string(),
                license_key: if key_str.is_empty() { "Không có Key gốc (OEM)".to_string() } else { key_str.to_string() },
                is_genuine, license_status_text: status_text.to_string(),
                is_ghost, ghost_reasons
            };
        }
    }
    OsDetails { build: "N/A".into(), install_date: "N/A".into(), license_key: "N/A".into(), is_genuine: false, license_status_text: "Không xác định".into(), is_ghost: false, ghost_reasons: vec![] }
}

#[tauri::command]
pub fn open_slmgr() -> Result<(), String> {
    Command::new("cmd").args(&["/C", "slmgr", "/dlv"]).creation_flags(CREATE_NO_WINDOW).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize)]
pub struct DiskInfo { pub name: String, pub media_type: String, pub serial: String }

#[tauri::command]
pub fn get_disk_info() -> Vec<DiskInfo> {
    let script = "Get-PhysicalDisk | Select-Object FriendlyName, MediaType, SerialNumber | ConvertTo-Json -Compress";
    let output = Command::new("powershell").args(&["-NoProfile", "-Command", script]).creation_flags(CREATE_NO_WINDOW).output();
    if let Ok(out) = output {
        let json_str = String::from_utf8_lossy(&out.stdout);
        if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&json_str) {
            let mut disks = Vec::new();
            if parsed.is_array() {
                for d in parsed.as_array().unwrap() {
                    disks.push(DiskInfo { name: d["FriendlyName"].as_str().unwrap_or("Unknown").to_string(), media_type: d["MediaType"].as_str().unwrap_or("Unknown").to_string(), serial: d["SerialNumber"].as_str().unwrap_or("Unknown").trim().to_string() });
                }
            } else if parsed.is_object() {
                disks.push(DiskInfo { name: parsed["FriendlyName"].as_str().unwrap_or("Unknown").to_string(), media_type: parsed["MediaType"].as_str().unwrap_or("Unknown").to_string(), serial: parsed["SerialNumber"].as_str().unwrap_or("Unknown").trim().to_string() });
            }
            return disks;
        }
    }
    vec![]
}

#[tauri::command]
pub fn get_office_info() -> String {
    let script = "
        $paths = @('C:\\Program Files\\Microsoft Office\\Office16\\ospp.vbs', 'C:\\Program Files (x86)\\Microsoft Office\\Office16\\ospp.vbs', 'C:\\Program Files\\Microsoft Office\\Office15\\ospp.vbs', 'C:\\Program Files (x86)\\Microsoft Office\\Office15\\ospp.vbs');
        $foundPath = $null;
        foreach ($p in $paths) { if (Test-Path $p) { $foundPath = $p; break; } }
        
        $installDate = 'Không xác định';
        $officeUninstall = Get-ItemProperty HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -match 'Microsoft Office' } | Select-Object -First 1;
        if ($officeUninstall -and $officeUninstall.InstallDate) {
            if ($officeUninstall.InstallDate -match '(\\d{4})(\\d{2})(\\d{2})') { $installDate = \"$($matches[1])-$($matches[2])-$($matches[3])\"; }
        } elseif ($foundPath) {
            $installDate = (Get-Item $foundPath).CreationTime.ToString('yyyy-MM-dd');
        }

        Write-Output \"[NGÀY CÀI ĐẶT OFFICE: $installDate]`n\";
        
        if ($foundPath) { cscript //nologo $foundPath /dstatus; }
        else { Write-Output 'Không tìm thấy ospp.vbs. Có thể Office chưa cài đặt hoặc là phiên bản Click-to-Run (Windows App).'; }
    ";
    if let Ok(out) = Command::new("powershell").args(&["-NoProfile", "-Command", script]).creation_flags(CREATE_NO_WINDOW).output() {
        let stdout = String::from_utf8_lossy(&out.stdout).to_string();
        if !stdout.trim().is_empty() { return stdout; }
    }
    "Lỗi khi chạy lệnh kiểm tra Office.".into()
}

#[tauri::command]
pub fn get_system_history() -> String {
    let script = r##"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# ---------------- USB FORENSIC ----------------
$usb = @()

$usbDevices = Get-ChildItem 'HKLM:\SYSTEM\CurrentControlSet\Enum\USBSTOR' -ErrorAction SilentlyContinue
foreach ($dev in $usbDevices) {

    $instances = Get-ChildItem $dev.PSPath -ErrorAction SilentlyContinue

    foreach ($inst in $instances) {

        $props = Get-ItemProperty $inst.PSPath -ErrorAction SilentlyContinue

        $name = $props.FriendlyName
        if (-not $name) { $name = $props.DeviceDesc }
        if (-not $name) { $name = $dev.PSChildName }

        $serial = $inst.PSChildName
        $regTime = $inst.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')

        # Vendor / Product
        $vendor = ''
        $product = ''
        if ($dev.PSChildName -match 'Ven_(.*?)&Prod_(.*?)(&|$)') {
            $vendor = $matches[1]
            $product = $matches[2]
        }

        # Drive letters (MountedDevices)
        $letters = @()
        $mounted = Get-ItemProperty 'HKLM:\SYSTEM\MountedDevices' -ErrorAction SilentlyContinue
        foreach ($p in $mounted.PSObject.Properties) {
            if ($p.Name -like '\DosDevices\*') {
                $data = [System.Text.Encoding]::Unicode.GetString($p.Value)
                if ($data -match $serial) {
                    $letters += $p.Name.Replace('\DosDevices\','')
                }
            }
        }

        # Kernel-PnP events
        $events = Get-WinEvent -LogName 'Microsoft-Windows-Kernel-PnP/Configuration' -MaxEvents 200 -ErrorAction SilentlyContinue |
            Where-Object { $_.Message -match $serial }

        $firstSeen = $null
        $lastSeen = $null

        if ($events) {
            $firstSeen = ($events | Sort-Object TimeCreated | Select-Object -First 1).TimeCreated.ToString('yyyy-MM-dd HH:mm:ss')
            $lastSeen = ($events | Sort-Object TimeCreated -Descending | Select-Object -First 1).TimeCreated.ToString('yyyy-MM-dd HH:mm:ss')
        }

        $usb += @{
            FriendlyName = $name
            Vendor = $vendor
            Product = $product
            Serial = $serial
            RegistryLastWrite = $regTime
            FirstSeen = $firstSeen
            LastSeen = $lastSeen
            DriveLetters = $letters
            Class = 'USB'
        }
    }
}

# ---------------- BLUETOOTH ----------------
$bluetooth = @()

$btDevices = Get-PnpDevice -ErrorAction SilentlyContinue |
Where-Object {
    $_.Class -eq 'Bluetooth' -and
    $_.FriendlyName -and
    $_.FriendlyName -notmatch 'Enumerator|Adapter|Transport|Protocol'
}

foreach ($b in $btDevices) {

    $serial = ($b.InstanceId -split '\\')[-1]

    $regPath = 'HKLM:\SYSTEM\CurrentControlSet\Enum\' + $b.InstanceId
    $date = 'Unknown'

    if (Test-Path $regPath) {
        $date = (Get-Item $regPath).LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')
    }

    $bluetooth += @{
        FriendlyName = $b.FriendlyName
        Serial = $serial
        LastRegistryWrite = $date
        Class = 'Bluetooth'
    }
}

# ---------------- MTP / PHONE ----------------
$mtp = @()

$wpd = Get-ChildItem 'HKLM:\SOFTWARE\Microsoft\Windows Portable Devices\Devices' -ErrorAction SilentlyContinue

foreach ($d in $wpd) {

    $prop = Get-ItemProperty $d.PSPath -ErrorAction SilentlyContinue
    $name = $prop.FriendlyName

    if ($name -and $name -notmatch 'Windows|OS|Storage') {

        $serial = ($d.PSChildName -split '#')[-1]
        $date = $d.LastWriteTime.ToString('yyyy-MM-dd HH:mm:ss')

        $mtp += @{
            FriendlyName = $name
            Serial = $serial
            LastRegistryWrite = $date
            Class = 'MTP'
        }
    }
}

# ---------------- NETWORK HISTORY ----------------
$network = @()

$events = Get-WinEvent `
    -LogName 'Microsoft-Windows-NetworkProfile/Operational' `
    -MaxEvents 200 `
    -ErrorAction SilentlyContinue |
Where-Object { $_.Id -in 10000,10001 }

foreach ($e in $events) {

    $status = if ($e.Id -eq 10000) { 'Connected' } else { 'Disconnected' }

    $msg = $e.Message -replace "`n|`r"," " -replace '\s+',' '

    # Extract network details
    $name = ''
    $type = ''
    $category = ''

    if ($msg -match 'Name:\s*(.*?)\s*(Category|Type)') {
        $name = $matches[1]
    }

    if ($msg -match 'Type:\s*(.*?)\s*(Category|$)') {
        $type = $matches[1]
    }

    if ($msg -match 'Category:\s*(.*)$') {
        $category = $matches[1]
    }

    $network += @{
        Date = $e.TimeCreated.ToString('yyyy-MM-dd HH:mm:ss')
        EventId = $e.Id
        Status = $status
        Name = $name
        Type = $type
        Category = $category
        Message = $msg
        Class = 'Network'
    }
}

# ---------------- RESULT ----------------
$result = @{
    usb = $usb
    bluetooth = $bluetooth
    mtp = $mtp
    network = $network
}

$result | ConvertTo-Json -Depth 10 -Compress
"##;

    if let Ok(out) = std::process::Command::new("powershell")
        .args(&["-NoProfile","-ExecutionPolicy","Bypass","-Command",script])
        .creation_flags(CREATE_NO_WINDOW)
        .output()
    {
        return String::from_utf8_lossy(&out.stdout).to_string();
    }

    "{}".into()
}

#[tauri::command]
pub fn open_event_viewer() -> Result<(), String> {
    Command::new("cmd").args(&["/C", "eventvwr.msc"]).creation_flags(CREATE_NO_WINDOW).spawn().map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn open_registry() -> Result<(), String> {
    Command::new("cmd").args(&["/C", "regedit.exe"]).creation_flags(CREATE_NO_WINDOW).spawn().map_err(|e| e.to_string())?;
    Ok(())
}