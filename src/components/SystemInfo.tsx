import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Monitor, Cpu, HardDrive, FileText, ShieldCheck, AlertTriangle } from 'lucide-react';

export const SystemInfo: React.FC<any> = ({ data, osDetails, disks, officeInfo }) => {

  if (!data) return <div className="animate-pulse text-green-500 font-mono text-lg">Đang tải cấu hình hệ thống...</div>;

  const parseOfficeStatus = (info: string) => {
    if (!info || info.includes('Không tìm thấy') || info.includes('Lỗi')) {
      return { status: 'Không xác định / Chưa cài', isGenuine: false, text: 'Có thể chưa cài đặt hoặc là bản Click-to-Run App' };
    }
    const isLicensed = info.includes('---LICENSED---');
    const isKms = info.includes('KMS_Client') || info.toLowerCase().includes('kms');
    const isO365 = info.includes('O365') || info.includes('Subscription');
    
    if (!isLicensed) return { status: 'Lỗi / Hết hạn', isGenuine: false, text: 'Không có chứng nhận bản quyền hợp lệ' };
    if (isKms) return { status: 'Crack / Dùng thử (KMS)', isGenuine: false, text: 'Kích hoạt qua máy chủ KMS ảo (Crack)' };
    if (isO365) return { status: 'Bản quyền Office 365', isGenuine: true, text: 'Thuê bao chính hãng' };
    return { status: 'Bản quyền vĩnh viễn', isGenuine: true, text: 'Kích hoạt chính hãng (Retail/MAK)' };
  };

  const officeStatus = parseOfficeStatus(officeInfo);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      
      {/* KHỐI HỆ ĐIỀU HÀNH */}
      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)] flex flex-col justify-between">
        <div>
          <h4 className="text-green-400 font-black text-lg mb-5 flex items-center gap-3 border-b border-green-500/20 pb-3 uppercase tracking-wider"><Monitor size={24}/> HỆ ĐIỀU HÀNH & BẢN QUYỀN</h4>
          <div className="space-y-4 text-[15px] text-gray-300">
            <p><span className="font-semibold text-gray-500 inline-block w-36">Hệ điều hành:</span> <span className="text-white">{data.os}</span></p>
            <p><span className="font-semibold text-gray-500 inline-block w-36">OS Build:</span> <span className="text-white">{osDetails ? osDetails.build : "..."}</span></p>
            <p><span className="font-semibold text-gray-500 inline-block w-36">Ngày cài đặt:</span> <span className="text-white">{osDetails ? osDetails.install_date : "..."}</span></p>
            <p><span className="font-semibold text-gray-500 inline-block w-36">Product Key:</span> <span className="text-yellow-400 font-mono text-[16px]">{osDetails ? osDetails.license_key : "..."}</span></p>
            
            <div className="pt-3 border-t border-green-500/10 flex flex-col gap-3">
              <div>
                <span className="font-semibold text-gray-500 inline-block w-36">Bản quyền:</span> 
                <span className={`font-bold text-[16px] ${osDetails ? (osDetails.is_genuine ? 'text-green-400' : 'text-red-500') : 'text-gray-500'}`}>
                  {osDetails ? osDetails.license_status_text : "..."}
                </span>
              </div>
              
              {osDetails && (
                <div className="bg-[#111] p-3 rounded-lg border border-gray-800 mt-2">
                  <span className="font-semibold text-gray-500 inline-block w-36">Đánh giá HĐH:</span>
                  {osDetails.is_ghost ? (
                    <div className="mt-2 text-sm text-red-400 flex flex-col gap-1.5">
                      <span className="font-bold flex items-center gap-1"><AlertTriangle size={16}/> NGHI NGỜ BẢN GHOST / BỊ CHỈNH SỬA:</span>
                      {osDetails.ghost_reasons.map((r: string, i: number) => <span key={i} className="pl-5">- {r}</span>)}
                    </div>
                  ) : (
                    <span className="font-bold text-green-400 text-[15px]">Bản cài đặt Windows tiêu chuẩn (Sạch)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <button onClick={() => invoke('open_slmgr')} className="mt-6 bg-[#111] hover:bg-green-500/20 border border-green-500/30 text-green-400 px-5 py-4 rounded-xl text-[15px] font-black transition-all w-full flex justify-center items-center gap-3 active:scale-95 uppercase tracking-wider">
            <ShieldCheck size={20}/> KIỂM TRA LICENSE WINDOWS
        </button>
      </div>

      {/* KHỐI PHẦN CỨNG & MẠNG */}
      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]">
        <h4 className="text-green-400 font-black text-lg mb-5 flex items-center gap-3 border-b border-green-500/20 pb-3 uppercase tracking-wider"><Cpu size={24}/> THÔNG SỐ PHẦN CỨNG & MẠNG</h4>
        <div className="space-y-4 text-[15px] text-gray-300">
          <p><span className="font-semibold text-gray-500 inline-block w-40">Mainboard Serial:</span> <span className="text-green-400 font-mono font-bold bg-green-500/10 px-2.5 py-1 rounded text-[16px]">{data.baseboard_serial}</span></p>
          <p><span className="font-semibold text-gray-500 inline-block w-40">Vi xử lý (CPU):</span> <span className="text-white">{data.cpu}</span></p>
          <p><span className="font-semibold text-gray-500 inline-block w-40">Dung lượng RAM:</span> <span className="text-white font-bold">{data.ram}</span></p>
          <p><span className="font-semibold text-gray-500 inline-block w-40">Địa chỉ IPv4:</span> <span className="text-yellow-400 font-mono font-bold bg-yellow-500/10 px-2.5 py-1 rounded text-[16px]">{data.ipv4}</span></p>
          <p><span className="font-semibold text-gray-500 inline-block w-40">Kết nối Internet:</span> 
            <span className={`font-bold flex-inline items-center gap-1 ${data.internet_connected ? 'text-green-400' : 'text-red-500'}`}>
              {data.internet_connected ? "Có kết nối" : "Không có Internet"}
            </span>
          </p>

          <div className="mt-6 border-t border-green-500/20 pt-4">
            <span className="font-bold text-gray-400 block mb-3 text-sm uppercase tracking-widest">Danh sách Card Mạng ({data.adapters.length}):</span>
            <div className="space-y-2.5 max-h-36 overflow-y-auto custom-scrollbar pr-2">
              {data.adapters.map((adapter: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-[#111] p-3 rounded-lg border border-green-500/10">
                  <span className="text-[14px] text-white truncate w-48 font-medium" title={adapter.name}>{adapter.name}</span>
                  <span className="text-[14px] font-mono text-yellow-400 bg-black/50 px-2 py-1 rounded">{adapter.mac}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-green-500/30 lg:col-span-2">
        <h4 className="text-green-400 font-black text-lg mb-5 flex items-center gap-3 border-b border-green-500/20 pb-3 uppercase tracking-wider"><HardDrive size={24}/> THÔNG TIN Ổ CỨNG VẬT LÝ ({disks.length} Ổ CỨNG)</h4>
        <div className="overflow-x-auto rounded-xl border border-green-500/20 bg-[#111]">
          <table className="w-full text-[15px] text-left text-gray-300">
            <thead className="text-[13px] text-green-500 uppercase bg-green-500/10 font-black tracking-widest">
              <tr><th className="px-5 py-4">Tên ổ cứng</th><th className="px-5 py-4">Phân loại</th><th className="px-5 py-4">Serial Number</th></tr>
            </thead>
            <tbody>
              {disks.length === 0 && <tr><td colSpan={3} className="px-5 py-4 text-center italic text-gray-500">Đang quét ổ cứng...</td></tr>}
              {disks.map((d: any, i: number) => (
                <tr key={i} className="border-b border-green-500/10 hover:bg-[#1a1a1a]">
                  <td className="px-5 py-4 font-bold text-white">{d.name}</td>
                  <td className="px-5 py-4"><span className={`px-3 py-1.5 rounded text-[13px] font-black tracking-wider ${d.media_type.toUpperCase() === 'SSD' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-500'}`}>{d.media_type}</span></td>
                  <td className="px-5 py-4 font-mono text-[16px] text-green-400 font-bold">{d.serial}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-green-500/30 lg:col-span-2">
        <h4 className="text-green-400 font-black text-lg mb-5 flex items-center gap-3 border-b border-green-500/20 pb-3 uppercase tracking-wider"><FileText size={24}/> THÔNG TIN BẢN QUYỀN OFFICE</h4>
        
        <div className="mb-5 bg-[#111] p-4 rounded-xl border border-gray-800 flex items-center gap-4">
           <span className="font-bold text-gray-500 text-[15px] uppercase tracking-wider">Kết quả phân tích:</span>
           <span className={`font-black text-[15px] px-4 py-2 rounded-lg ${officeStatus.isGenuine ? 'bg-green-500/15 text-green-400 border border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-red-500/15 text-red-500 border border-red-500/30'}`}>
              {officeStatus.status}
           </span>
           <span className="text-[14px] text-gray-400 italic block">{officeStatus.text}</span>
        </div>

        <div className="bg-[#050505] p-5 rounded-xl border border-green-500/20 overflow-x-auto h-56 overflow-y-auto custom-scrollbar">
           <pre className="font-mono text-[14px] text-green-400/90 whitespace-pre-wrap leading-relaxed">{officeInfo}</pre>
        </div>
      </div>
    </div>
  );
};