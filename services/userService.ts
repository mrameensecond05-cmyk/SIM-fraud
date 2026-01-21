import { SMSAlert } from '../types';

const API_URL = '/api';

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

    // Simulate sending an SMS to the backend for analysis
    analyzeSms: async (smsText: string, deviceContext: any) => {
        try {
            const res = await fetch(`${API_URL}/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ smsText, deviceContext, userId: 1 }) // Default ID 1
            });
            if (!res.ok) throw new Error('Analysis failed');
            return await res.json();
        } catch (error) {
            console.error("UserService analyzeSms error:", error);
            throw error;
        }
    }
};
