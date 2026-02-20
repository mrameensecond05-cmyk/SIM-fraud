
import React from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  YAxis,
  XAxis
} from 'recharts';

export const Dashboard: React.FC = () => {
  const currentRiskScore = 94; // Score out of 100 (where 100 is perfectly safe)
  
  // Data for the semi-circle gauge
  const gaugeData = [
    { value: currentRiskScore },
    { value: 100 - currentRiskScore },
    { value: 100 }, // This creates the bottom half empty space for a semi-circle effect
  ];

  const getColor = (score: number) => {
    if (score > 85) return '#10b981'; // Safe - Emerald 500
    if (score > 60) return '#f59e0b'; // Warning - Amber 500
    return '#ef4444'; // Critical - Red 500
  };

  // Mock historical data for the sparkline
  const sparkData = [
    { time: '1', score: 98 },
    { time: '2', score: 97 },
    { time: '3', score: 95 },
    { time: '4', score: 94 },
    { time: '5', score: 96 },
    { time: '6', score: 94 },
  ];

  return (
    <div className="space-y-6 pb-24">
      <header className="px-4 pt-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SIMtinel Pulse</h1>
        <p className="text-gray-500 font-medium">Device Integrity: <span className="text-green-600">Locked</span></p>
      </header>

      {/* Hero Risk Score Gauge Card */}
      <div className="mx-4 p-8 bg-white rounded-[40px] shadow-xl shadow-gray-100 border border-gray-50 flex flex-col items-center overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gray-50 overflow-hidden">
            <div 
              className="h-full transition-all duration-1000 ease-out" 
              style={{ width: `${currentRiskScore}%`, backgroundColor: getColor(currentRiskScore) }}
            />
        </div>

        <div className="w-full flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Hardware Trust</span>
          </div>
          <span className="text-[10px] font-bold text-[#6750a4] bg-[#f3edf7] px-2 py-0.5 rounded-full">ACTIVE MONITOR</span>
        </div>
        
        {/* Semi-Circle Gauge */}
        <div className="relative w-full h-48 -mb-12 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="80%"
                startAngle={180}
                endAngle={0}
                innerRadius="85%"
                outerRadius="115%"
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={getColor(currentRiskScore)} cornerRadius={40} />
                <Cell fill="#f1f5f9" />
                <Cell fill="transparent" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          
          <div className="absolute top-20 flex flex-col items-center justify-center">
            <span className="text-5xl font-black text-gray-900 tracking-tighter">
              {currentRiskScore}
            </span>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
              Safety Rating
            </span>
          </div>
        </div>

        {/* Dynamic Status Text */}
        <div className="text-center mt-4 mb-8">
            <div className={`text-sm font-bold uppercase tracking-tight ${currentRiskScore > 80 ? 'text-green-600' : 'text-orange-500'}`}>
                {currentRiskScore > 80 ? 'System Fully Secured' : 'Minor Vulnerability Detected'}
            </div>
            <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                Last deep-scan completed 4 minutes ago with zero anomalies.
            </p>
        </div>

        {/* Trend Sparkline */}
        <div className="w-full h-12 mt-2 opacity-50">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                    <Line 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#6750a4" 
                        strokeWidth={2} 
                        dot={false} 
                    />
                    <YAxis domain={[90, 100]} hide />
                </LineChart>
            </ResponsiveContainer>
        </div>

        <div className="w-full grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-50">
          <div className="text-center">
            <div className="text-[9px] font-black text-gray-300 uppercase mb-1">IMSI</div>
            <div className="text-xs font-bold text-gray-900">VERIFIED</div>
          </div>
          <div className="text-center border-x border-gray-100">
            <div className="text-[9px] font-black text-gray-300 uppercase mb-1">Swap</div>
            <div className="text-xs font-bold text-gray-900">CLEAN</div>
          </div>
          <div className="text-center">
            <div className="text-[9px] font-black text-gray-300 uppercase mb-1">Entropy</div>
            <div className="text-xs font-bold text-gray-900">LOW</div>
          </div>
        </div>
      </div>

      {/* Real-time Processing Stats */}
      <div className="grid grid-cols-2 gap-4 px-4">
        <div className="p-5 bg-white rounded-[32px] shadow-sm border border-gray-100 relative overflow-hidden group active:bg-gray-50 transition-colors">
          <div className="absolute top-0 right-0 p-2 opacity-10">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
          </div>
          <div className="text-[#6750a4] text-[10px] font-black uppercase tracking-widest mb-1">Scanned</div>
          <div className="text-2xl font-black text-gray-900">1,204</div>
          <div className="text-[9px] text-gray-400 mt-1 font-bold">Total SMS Analyzed</div>
        </div>
        
        <div className="p-5 bg-[#1c1b1f] rounded-[32px] shadow-sm relative overflow-hidden group active:opacity-90 transition-opacity text-white">
          <div className="absolute top-0 right-0 p-2 opacity-20">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
          </div>
          <div className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-1">Shield</div>
          <div className="text-2xl font-black">Active</div>
          <div className="text-[9px] text-gray-500 mt-1 font-bold">Local Neural Engine</div>
        </div>
      </div>

      {/* Activity Feed Section */}
      <div className="px-4">
        <div className="flex justify-between items-center mb-4 px-2">
          <h2 className="text-xl font-bold text-gray-800">Security Log</h2>
          <button className="text-[10px] font-black text-[#6750a4] uppercase tracking-widest">History</button>
        </div>
        <div className="space-y-3">
          <div className="flex items-center p-5 bg-white rounded-[28px] shadow-sm border border-gray-50 hover:border-indigo-100 transition-all cursor-pointer">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mr-4 text-indigo-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-sm">Pattern Scanned</div>
              <div className="text-[10px] text-gray-500 font-medium">Bank-OTP structural analysis... OK</div>
            </div>
            <div className="text-[9px] font-black text-gray-300">JUST NOW</div>
          </div>
          
          <div className="flex items-center p-5 bg-white rounded-[28px] shadow-sm border border-gray-50">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mr-4 text-green-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 003 11c0-5.523 4.477-10 10-10s10 4.477 10 10a10.003 10.003 0 01-6.112 9.212l-.054.09A10.003 10.003 0 0112 21c-1.127 0-2.215-.19-3.23-.538L9 20h3v-2h-3l-1-1H7v-3h2v-2H7l-1-1H3"/></svg>
            </div>
            <div className="flex-1">
              <div className="font-bold text-gray-900 text-sm">AI Engine Update</div>
              <div className="text-[10px] text-gray-500 font-medium">New fraud patterns loaded: v3.4.1</div>
            </div>
            <div className="text-[9px] font-black text-gray-300">12M AGO</div>
          </div>
        </div>
      </div>
    </div>
  );
};
