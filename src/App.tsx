import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { LayoutDashboard, Settings, Info, ShieldCheck, Monitor, Cpu, HardDrive, CheckCircle, ShieldAlert, Award, History } from "lucide-react";

interface InfoData {
  os: string;
  cpu: string;
  ram: string;
  mac: string;
}

const SystemInfo: React.FC<{ data: InfoData | null }> = ({ data }) => {
  if (!data) return <div className="animate-pulse text-slate-400">Đang tải cấu hình hệ thống...</div>;

  const cards = [
    { label: "Hệ điều hành", value: data.os, icon: <Monitor size={20} /> },
    { label: "Vi xử lý (CPU)", value: data.cpu, icon: <Cpu size={20} /> },
    { label: "Bộ nhớ (RAM)", value: data.ram, icon: <HardDrive size={20} /> },
    { label: "Địa chỉ MAC", value: data.mac, icon: <ShieldCheck size={20} /> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-slate-800 p-5 rounded-xl border border-slate-700 hover:border-blue-500 transition-all">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            {c.icon}
            <span className="text-xs font-bold uppercase tracking-wider">{c.label}</span>
          </div>
          <div className="text-lg font-semibold text-white truncate" title={c.value}>{c.value}</div>
        </div>
      ))}
    </div>
  );
};

const AuditStamp: React.FC<{ mac: string; cpu: string }> = ({ mac, cpu }) => {
  const [hasStamp, setHasStamp] = useState(false);
  const [auditLog, setAuditLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    try {
      const valid = await invoke<boolean>('verify_stamp', { mac });
      const log = await invoke<string | null>('get_audit_log', { mac });
      setHasStamp(valid);
      setAuditLog(log);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (mac !== "N/A") checkStatus();
  }, [mac]);

  const handleAudit = async () => {
    setLoading(true);
    try {
      await invoke('save_audit_log', { mac, cpu, status: "ĐẠT" });
      await invoke('apply_stamp', { mac });
      await checkStatus();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${
        hasStamp ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-amber-500/10 border-amber-500 text-amber-400'
      }`}>
        {hasStamp ? <Award size={64} /> : <ShieldAlert size={64} />}
        <div className="text-center">
          <h2 className="text-xl font-black uppercase italic">
            {hasStamp ? "Máy đã được dán tem điện tử" : "Chưa có tem kiểm định"}
          </h2>
          <p className="text-sm opacity-80 font-medium mt-1">
            {hasStamp ? "Chứng nhận máy tính đủ tiêu chuẩn" : "Thực hiện kiểm định trước khi cấp tem"}
          </p>
        </div>
      </div>

      <div className="bg-slate-800/80 p-5 rounded-xl border border-slate-700 flex items-start gap-4">
        <History className="text-slate-400 shrink-0 mt-1" size={20} />
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase block mb-1">Lịch sử kiểm tra (Database USB)</span>
          <p className="text-sm text-slate-300 italic">{auditLog || "Chưa có dữ liệu lịch sử cho máy này."}</p>
        </div>
      </div>

      <button
        onClick={handleAudit}
        disabled={loading || hasStamp}
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${
          hasStamp 
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
        }`}
      >
        <CheckCircle size={20} />
        {loading ? "ĐANG XỬ LÝ..." : "XÁC NHẬN ĐẠT & DÁN TEM ĐIỆN TỬ"}
      </button>
    </div>
  );
};

export default function App() {
  const [sysInfo, setSysInfo] = useState<InfoData | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    invoke<InfoData>("get_system_info")
      .then(setSysInfo)
      .catch(err => console.error("Lấy system info thất bại:", err));
  }, []);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      <div className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-10 mt-2">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <span className="font-black text-xl tracking-tighter">IT AUDIT</span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: "dashboard", icon: <LayoutDashboard size={20} />, label: "Tổng quan" },
            { id: "settings", icon: <Settings size={20} />, label: "Cấu hình" },
            { id: "info", icon: <Info size={20} />, label: "Trợ giúp" },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                activeTab === item.id ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" : "text-slate-400 hover:bg-slate-700"
              }`}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="text-[10px] text-slate-500 font-bold uppercase text-center py-4 border-t border-slate-700">
          V2.0 - Portable USB Mode
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-8">
        <header className="mb-10">
          <h1 className="text-3xl font-black tracking-tight mb-2">Kiểm tra hệ thống</h1>
          <p className="text-slate-400 text-sm">Tự động nhận diện cấu hình và xác thực tem điện tử máy khách.</p>
        </header>

        {activeTab === "dashboard" ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <section>
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Thông tin phần cứng</h3>
                <SystemInfo data={sysInfo} />
              </section>
            </div>

            <aside className="border-l border-slate-800 xl:pl-8">
              <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 tracking-wider">Kiểm định & Dán tem</h3>
              {sysInfo && <AuditStamp mac={sysInfo.mac} cpu={sysInfo.cpu} />}
            </aside>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-500 italic">
            Chức năng đang được phát triển...
          </div>
        )}
      </main>
    </div>
  );
}