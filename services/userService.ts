import { SMSAlert } from '../types';
import { Capacitor } from '@capacitor/core';

// ---------------------------------------------------------------------------
// 🔧 PRODUCTION CONFIGURATION
// ---------------------------------------------------------------------------
// For Android/iOS: Replace with your LIVE SERVER IP or Domain (e.g., 'https://api.myapp.com')
// For Web: It uses relative paths ('/api') automatically via Nginx/Proxy.
export const SERVER_IP = 'http://192.168.1.13:5000';
// ---------------------------------------------------------------------------

export const API_URL = Capacitor.getPlatform() === 'web' ? '/api' : `${SERVER_IP}/api`;

export const UserService = {
    // Auth - Login
    login: async (credentials: any) => {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Login failed');
            }
            return await res.json();
        } catch (error: any) {
            console.error("Login incorrect:", error);
            throw new Error(error.message || 'Login failed');
        }
    },

    // Auth - Register
    register: async (userData: any) => {
        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Registration failed');
            }
            return await res.json();
        } catch (error: any) {
            console.error("Registration error:", error);
            throw new Error(error.message || 'Registration failed');
        }
    },

    // For now, users see the global feed or filtered by their ID if implemented.
    // Using global alerts endpoint for demonstration of connection.
    getAlerts: async (): Promise<SMSAlert[]> => {
        try {
            const res = await fetch(`${API_URL}/alerts`);
            if (!res.ok) throw new Error('Failed to fetch alerts');
            return await res.json();
        } catch (error) {
            console.error("UserService getAlerts error:", error);
            return [];
        }
    },

    // Send SMS to backend for analysis
    analyzeSms: async (data: { smsText: string, sender: string, timestamp: number, userId: string }) => {
        try {
            const res = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    smsText: data.smsText,
                    deviceContext: {
                        sender: data.sender,
                        timestamp: data.timestamp,
                        type: 'SMS_RECEIVED'
                    },
                    userId: data.userId
                })
            });
            if (!res.ok) throw new Error('Analysis failed');
            return await res.json();
        } catch (error) {
            console.error("UserService analyzeSms error:", error);
            throw error;
        }
    },

    // Register Device (SIM Context)
    registerDevice: async (data: { userId: string, imei: string }) => {
        try {
            const res = await fetch(`${API_URL}/user/device`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!res.ok) throw new Error('Device registration failed');
            return await res.json();
        } catch (error) {
            console.error("Device verification error:", error);
            // Non-blocking error, just warn
            return { success: false };
        }
    }
};
