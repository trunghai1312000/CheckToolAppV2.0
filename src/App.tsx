import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LayoutDashboard, Cable, Settings, Info, Award } from "lucide-react";
import Logo  from "./assets/logoca.webp";
import { SystemInfo } from "./components/SystemInfo";
import { NetworkPeripherals } from "./components/NetworkPeripherals";
import { AuditStamp } from "./components/AuditStamp";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const [sysInfo, setSysInfo] = useState<any>(null);
  const [osDetails, setOsDetails] = useState<any>(null);
  const [disks, setDisks] = useState<any[]>([]);
  const [officeInfo, setOfficeInfo] = useState<string>('Đang quét trạng thái Office...');
  
  const [peripherals, setPeripherals] = useState<any[]>([]);
  const [usbHistory, setUsbHistory] = useState<any[]>([]);
  const [mtpHistory, setMtpHistory] = useState<any[]>([]); 
  const [connections, setConnections] = useState<any[]>([]);

  useEffect(() => {
    invoke("get_system_info").then(setSysInfo).catch(console.error);
    invoke('get_os_details').then(setOsDetails).catch(console.error);
    invoke('get_disk_info').then(setDisks).catch(console.error);
    invoke('get_office_info').then(setOfficeInfo).catch(console.error);

    invoke('get_system_history').then((res: any) => {
      try {
        const historyData = JSON.parse(res || "{}");
        setPeripherals(historyData.bluetooth || []); 
        setUsbHistory(historyData.usb || []);
        setMtpHistory(historyData.mtp || []);
        setConnections(historyData.network || []);
      } catch (err) {
        console.error("Lỗi parse history json:", err);
      }
    }).catch(console.error);
  }, []);

  return (
    <div className="flex h-screen bg-black text-gray-300 font-sans">
      {/* SIDEBAR */}
      <div className="w-72 bg-[#0a0a0a] border-r border-green-500/20 flex flex-col p-5 shrink-0">
        <div className="flex items-center gap-4 px-2 mb-10 mt-2">
          <img src={Logo} alt="Logo" className="w-22 h-22 object-contain" />
          <div>
            <span className="font-black text-2xl tracking-tighter text-green-400 block leading-none">PA06 - Đ5</span>
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Kiểm tra ANATTT</span>
          </div>
        </div>

        <nav className="flex-1 space-y-3">
          {[
            { id: "dashboard", icon: <LayoutDashboard size={22} />, label: "Tổng quan Hệ thống" },
            { id: "network", icon: <Cable size={22} />, label: "Ngoại vi & Mạng" },
            { id: "settings", icon: <Settings size={22} />, label: "Cấu hình" },
            { id: "info", icon: <Info size={22} />, label: "Trợ giúp" },
            { id: "stamp", icon: <Award size={22} />, label: "Dán tem kiểm định" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl font-bold transition-all text-[15px] ${
                activeTab === item.id 
                ? (item.id === "stamp" ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" : "bg-green-500/15 text-green-400 shadow-[0_0_10px_rgba(34,197,94,0.1)] border border-green-500/30") 
                : "text-gray-500 hover:text-green-400 hover:bg-[#111]"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="text-[11px] text-green-500/50 font-bold uppercase text-center py-4 border-t border-green-500/20">
          V2.0 - Portable USB Mode
        </div>
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto p-10 flex flex-col items-center">
        {/* Header Căn giữa theo khung lưới */}
        <div className="w-full max-w-7xl mb-10">
          <header>
            <h1 className="text-4xl font-black tracking-tight mb-3 text-white">
              {activeTab === "dashboard" ? "Kiểm tra hệ thống" : 
               activeTab === "network" ? "Giám sát Ngoại vi & Kết nối mạng" : 
               activeTab === "stamp" ? "Kiểm định & Dán tem Chứng nhận" : "Cài đặt & Trợ giúp"}
            </h1>
            <p className="text-gray-400 text-[15px]">
              {activeTab === "dashboard" ? "Quét toàn diện cấu hình phần cứng, mạng và bản quyền hệ thống." : 
               activeTab === "network" ? "Kiểm tra lịch sử kết nối USB, điện thoại và các luồng dữ liệu mạng." :
               activeTab === "stamp" ? "Cấp phát tem chứng nhận điện tử lưu vào Registry & USB Database." : ""}
            </p>
          </header>
        </div>

        {/* Các Component cũng được giới hạn max-width và căn giữa */}
        {activeTab === "dashboard" && <div className="w-full max-w-7xl"><SystemInfo data={sysInfo} osDetails={osDetails} disks={disks} officeInfo={officeInfo} /></div>}
        {activeTab === "network" && <div className="w-full max-w-7xl"><NetworkPeripherals peripherals={peripherals} usbHistory={usbHistory} mtpHistory={mtpHistory} connections={connections} /></div>}
        {activeTab === "stamp" && (
          <div className="w-full max-w-3xl mt-10">
            {sysInfo ? <AuditStamp mac={sysInfo.mac} cpu={sysInfo.cpu} /> : <div className="text-center text-green-500 animate-pulse font-mono text-lg">Đang nạp dữ liệu định danh máy...</div>}
          </div>
        )}
        {["settings", "info"].includes(activeTab) && (
          <div className="w-full max-w-5xl flex items-center justify-center h-64 text-green-500/50 italic bg-[#0a0a0a] rounded-2xl border border-green-500/20 border-dashed text-lg">
            Chức năng đang được phát triển...
          </div>
        )}
      </main>
    </div>
  );
}