
import React from 'react';

export const ForensicsView: React.FC = () => {
  const hardwareInfo = {
    imsi: "310-260-000000001",
    imei: "350000000000001",
    lastSwap: "2023-11-20 14:30:22",
    carrier: "T-Mobile USA",
    status: "Verified Pairing"
  };

  const swapHistory = [
    { date: "2023-11-20 14:30:22", carrier: "T-Mobile USA", event: "Hardware Re-pairing", type: "AUTHORIZED" },
    { date: "2023-05-12 09:15:45", carrier: "Verizon Wireless", event: "Port-in Service", type: "AUTHORIZED" },
    { date: "2022-10-04 18:22:10", carrier: "AT&T Mobility", event: "Initial Activation", type: "SYSTEM" }
  ];

  return (
    <div className="p-6 space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-medium text-gray-900">SIM Forensic</h1>
        <p className="text-gray-500">Carrier Integrity Report</p>
      </header>

      {/* Primary Forensic Report */}
      <div className="bg-[#1c1b1f] text-[#e6e1e5] rounded-[28px] p-6 font-mono text-sm overflow-hidden relative shadow-lg">
        <div className="absolute top-4 right-4 animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-2">
            <div className="text-gray-400 mb-1 uppercase text-xs font-bold tracking-widest">Primary IMSI</div>
            <div className="text-lg">{hardwareInfo.imsi}</div>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <div className="text-gray-400 mb-1 uppercase text-xs font-bold tracking-widest">Device IMEI</div>
            <div className="text-lg">{hardwareInfo.imei}</div>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <div className="text-gray-400 mb-1 uppercase text-xs font-bold tracking-widest">Last Sync</div>
            <div className="text-lg">{hardwareInfo.lastSwap}</div>
          </div>
          <div className="pt-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">{hardwareInfo.status}</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
              IMSI matches device hardware profile. No unauthorized SIM swaps detected within the 72-hour critical fraud window.
            </p>
          </div>
        </div>
      </div>

      {/* SIM Swap History Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium px-2">Swap History</h3>
        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          {swapHistory.map((swap, idx) => (
            <div 
              key={idx} 
              className={`p-5 flex items-start gap-4 ${idx !== swapHistory.length - 1 ? 'border-b border-gray-50' : ''} transition-colors active:bg-gray-50`}
            >
              <div className="flex flex-col items-center mt-1">
                <div className={`w-3 h-3 rounded-full ${idx === 0 ? 'bg-green-500 ring-4 ring-green-100' : 'bg-gray-300'}`} />
                {idx !== swapHistory.length - 1 && <div className="w-0.5 h-12 bg-gray-100 mt-1" />}
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-bold text-gray-900">{swap.event}</span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${swap.type === 'AUTHORIZED' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                    {swap.type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{swap.carrier}</div>
                <div className="text-[10px] text-gray-400 mt-1 font-mono">{swap.date}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Risk Parameters */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium px-2">Monitoring Status</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Critical Window", value: "72h", active: true },
            { label: "Telco API Poll", value: "15m", active: true },
            { label: "Hardware Lock", value: "ON", active: true },
            { label: "Cross-Pollination", value: "Active", active: true },
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight mb-1">{item.label}</div>
              <div className={`text-sm font-bold ${item.active ? 'text-[#6750a4]' : 'text-gray-400'}`}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
