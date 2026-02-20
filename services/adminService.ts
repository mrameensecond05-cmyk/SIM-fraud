import { Capacitor } from '@capacitor/core';
import { AdminUser, AdminIncident, SMSAlert } from '../types';
import { API_URL } from './userService'; // Import shared config

// Local config removed. Uses centralized API_URL from userService.ts.

export const AdminAppService = {
    API_URL: API_URL, // Expose for direct fetching if needed
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
    },
    simulateAlert: async (phone: string, userId?: number) => {
        try {
            const res = await fetch(`${API_URL}/simulate/alert`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone, userId })
            });
            if (!res.ok) throw new Error('Simulation failed');
            return await res.json();
        } catch (error) {
            console.error('Simulate Alert Error:', error);
            return { success: false, error: String(error) };
        }
    }
};
