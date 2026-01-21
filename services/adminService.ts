import { Capacitor } from '@capacitor/core';
import { AdminUser, AdminIncident, SMSAlert } from '../types';
import { API_URL } from './userService'; // Import shared config

// Local config removed. Uses centralized API_URL from userService.ts.

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
