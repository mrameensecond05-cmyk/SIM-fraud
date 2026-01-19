import React, { useEffect, useState } from 'react';
import { AdminAppService } from '../../services/adminService';
import { AdminIncident, RiskLevel } from '../../types';

export const IncidentLogView: React.FC = () => {
    const [incidents, setIncidents] = useState<AdminIncident[]>([]);

    useEffect(() => {
        AdminAppService.getIncidents().then(setIncidents);
    }, []);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#1d1b20]">Incident Log</h2>
                    <p className="text-gray-500">Live feed of blocked threats and flagged activities</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 font-medium">Filter</button>
                    <button className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium">Export Report</button>
                </div>
            </header>

            <div className="space-y-4">
                {incidents.map(incident => (
                    <div key={incident.id} className="bg-white p-6 rounded-[24px] border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex items-start gap-4">
                        <div className={`mt-1 p-2 rounded-xl ${getSeverityBg(incident.severity)}`}>
                            {getSeverityIcon(incident.severity)}
                        </div>
                        <div className="flex-1">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-[#1d1b20]">{incident.type.replace(/_/g, ' ')}</h3>
                                <span className="text-xs text-gray-400 font-mono">{incident.timestamp}</span>
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{incident.details}</p>
                            <div className="flex items-center gap-4 text-xs">
                                <div className="flex items-center gap-1 text-gray-500">
                                    <UserIcon />
                                    <span className="font-medium">{incident.userName}</span>
                                </div>
                                <div className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-mono">ID: {incident.userId}</div>
                                <span className={`px-2 py-0.5 rounded-full font-bold ${incident.status === 'RESOLVED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {incident.status}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const getSeverityBg = (level: RiskLevel) => {
    switch (level) {
        case RiskLevel.CRITICAL: return 'bg-red-100 text-red-600';
        case RiskLevel.HIGH: return 'bg-orange-100 text-orange-600';
        case RiskLevel.MEDIUM: return 'bg-blue-100 text-blue-600';
        default: return 'bg-gray-100 text-gray-600';
    }
};

const getSeverityIcon = (level: RiskLevel) => {
    if (level === RiskLevel.CRITICAL) return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
    return <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
};

const UserIcon = () => <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;
