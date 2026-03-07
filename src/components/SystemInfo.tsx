import React from 'react';
import { Monitor, Cpu, HardDrive, ShieldCheck } from 'lucide-react';

interface Info {
  os: string;
  cpu: string;
  ram: string;
  mac: string;
}

export const SystemInfo: React.FC<{ data: Info | null }> = ({ data }) => {
  if (!data) return <div className="animate-pulse text-slate-400">Đang tải cấu hình...</div>;

  const cards = [
    { label: "Hệ điều hành", value: data.os, icon: <Monitor size={20} /> },
    { label: "Vi xử lý (CPU)", value: data.cpu, icon: <Cpu size={20} /> },
    { label: "Bộ nhớ (RAM)", value: data.ram, icon: <HardDrive size={20} /> },
    { label: "Địa chỉ MAC", value: data.mac, icon: <ShieldCheck size={20} /> },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-slate-800 p-4 rounded-xl border border-slate-700 hover:border-blue-500 transition-all">
          <div className="flex items-center gap-3 text-blue-400 mb-2">
            {c.icon}
            <span className="text-xs font-bold uppercase tracking-wider">{c.label}</span>
          </div>
          <div className="text-lg font-semibold text-white truncate">{c.value}</div>
        </div>
      ))}
    </div>
  );
};