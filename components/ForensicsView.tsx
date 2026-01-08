
import React from 'react';

export const ForensicsView: React.FC = () => {
  const hardwareInfo = {
    imsi: "310-260-000000001",
    imei: "350000000000001",
    lastSwap: "2023-11-20 14:30:22",
    carrier: "T-Mobile USA",
    status: "Verified Pairing"
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-medium text-gray-900">SIM Forensic</h1>
        <p className="text-gray-500">Carrier Integrity Report</p>
      </header>

      <div className="bg-[#1c1b1f] text-[#e6e1e5] rounded-[28px] p-6 font-mono text-sm overflow-hidden relative">
        <div className="absolute top-4 right-4 animate-pulse">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
        </div>
        <div className="space-y-4">
          <div className="border-b border-gray-700 pb-2">
            <div className="text-gray-400 mb-1 uppercase text-xs">Primary IMSI</div>
            <div className="text-lg">{hardwareInfo.imsi}</div>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <div className="text-gray-400 mb-1 uppercase text-xs">Device IMEI</div>
            <div className="text-lg">{hardwareInfo.imei}</div>
          </div>
          <div className="border-b border-gray-700 pb-2">
            <div className="text-gray-400 mb-1 uppercase text-xs">Last Carrier Update</div>
            <div className="text-lg">{hardwareInfo.lastSwap}</div>
          </div>
          <div className="pt-2">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>{hardwareInfo.status}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              IMSI matches device profile. No unauthorized SIM swaps detected within the 72-hour critical window.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-medium px-2">Risk Parameters</h3>
        <div className="space-y-3">
          {[
            { label: "Critical Window", value: "72 Hours", active: true },
            { label: "Carrier API Poll", value: "Every 15m", active: true },
            { label: "Hardware Lock", value: "Enabled", active: true },
            { label: "Remote Wipe", value: "Ready", active: false },
          ].map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <span className="text-gray-700">{item.label}</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'}`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
