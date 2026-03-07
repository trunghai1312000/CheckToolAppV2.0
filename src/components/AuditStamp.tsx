import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { CheckCircle, ShieldAlert, Award, History } from 'lucide-react';

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
      {/* Badge Trạng thái Tem */}
      <div className={`p-6 rounded-2xl border-2 flex flex-col items-center justify-center gap-4 transition-all ${
        hasStamp ? 'bg-green-500/10 border-green-500 text-green-400' : 'bg-amber-500/10 border-amber-500 text-amber-400'
      }`}>
        {hasStamp ? <Award size={64} /> : <ShieldAlert size={64} />}
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase italic">
            {hasStamp ? "Máy đã được dán tem điện tử" : "Chưa có tem kiểm định"}
          </h2>
          <p className="text-sm opacity-80 font-medium">
            {hasStamp ? "Chứng nhận máy tính đủ tiêu chuẩn an toàn thông tin" : "Vui lòng thực hiện kiểm định cấu hình trước khi cấp tem"}
          </p>
        </div>
      </div>

      {/* Lịch sử */}
      <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 flex items-start gap-3">
        <History className="text-slate-400" size={20} />
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase">Lịch sử kiểm tra (Database USB)</span>
          <p className="text-sm text-slate-300 italic">{auditLog || "Chưa có dữ liệu lịch sử cho máy này."}</p>
        </div>
      </div>

      {/* Nút hành động */}
      <button
        onClick={handleAudit}
        disabled={loading || hasStamp}
        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
          hasStamp 
          ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-500/20 active:scale-95'
        }`}
      >
        <CheckCircle size={20} />
        {loading ? "Đang xử lý..." : "XÁC NHẬN ĐẠT & DÁN TEM ĐIỆN TỬ"}
      </button>
    </div>
  );
};