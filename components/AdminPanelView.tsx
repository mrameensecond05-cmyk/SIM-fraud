
import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { SMSAlert, RiskLevel } from '../types';

interface Props {
  alerts: SMSAlert[];
}

export const AdminPanelView: React.FC<Props> = ({ alerts }) => {
  const stats = {
    totalUsers: 14205,
    activeSims: 28410,
    threatsBlocked: 342,
    aiAccuracy: 99.4,
    systemLoad: 12,
    modelVersion: "3.4-Flash-Native"
  };

  const performanceData = [
    { name: '00:00', detections: 12 },
    { name: '04:00', detections: 5 },
    { name: '08:00', detections: 45 },
    { name: '12:00', detections: 82 },
    { name: '16:00', detections: 65 },
    { name: '20:00', detections: 38 },
  ];

  return (
    <div className="p-6 space-y-8 pb-24 bg-[#f8f9fa]">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">System Admin</h1>
          <p className="text-gray-500 font-medium">Headquarters Oversight Panel</p>
        </div>
        <div className="bg-blue-600 text-white px-4 py-2 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-200">
          Live System
        </div>
      </header>

      {/* High Level Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", value: stats.totalUsers.toLocaleString(), icon: "👥", color: "text-blue-600" },
          { label: "Threats Blocked", value: stats.threatsBlocked, icon: "🛡️", color: "text-red-600" },
          { label: "AI Accuracy", value: `${stats.aiAccuracy}%`, icon: "🧠", color: "text-purple-600" },
          { label: "System Load", value: `${stats.systemLoad}%`, icon: "⚡", color: "text-green-600" }
        ].map((stat, i) => (
          <div key={i} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm">
            <div className="text-2xl mb-2">{stat.icon}</div>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* AI Performance Graph */}
      <section className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-gray-800">Detection Velocity (24h)</h3>
          <div className="text-xs text-gray-400 font-mono">MODEL: {stats.modelVersion}</div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={performanceData}>
              <defs>
                <linearGradient id="colorDetections" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="detections" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorDetections)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Recent Activity (Privacy-First) */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-bold text-gray-800">Alert Oversight (Content Masked)</h3>
          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">PRIVACY MODE ACTIVE</span>
        </div>

        <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Alert ID</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Source</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Risk Level</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase">Reasoning Snippet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {alerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">#{alert.id.slice(0, 8)}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900">User_{alert.sender.slice(-4)}</div>
                    <div className="text-[10px] text-gray-400">{alert.timestamp}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${alert.riskLevel === RiskLevel.CRITICAL ? 'bg-red-50 text-red-600' :
                      alert.riskLevel === RiskLevel.HIGH ? 'bg-orange-50 text-orange-600' : 'bg-yellow-50 text-yellow-600'
                      }`}>
                      {alert.riskLevel}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-gray-600 line-clamp-1 max-w-xs">{alert.reasoning}</p>
                    <div className="mt-1 flex gap-2">
                      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gray-300" style={{ width: '100%' }}></div>
                      </div>
                      <span className="text-[8px] font-bold text-gray-300 italic uppercase">Content Redacted</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Admin Quick Controls */}
      <section className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <button className="bg-[#1c1b1f] text-white p-6 rounded-[28px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform shadow-xl">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
          <span className="text-sm font-bold">Retrain AI Model</span>
        </button>
        <button className="bg-white border-2 border-red-100 text-red-600 p-6 rounded-[28px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <span className="text-sm font-bold">Emergency Kill-Switch</span>
        </button>
        {/* APK Download Button */}
        <a
          href="/api/download/simtinel.apk"
          download
          className="bg-blue-50 border-2 border-blue-100 text-blue-600 p-6 rounded-[28px] flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform hover:bg-blue-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          <span className="text-sm font-bold">Download APK</span>
        </a>
      </section>
    </div>
  );
};
