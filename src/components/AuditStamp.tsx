import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CheckCircle, ShieldAlert, Award, History, Trash2, ShieldCheck } from 'lucide-react';

export const AuditStamp: React.FC<{ mac: string; cpu: string }> = ({ mac, cpu }) => {
  const [hasStamp, setHasStamp] = useState(false);
  const [auditLog, setAuditLog] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = async () => {
    try {
      const valid = await invoke<boolean>('verify_stamp', { mac });
      const log = await invoke<string | null>('get_audit_log', { mac });
      setHasStamp(valid);
      setAuditLog(log);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { if (mac !== "N/A") checkStatus(); }, [mac]);

  const handleAudit = async () => {
    setLoading(true);
    try {
      await invoke('save_audit_log', { mac, cpu, status: "ĐẠT" });
      await invoke('apply_stamp', { mac });
      await checkStatus();
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  const handleRemoveStamp = async () => {
    if (!confirm("⚠️ CẢNH BÁO: Hành động này sẽ GỠ TEM khỏi hệ thống máy tính này.\n(Lịch sử kiểm định trên USB vẫn được giữ nguyên). Bạn có chắc chắn?")) return;
    setLoading(true);
    try {
      await invoke('remove_stamp');
      await checkStatus(); // Render lại giao diện
    } catch (e) { console.error(e); } 
    finally { setLoading(false); }
  };

  return (
    <div className="bg-[#0a0a0a] p-8 rounded-2xl border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.05)] relative overflow-hidden">
      
      {/* Background Graphic */}
      <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-green-500 to-transparent opacity-50"></div>
      
      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-1">Chứng nhận an toàn</h2>
        <p className="text-gray-500 text-sm">Hệ thống đánh giá thiết bị đầu cuối</p>
      </div>

      {/* CHỨNG NHẬN TRUNG TÂM */}
      <div className={`p-8 rounded-xl border-2 flex flex-col items-center justify-center gap-4 transition-all relative ${
        hasStamp 
        ? 'bg-[#0f291e] border-green-500 text-green-400 shadow-[0_0_40px_rgba(34,197,94,0.2)]' 
        : 'bg-[#1a1510] border-yellow-600 text-yellow-500 border-dashed'
      }`}>
        {hasStamp && <div className="absolute top-4 right-4 text-green-500/30"><ShieldCheck size={100} /></div>}
        
        <div className="z-10 bg-black/40 p-4 rounded-full backdrop-blur-sm">
           {hasStamp ? <Award size={80} className="text-green-400 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" /> : <ShieldAlert size={80} />}
        </div>
        
        <div className="text-center z-10">
          <h2 className="text-3xl font-black uppercase tracking-wider text-white drop-shadow-md">
            {hasStamp ? "ĐÃ CẤP TEM KIỂM ĐỊNH" : "CHƯA KIỂM ĐỊNH"}
          </h2>
          <p className="text-sm opacity-90 font-medium mt-2 max-w-sm mx-auto">
            {hasStamp ? "Thiết bị này đã vượt qua quy trình kiểm tra và được cấp tem chứng nhận điện tử an toàn." : "Thiết bị chưa được ghi nhận trong Registry hoặc tem đã bị vô hiệu hóa."}
          </p>
        </div>
      </div>

      {/* LỊCH SỬ TỪ DATABASE JSON */}
      <div className="bg-[#111] p-5 rounded-xl border border-green-500/20 flex items-start gap-4 mt-6">
        <History className="text-green-500 shrink-0 mt-1" size={24} />
        <div>
          <span className="text-xs font-bold text-green-400 uppercase tracking-widest block mb-1">Lịch sử thiết bị (Lưu trên USB)</span>
          <p className="text-sm text-gray-300 font-mono bg-black/50 p-2 rounded mt-2 border border-green-500/10">
            {auditLog || "Thiết bị này chưa từng được ghi nhận trong cơ sở dữ liệu."}
          </p>
        </div>
      </div>

      {/* NÚT HÀNH ĐỘNG */}
      <div className="space-y-3 mt-8 pt-6 border-t border-green-500/20">
        <button
          onClick={handleAudit}
          disabled={loading || hasStamp}
          className={`w-full py-5 rounded-xl font-black text-lg flex items-center justify-center gap-3 transition-all tracking-widest uppercase ${
            hasStamp 
            ? 'bg-[#111] text-gray-600 border border-gray-800 cursor-not-allowed' 
            : 'bg-green-600 hover:bg-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)] hover:shadow-[0_0_30px_rgba(34,197,94,0.6)] active:scale-95'
          }`}
        >
          <CheckCircle size={24} />
          {loading ? "ĐANG TIẾN HÀNH..." : "PHÊ DUYỆT & CẤP TEM ĐIỆN TỬ"}
        </button>

        {hasStamp && (
          <button
            onClick={handleRemoveStamp}
            disabled={loading}
            className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all bg-red-950/30 text-red-500 hover:bg-red-600 hover:text-white border border-red-500/30 active:scale-95 uppercase tracking-wider"
          >
            <Trash2 size={20} />
            THU HỒI / XÓA TEM KHỎI MÁY
          </button>
        )}
      </div>
    </div>
  );
};