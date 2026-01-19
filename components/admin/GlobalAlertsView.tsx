import React, { useEffect, useState } from 'react';
import { AlertsView } from '../AlertsView';
import { SMSAlert } from '../../types';
import { AdminAppService } from '../../services/adminService';

export const GlobalAlertsView: React.FC = () => {
    const [alerts, setAlerts] = useState<SMSAlert[]>([]);

    useEffect(() => {
        AdminAppService.getAlerts().then(setAlerts);
    }, []);

    return (
        <div className="space-y-6">
            <header>
                <h2 className="text-2xl font-bold text-[#1d1b20]">Global Alert Feed</h2>
                <p className="text-gray-500">Real-time SMS interception stream from all monitored devices</p>
            </header>
            <AlertsView alerts={alerts} />
        </div>
    );
};
