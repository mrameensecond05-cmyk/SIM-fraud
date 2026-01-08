
import React, { useState } from 'react';

export const SettingsView: React.FC = () => {
  const [bankThreshold, setBankThreshold] = useState(500);

  return (
    <div className="p-6 space-y-8 pb-24">
      <header>
        <h1 className="text-3xl font-medium text-gray-900">Guard Settings</h1>
        <p className="text-gray-500">Customize detection rules</p>
      </header>

      <section className="space-y-4">
        <h3 className="text-lg font-medium px-2">Transaction Protection</h3>
        <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Flag transactions above</label>
              <span className="text-sm font-bold text-[#6750a4]">${bankThreshold}</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="5000" 
              step="100"
              value={bankThreshold}
              onChange={(e) => setBankThreshold(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#6750a4]"
            />
            <p className="text-xs text-gray-400 mt-2">
              Any SMS from banks involving amounts higher than this will trigger an identity verification.
            </p>
          </div>

          <div className="flex items-center justify-between py-2 border-t border-gray-50">
            <div>
              <div className="font-medium">OTP Auto-Extraction</div>
              <div className="text-xs text-gray-400">Read codes without storing msg</div>
            </div>
            <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                <input type="checkbox" defaultChecked className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer right-0 border-green-400"/>
                <label className="toggle-label block overflow-hidden h-6 rounded-full bg-green-400 cursor-pointer"></label>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-lg font-medium px-2">Permissions</h3>
        <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>
                    </div>
                    <span className="font-medium">SMS Access</span>
                </div>
                <span className="text-green-600 text-sm font-medium">GRANTED</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/></svg>
                    </div>
                    <span className="font-medium">Notifications</span>
                </div>
                <span className="text-green-600 text-sm font-medium">GRANTED</span>
            </button>
        </div>
      </section>

      <button className="w-full py-4 text-red-600 font-medium border border-red-100 rounded-[28px] hover:bg-red-50">
        Reset Security Model
      </button>
    </div>
  );
};
