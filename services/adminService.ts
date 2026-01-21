import { Capacitor } from '@capacitor/core';
import { AdminUser, AdminIncident, SMSAlert } from '../types';

// IMPORTANT: For Android, you MUST replace 'YOUR_SERVER_IP' with your actual computer/server IP address (e.g., 'http://192.168.1.50:5000/api')
// 'localhost' will NOT work on the Android device/emulator.
const SERVER_IP = 'http://192.168.1.10:5000'; // <--- CHANGE THIS TO YOUR LOCAL IP
const API_URL = Capacitor.getPlatform() === 'web' ? '/api' : `${SERVER_IP}/api`;

export const AdminAppService = {
    getUsers: async (): Promise<AdminUser[]> => {
        try {
            const res = await fetch(`${API_URL}/users`);
            if (!res.ok) throw new Error('Failed to fetch users');
            return await res.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },
    getIncidents: async (): Promise<AdminIncident[]> => {
        try {
            const res = await fetch(`${API_URL}/incidents`);
            if (!res.ok) throw new Error('Failed to fetch incidents');
            return await res.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },
    getAlerts: async (): Promise<SMSAlert[]> => {
        try {
            const res = await fetch(`${API_URL}/alerts`);
            if (!res.ok) throw new Error('Failed to fetch alerts');
            return await res.json();
        } catch (error) {
            console.error(error);
            return [];
        }
    },
    getStats: async () => {
        try {
            const res = await fetch(`${API_URL}/stats`);
            if (!res.ok) throw new Error('Failed to fetch stats');
            return await res.json();
        } catch (error) {
            console.error(error);
            return {
                totalUsers: 0,
                activeThreats: 0,
                threatsBlockedToday: 0,
                systemHealth: 'Error'
            };
        }
    }
};
