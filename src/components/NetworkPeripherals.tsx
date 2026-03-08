import React from 'react';
import { invoke } from '@tauri-apps/api/core';
import { Usb, Globe, Bluetooth, Smartphone, Save, Wifi, PowerOff, ShieldAlert } from 'lucide-react';

export const NetworkPeripherals: React.FC<any> = ({ peripherals, usbHistory, mtpHistory, connections }) => {
  const bluetoothList = Array.isArray(peripherals) ? peripherals : [];
  const usbHistoryList = Array.isArray(usbHistory) ? usbHistory : [];
  const mtpHistoryList = Array.isArray(mtpHistory) ? mtpHistory : [];
  const connectionList = Array.isArray(connections) ? connections : [];

  const handleOpenEventViewer = () => invoke('open_event_viewer').catch(console.error);
  const handleOpenRegistry = () => invoke('open_registry').catch(console.error);

  const parseNetworkMessage = (msg: string) => {
    if (!msg) return null;
    const cleanMsg = msg.replace(/\n|\r/g, ' ').replace(/\s+/g, ' ');
    const regex = /(Name:|Description:|Desc:|Type:|State:|Category:|Tên:|Mô tả:|Loại:|Trạng thái:|Danh mục:)/ig;
    const parts = cleanMsg.split(regex).filter(p => p && p.trim() !== '');

    if (parts.length <= 1) return null;
    const result: Record<string, string> = {};
    let currentKey = '';
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i].trim();
      if (part.endsWith(':')) {
        currentKey = part.replace(':', '').trim();
      } else if (currentKey) {
        result[currentKey] = part;
        currentKey = '';
      }
    }
    return Object.keys(result).length > 0 ? result : null;
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      
      {/* THIẾT BỊ NGOẠI VI & USB HISTORY */}
      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)] h-[800px] flex flex-col">
        <div className="flex justify-between items-center border-b border-green-500/20 pb-3 mb-5 shrink-0">
          <h4 className="text-green-400 font-black text-lg flex items-center gap-3 uppercase tracking-wider">
            <Usb size={24}/> KẾT NỐI NGOẠI VI & LƯU TRỮ
          </h4>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-8">
          
          {/* ----- USB FORENSIC ----- */}
          <div>
            <h5 className="text-[13px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-yellow-400 bg-yellow-500/10 p-2 rounded-lg border border-yellow-500/20">
              <Save size={16}/> Lịch sử cắm Ổ cứng rời / USB ({usbHistoryList.length})
            </h5>
            <div className="space-y-4">
              {usbHistoryList.length === 0 ? (
                <div className="text-gray-600 text-sm italic">Không có dữ liệu.</div>
              ) : (
                usbHistoryList.map((p, i) => (
                  <div key={i} className="bg-[#111] border border-yellow-500/20 p-4 rounded-xl flex flex-col gap-3 hover:border-yellow-500/50 transition-colors shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-yellow-500/50"></div>
                    
                    <div className="flex justify-between items-start pl-3">
                      <div className="text-[16px] font-bold text-white leading-tight">{p.FriendlyName || "Unknown USB Device"}</div>
                      {p.DriveLetters && p.DriveLetters.length > 0 && (
                        <div className="bg-red-500/10 text-red-400 font-bold text-[12px] px-2.5 py-1 rounded border border-red-500/30 flex items-center gap-1.5">
                          <ShieldAlert size={14}/> Ổ: {p.DriveLetters.join(', ')}
                        </div>
                      )}
                    </div>

                    <div className="pl-3 grid grid-cols-2 gap-3 text-[12px] font-bold uppercase tracking-wider bg-black/40 p-3 rounded-lg border border-gray-800">
                       <span className="text-blue-400">Vendor: <span className="text-white ml-1">{p.Vendor || "N/A"}</span></span>
                       <span className="text-purple-400">Product: <span className="text-white ml-1">{p.Product || "N/A"}</span></span>
                       <span className="col-span-2 text-gray-500 mt-1">
                          Serial: <span className="text-yellow-400 text-[15px] lowercase font-black ml-2 tracking-widest bg-yellow-500/10 px-2 py-0.5 rounded">{p.Serial || "N/A"}</span>
                       </span>
                    </div>

                    <div className="pl-3 flex flex-col gap-1.5 text-[13px] font-mono text-gray-400 bg-[#0a0a0a] p-3 rounded-lg border border-gray-800/50">
                      <div className="flex justify-between items-center"><span className="text-gray-500 font-sans font-semibold">First Seen (PnP):</span> <span className="text-green-400 font-bold">{p.FirstSeen || "Trống"}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500 font-sans font-semibold">Last Seen (PnP):</span> <span className="text-green-400 font-bold">{p.LastSeen || "Trống"}</span></div>
                      <div className="flex justify-between items-center"><span className="text-gray-500 font-sans font-semibold">Registry Write:</span> <span className="text-gray-300">{p.RegistryLastWrite || "Trống"}</span></div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ----- MTP / ĐIỆN THOẠI ----- */}
          <div>
            <h5 className="text-[13px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-blue-400 bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
              <Smartphone size={16}/> Lịch sử cắm Điện thoại / MTP ({mtpHistoryList.length})
            </h5>
            <div className="space-y-3">
              {mtpHistoryList.length === 0 ? <div className="text-gray-600 text-sm italic">Không có dữ liệu.</div> : mtpHistoryList.map((p, i) => (
                <div key={i} className="bg-[#111] border border-blue-500/20 p-3 pl-4 rounded-xl hover:border-blue-500/50 flex justify-between items-center">
                  <div>
                    <div className="text-[15px] font-bold text-white mb-1">{p.FriendlyName}</div>
                    <div className="text-[12px] font-mono text-gray-500 font-semibold">Serial: <span className="text-blue-400 text-[14px]">{p.Serial}</span></div>
                  </div>
                  <div className="text-[12px] text-green-400 font-mono text-right font-bold bg-black/40 p-2 rounded-lg">
                    <span className="block text-gray-500 font-sans text-[11px] uppercase tracking-wider mb-1">Tương tác cuối</span>
                    {p.LastRegistryWrite}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ----- BLUETOOTH ----- */}
          <div>
            <h5 className="text-[13px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 text-indigo-400 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20">
              <Bluetooth size={16}/> Thiết bị Bluetooth ({bluetoothList.length})
            </h5>
            <div className="space-y-3">
              {bluetoothList.length === 0 ? <div className="text-gray-600 text-sm italic">Không có dữ liệu.</div> : bluetoothList.map((p, i) => (
                <div key={i} className="bg-[#111] border border-indigo-500/20 p-3 pl-4 rounded-xl hover:border-indigo-500/50 flex justify-between items-center">
                  <div>
                    <div className="text-[15px] font-bold text-white mb-1">{p.FriendlyName}</div>
                    <div className="text-[12px] font-mono text-gray-500 font-semibold">MAC/ID: <span className="text-indigo-400 text-[14px] uppercase tracking-widest">{p.Serial}</span></div>
                  </div>
                  <div className="text-[12px] text-green-400 font-mono text-right font-bold bg-black/40 p-2 rounded-lg">
                    <span className="block text-gray-500 font-sans text-[11px] uppercase tracking-wider mb-1">Tương tác cuối</span>
                    {p.LastRegistryWrite}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* LỊCH SỬ KẾT NỐI INTERNET */}
      <div className="bg-[#0a0a0a] p-6 rounded-2xl border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.05)] h-[800px] flex flex-col">
        <div className="flex justify-between items-center border-b border-green-500/20 pb-3 mb-5 shrink-0">
          <h4 className="text-green-400 font-black text-lg flex items-center gap-3 uppercase tracking-wider">
            <Globe size={24}/> LOG MẠNG (Event 10000, 10001)
          </h4>
          <div className="flex gap-3">
            <button onClick={handleOpenEventViewer} className="px-3 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-blue-500 hover:text-white transition-all active:scale-95">Event Viewer</button>
            <button onClick={handleOpenRegistry} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/30 rounded-lg text-[11px] font-black uppercase tracking-wider hover:bg-red-500 hover:text-white transition-all active:scale-95">Registry</button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-3 space-y-4">
          <div className="text-[13px] text-gray-500 italic text-center mb-3">Hiển thị tối đa 200 log kết nối. Đã parse dữ liệu trực tiếp từ Backend.</div>
          
          {connectionList.length === 0 ? (
            <div className="text-gray-500 italic text-sm text-center">Đang quét lịch sử kết nối...</div>
          ) : (
            connectionList.map((c: any, i: number) => {
              const isConnected = c.Status === 'Connected';
              const isWifi = c.Message?.toLowerCase().includes("wireless") || c.Message?.toLowerCase().includes("wi-fi") || c.Message?.toLowerCase().includes("wlan");

              return (
                <div key={i} className={`bg-[#111] border p-4 rounded-xl flex items-start gap-4 shadow-sm transition-colors ${isConnected ? 'border-green-500/20' : 'border-gray-800 opacity-70'}`}>
                  
                  <div className={`p-2.5 rounded-lg mt-1 shrink-0 ${isConnected ? (isWifi ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400') : 'bg-red-500/10 text-red-400'}`}>
                    {!isConnected ? <PowerOff size={20}/> : (isWifi ? <Wifi size={20}/> : <Globe size={20}/>)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-3 border-b border-gray-800 pb-2">
                      <span className="text-[13px] font-mono font-bold text-yellow-400">{c.Date}</span>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${isConnected ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.Status}
                      </span>
                    </div>
                    
                    {c.Name || c.Type || c.Category ? (
                      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px] text-gray-300 mt-1">
                        {c.Name && <div className="col-span-2 truncate"><span className="text-gray-500 font-semibold">Name:</span> <span className="font-black text-white text-[15px] ml-1">{c.Name}</span></div>}
                        {c.Type && <div className="truncate"><span className="text-gray-500 font-semibold">Type:</span> <span className="ml-1">{c.Type}</span></div>}
                        {c.Category && <div className="truncate"><span className="text-gray-500 font-semibold">Category:</span> <span className="ml-1">{c.Category}</span></div>}
                      </div>
                    ) : (
                       <div className="text-[13px] text-gray-400 break-words mt-1 leading-relaxed">{c.Message}</div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
    </div>
  );
};