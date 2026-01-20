import { SMSAlert } from '../types';

const API_URL = 'http://localhost:5000/api';

export const UserService = {
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
