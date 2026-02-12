import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AdminAppService } from '../../services/adminService';
import { AdminUser, AdminIncident, RiskLevel } from '../../types';

interface DashboardStats {
    totalUsers: number;
    activeThreats: number;
    threatsBlockedToday: number;
    systemHealth: string;
}

export const AdminDashboard: React.FC = () => {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        AdminAppService.getStats().then((data) => {
            setStats(data as DashboardStats);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Dashboard...</div>;

    return (
        <div className="space-y-6">
            <header className="mb-8">
                <h1 className="text-3xl font-black text-[#1d1b20]">Command Center</h1>
                <p className="text-gray-500">System Overview</p>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard title="Total Users" value={stats?.totalUsers || 0} color="bg-blue-50 text-blue-700" icon={<UsersIcon />} />
                <KPICard title="Threats Blocked" value={stats?.threatsBlockedToday || 0} color="bg-green-50 text-green-700" icon={<ShieldIcon />} />
                <KPICard title="Active Alerts" value={stats?.activeThreats || 0} color="bg-red-50 text-red-700" icon={<AlertIcon />} />
                <KPICard title="System Health" value={stats?.systemHealth || '100%'} color="bg-purple-50 text-purple-700" icon={<PulseIcon />} />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-bold mb-4">Threat Distribution</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={[
                                        { name: 'Phishing', value: 400 },
                                        { name: 'SIM Swap', value: 300 },
                                        { name: 'Flagged Login', value: 100 },
                                        { name: 'Identity Mismatch', value: 200 }
                                    ]}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    <Cell fill="#ef4444" />
                                    <Cell fill="#f59e0b" />
                                    <Cell fill="#3b82f6" />
                                    <Cell fill="#8b5cf6" />
                                </Pie>
                                <Tooltip />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center gap-4 text-xs text-gray-500 mt-2">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-red-500 rounded-full"></div> Phishing</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> SIM Swap</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Logins</span>
                    </div>
                </div>

                <div className="bg-[#1d1b20] text-white p-6 rounded-[24px] shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                    <h3 className="text-lg font-bold mb-4 text-white">Live System Status</h3>
                    <ul className="space-y-4">
                        <SystemEvent time="Just now" text="Gateway 1 latency normal (12ms)" status="ok" />
                        <SystemEvent time="2m ago" text="AI Model Context Updated" status="ok" />
                        <SystemEvent time="15m ago" text="High traffic detected in APAC region" status="warn" />
                        <SystemEvent time="1h ago" text="Daily backup completed" status="ok" />
                    </ul>
                </div>
            </div>

            {/* SMS Simulation Panel */}
            <SimulateAlertPanel />
        </div>
    );
};

const SimulateAlertPanel: React.FC = () => {
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [quota, setQuota] = useState<number | null>(null);

    useEffect(() => {
        // Fetch quota on mount
        fetch(`${AdminAppService.API_URL}/sms/quota`)
            .then(res => res.json())
            .then(data => setQuota(data.remaining))
            .catch(() => setQuota(null));
    }, [result]); // Refresh when result changes (after a simulation)

    const handleSimulate = async () => {
        // If empty, we allow it for auto-targeting
        setLoading(true);
        setResult(null);
        try {
            const res = await AdminAppService.simulateAlert(phone); // Empty phone = auto-target
            setResult(res);
        } catch (err) {
            setResult({ success: false, error: String(err) });
        }
        setLoading(false);
    };

    return (
        <div className="bg-gradient-to-br from-[#1d1b20] to-[#2d2b30] text-white p-6 rounded-[24px] shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-500/20 p-2 rounded-xl">
                    <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <div>
                    <h3 className="text-lg font-bold">Simulate Fraud Alert</h3>
                    <div className="text-xs text-gray-400 flex gap-2">
                        <span>Triggers SIM swap + transaction + SMS alert</span>
                        {quota !== null && (
                            <span className={quota > 0 ? 'text-green-400' : 'text-red-400'}>
                                • SMS Quota: {quota}/3 left
                            </span>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mb-4">
                <input
                    type="tel"
                    placeholder="Auto-target latest registered user (or enter phone)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    className="flex-1 bg-white/10 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-red-400/50 focus:ring-1 focus:ring-red-400/30"
                    maxLength={10}
                />
                <button
                    onClick={handleSimulate}
                    disabled={loading || (quota === 0 && phone !== 'mock')}
                    className={`px-6 py-3 rounded-xl font-bold text-sm transition-all ${loading || quota === 0
                        ? 'bg-gray-600 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 active:scale-95 shadow-lg shadow-red-500/30'
                        }`}
                >
                    {loading ? '⏳ Running...' : quota === 0 ? '⛔ Quota limit' : '🚨 Trigger'}
                </button>
            </div>

            {result && (
                <div className={`p-3 rounded-xl text-sm ${result.success ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                    {result.success ? (
                        <div>
                            <div className="font-bold mb-1">✅ Simulation Complete</div>
                            <div className="text-xs opacity-80">{result.steps?.join(' → ')}</div>
                        </div>
                    ) : (
                        <div>❌ {result.error || 'Simulation failed'}</div>
                    )}
                </div>
            )}
        </div>
    );
};

const KPICard = ({ title, value, color, icon }: any) => (
    <div className={`p-6 rounded-[24px] ${color} flex flex-col justify-between h-32`}>
        <div className="flex justify-between items-start">
            <span className="text-sm font-bold opacity-70">{title}</span>
            {icon}
        </div>
        <span className="text-3xl font-black">{value}</span>
    </div>
);

const SystemEvent = ({ time, text, status }: any) => (
    <li className="flex gap-3 text-sm opacity-90">
        <span className="font-mono text-xs opacity-50 pt-1">{time}</span>
        <span className={status === 'warn' ? 'text-yellow-400' : 'text-green-400'}>{status === 'warn' ? '⚠' : '✓'}</span>
        <span>{text}</span>
    </li>
);

const UsersIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>;
const ShieldIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;
const AlertIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
const PulseIcon = () => <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
