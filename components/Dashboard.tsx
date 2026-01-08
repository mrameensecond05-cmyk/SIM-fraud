
import React from 'react';
import { 
  ResponsiveContainer, 
  RadialBarChart, 
  RadialBar, 
  PolarAngleAxis 
} from 'recharts';
import { RiskLevel } from '../types';

export const Dashboard: React.FC = () => {
  const currentRiskScore = 98; // Score out of 100 (where 100 is perfectly safe)
  
  const gaugeData = [
    {
      name: 'Security Score',
      value: currentRiskScore,
      fill: currentRiskScore > 80 ? '#2e7d32' : currentRiskScore > 50 ? '#f9a825' : '#c62828',
    },
  ];

  return (
    <div className="space-y-6 pb-24">
      <header className="px-4 pt-8">
        <h1 className="text-3xl font-medium text-gray-900">Security Pulse</h1>
        <p className="text-gray-500 font-medium">Device: Pixel 8 Pro • IMSI Locked</p>
      </header>

      {/* Main Risk Score Card with Gauge */}
      <div className="mx-4 p-6 bg-white rounded-[32px] shadow-sm border border-gray-100 flex flex-col items-center">
        <div className="w-full flex justify-between items-start mb-2 px-2">
          <span className="text-sm font-bold text-[#6750a4] uppercase tracking-widest">System Integrity</span>
          <span className="text-xs text-gray-400">Scan: 2m ago</span>
        </div>
        
        <div className="relative w-full h-64 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart 
              cx="50%" 
              cy="50%" 
              innerRadius="70%" 
              outerRadius="100%" 
              barSize={20} 
              data={gaugeData} 
              startAngle={90} 
              endAngle={450}
            >
              <PolarAngleAxis
                type="number"
                domain={[0, 100]}
                angleAxisId={0}
                tick={false}
              />
              <RadialBar
                background
                dataKey="value"
                cornerRadius={10}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          
          <div className="absolute flex flex-col items-center justify-center">
            <div className="text-5xl font-bold text-gray-900 tracking-tighter">
              {currentRiskScore}%
            </div>
            <div className="text-sm font-medium text-green-600 uppercase tracking-widest mt-1">
              Protected
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-3 gap-4 mt-2">
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">IMSI</div>
            <div className="text-sm font-bold text-green-600 uppercase">Match</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-xs text-gray-400 mb-1">Swap</div>
            <div className="text-sm font-bold text-gray-900">None</div>
          </div>
          <div className="text-center">
            <div className="text-xs text-gray-400 mb-1">Threats</div>
            <div className="text-sm font-bold text-gray-900">0</div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 px-4">
        <div className="p-5 bg-white rounded-[24px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <div className="text-[#6750a4] text-xs font-bold uppercase tracking-wider">Live Monitoring</div>
          </div>
          <div className="text-2xl font-bold">Active</div>
          <div className="text-[10px] text-gray-400 mt-1 uppercase font-medium">Real-time SMS stream</div>
        </div>
        <div className="p-5 bg-white rounded-[24px] shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-2 text-[#6750a4]">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 003 11c0-5.523 4.477-10 10-10s10 4.477 10 10a10.003 10.003 0 01-6.112 9.212l-.054.09A10.003 10.003 0 0112 21c-1.127 0-2.215-.19-3.23-.538L9 20h3v-2h-3l-1-1H7v-3h2v-2H7l-1-1H3" /></svg>
            <div className="text-xs font-bold uppercase tracking-wider">AI Model</div>
          </div>
          <div className="text-2xl font-bold">v3.4-F</div>
          <div className="text-[10px] text-gray-400 mt-1 uppercase font-medium">Neural Detection</div>
        </div>
      </div>

      {/* Recent Alerts Quick View */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium px-2">Recent Flags</h2>
          <button className="text-[#6750a4] font-bold text-sm bg-[#f3edf7] px-4 py-1 rounded-full">See All</button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center p-4 bg-white rounded-[24px] shadow-sm border border-gray-50 group active:scale-[0.98] transition-transform">
            <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-sm">High Risk: Phishing</div>
              <div className="text-xs text-gray-500">Bank impersonation blocked</div>
            </div>
            <div className="text-[10px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded">2H AGO</div>
          </div>
        </div>
      </div>
    </div>
  );
};
