import React, { useEffect, useState } from 'react';
import { AdminAppService } from '../../services/adminService';
import { AdminUser } from '../../types';

export const UserManagementView: React.FC = () => {
    const [users, setUsers] = useState<AdminUser[]>([]);

    useEffect(() => {
        AdminAppService.getUsers().then(setUsers);
    }, []);

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-[#1d1b20]">User Management</h2>
                    <p className="text-gray-500">View and audit registered accounts</p>
                </div>
                <button className="px-4 py-2 bg-[#1d1b20] text-white rounded-lg text-sm font-bold">Export CSV</button>
            </header>

            <div className="bg-white rounded-[24px] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase text-gray-400 font-bold tracking-wider">
                            <th className="p-6">User</th>
                            <th className="p-6">Status</th>
                            <th className="p-6">Risk Score</th>
                            <th className="p-6">Devices</th>
                            <th className="p-6">Threats Blocked</th>
                            <th className="p-6">Last Active</th>
                            <th className="p-6">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {users.map(user => (
                            <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="p-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-xs font-bold text-indigo-800">
                                            {user.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-[#1d1b20]">{user.name}</div>
                                            <div className="text-xs text-gray-500">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-6">
                                    <StatusBadge status={user.status} />
                                </td>
                                <td className="p-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-gray-100 h-2 rounded-full w-24 overflow-hidden">
                                            <div
                                                className={`h-full ${getRiskColor(user.riskScore)}`}
                                                style={{ width: `${user.riskScore}%` }}
                                            />
                                        </div>
                                        <span className="text-xs font-bold">{user.riskScore}</span>
                                    </div>
                                </td>
                                <td className="p-6 text-sm text-gray-600">{user.devices}</td>
                                <td className="p-6 text-sm text-gray-600">{user.threatsBlocked}</td>
                                <td className="p-6 text-xs text-gray-400 font-mono">{user.lastActive}</td>
                                <td className="p-6">
                                    <button className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">View</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatusBadge = ({ status }: { status: string }) => {
    const styles: any = {
        ACTIVE: 'bg-green-100 text-green-700',
        SUSPENDED: 'bg-red-100 text-red-700',
        FLAGGED: 'bg-yellow-100 text-yellow-700'
    };
    return (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}>
            {status}
        </span>
    );
};

const getRiskColor = (score: number) => {
    if (score > 80) return 'bg-red-500';
    if (score > 50) return 'bg-yellow-500';
    return 'bg-green-500';
};
