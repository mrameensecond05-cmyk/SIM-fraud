
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { RiskLevel } from '../types';

const data = [
  { time: '09:00', risk: 10 },
  { time: '12:00', risk: 15 },
  { time: '15:00', risk: 85 },
  { time: '18:00', risk: 30 },
  { time: '21:00', risk: 20 },
];

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-6 pb-24">
      <header className="px-4 pt-8">
        <h1 className="text-3xl font-medium text-gray-900">Security Pulse</h1>
        <p className="text-gray-500">Device: Pixel 8 Pro • IMSI Locked</p>
      </header>

      {/* Main Risk Score Card */}
      <div className="mx-4 p-6 bg-[#f3edf7] rounded-[28px] border border-[#eaddff]">
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className="text-sm font-medium text-[#6750a4] uppercase tracking-wider">Current Risk Level</span>
            <div className="text-4xl font-bold text-[#21005d] mt-1">SECURE</div>
          </div>
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>
        
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6750a4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6750a4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="risk" stroke="#6750a4" fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
              <Tooltip />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-4">
        <div className="p-5 bg-white rounded-[24px] shadow-sm border border-gray-100">
          <div className="text-[#6750a4] mb-2 font-medium">Monitoring</div>
          <div className="text-2xl font-bold">24/7</div>
          <div className="text-xs text-gray-400 mt-1">Real-time SMS analysis</div>
        </div>
        <div className="p-5 bg-white rounded-[24px] shadow-sm border border-gray-100">
          <div className="text-[#6750a4] mb-2 font-medium">SIM Status</div>
          <div className="text-2xl font-bold">LOCKED</div>
          <div className="text-xs text-gray-400 mt-1">No swap detected</div>
        </div>
      </div>

      {/* Recent Alerts Quick View */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium px-2">Recent Flags</h2>
          <button className="text-[#6750a4] font-medium text-sm">View all</button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center p-4 bg-white rounded-[20px] shadow-sm border border-gray-50">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">High Risk: Phishing</div>
              <div className="text-sm text-gray-500">Suspicious link from Unknown</div>
            </div>
            <div className="text-xs text-gray-400">2h ago</div>
          </div>
        </div>
      </div>
    </div>
  );
};
