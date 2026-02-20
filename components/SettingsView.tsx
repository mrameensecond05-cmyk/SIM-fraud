
import React, { useState } from 'react';

export const SettingsView: React.FC = () => {
  const [bankThreshold, setBankThreshold] = useState(500);
  const [alerts, setAlerts] = useState({
    largeTransfers: true,
    international: true,
    newBeneficiary: false
  });

  const toggleAlert = (key: keyof typeof alerts) => {
    setAlerts(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
    if (!isNaN(value)) {
      setBankThreshold(Math.min(100000, value)); // Allow higher manual input but cap at 100k for sanity
    }
  };

  return (
    <div className="p-6 space-y-8 pb-24">
      <header>
        <h1 className="text-3xl font-medium text-gray-900">Guard Settings</h1>
        <p className="text-gray-500">Customize detection rules</p>
      </header>

      {/* Threshold Protection Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium px-2 text-gray-800">Threshold Protection</h3>
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">Flag transactions above</label>
              <div className="relative mt-2">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold text-lg">₹</span>
                </div>
                <input
                  type="number"
                  value={bankThreshold}
                  onChange={handleInputChange}
                  className="block w-full pl-10 pr-4 py-4 bg-gray-50 border-none rounded-2xl text-xl font-bold text-[#6750a4] focus:ring-2 focus:ring-[#6750a4] transition-all outline-none"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            
            <div className="pt-2">
              <input 
                type="range" 
                min="0" 
                max="10000" 
                step="100"
                value={Math.min(10000, bankThreshold)}
                onChange={(e) => setBankThreshold(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6750a4]"
              />
              <div className="flex justify-between mt-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                <span>Min: ₹0</span>
                <span>Slider Max: ₹10,000</span>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Any SMS from banks involving amounts higher than this will trigger an automated identity verification challenge.
            </p>
          </div>

          <div className="flex items-center justify-between py-4 border-t border-gray-50">
            <div>
              <div className="font-medium">OTP Auto-Extraction</div>
              <div className="text-xs text-gray-400">Securely read codes without storage</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6750a4]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Bank Transaction Alerts Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium px-2 text-gray-800">Detection Modalities</h3>
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-1">
          
          <div className="flex items-center justify-between py-4">
            <div className="pr-4">
              <div className="font-medium text-gray-900">Large Outgoing Transfers</div>
              <div className="text-xs text-gray-400">Heuristic monitoring for whale movements</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={alerts.largeTransfers}
                onChange={() => toggleAlert('largeTransfers')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6750a4]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-4 border-t border-gray-50">
            <div className="pr-4">
              <div className="font-medium text-gray-900">International Transactions</div>
              <div className="text-xs text-gray-400">Cross-border pattern detection</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={alerts.international}
                onChange={() => toggleAlert('international')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6750a4]"></div>
            </label>
          </div>

          <div className="flex items-center justify-between py-4 border-t border-gray-50">
            <div className="pr-4">
              <div className="font-medium text-gray-900">New Beneficiary Transfers</div>
              <div className="text-xs text-gray-400">Risk-weight first-time payees</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={alerts.newBeneficiary}
                onChange={() => toggleAlert('newBeneficiary')}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#6750a4]"></div>
            </label>
          </div>
        </div>
      </section>

      {/* Permissions Section */}
      <section className="space-y-4">
        <h3 className="text-lg font-medium px-2 text-gray-800">System Core Permissions</h3>
        <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    </div>
                    <span className="font-bold text-gray-700">SMS Telemetry</span>
                </div>
                <span className="text-green-600 text-[10px] font-black tracking-widest uppercase">Granted</span>
            </button>
            <button className="w-full flex items-center justify-between p-5 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4">
                    <div className="p-2.5 bg-purple-50 rounded-xl text-purple-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    </div>
                    <span className="font-bold text-gray-700">Push Notifications</span>
                </div>
                <span className="text-green-600 text-[10px] font-black tracking-widest uppercase">Granted</span>
            </button>
        </div>
      </section>

      <div className="px-2">
        <button className="w-full py-4 text-red-600 font-bold border-2 border-red-50 rounded-[28px] hover:bg-red-50 transition-colors active:scale-95 duration-150">
          Reset Neural Engine Rules
        </button>
      </div>
    </div>
  );
};
