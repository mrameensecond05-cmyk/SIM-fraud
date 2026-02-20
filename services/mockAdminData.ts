import { AdminIncident, AdminUser, RiskLevel } from '../types';

const generateMockUsers = (): AdminUser[] => [
    {
        id: 'u-101',
        name: 'Alex Smith',
        email: 'alex.smith@example.com',
        status: 'ACTIVE',
        riskScore: 12,
        lastActive: 'Just now',
        devices: 2,
        threatsBlocked: 5
    },
    {
        id: 'u-102',
        name: 'Sarah Conner',
        email: 'sarah.c@sky.net',
        status: 'FLAGGED',
        riskScore: 85,
        lastActive: '2 hours ago',
        devices: 1,
        threatsBlocked: 14
    },
    {
        id: 'u-103',
        name: 'John Doe',
        email: 'j.doe@corp.org',
        status: 'SUSPENDED',
        riskScore: 92,
        lastActive: '1 day ago',
        devices: 3,
        threatsBlocked: 2
    },
    {
        id: 'u-104',
        name: 'Emily Chen',
        email: 'echen@uni.edu',
        status: 'ACTIVE',
        riskScore: 5,
        lastActive: '5 mins ago',
        devices: 1,
        threatsBlocked: 0
    },
    {
        id: 'u-105',
        name: 'Michael Brown',
        email: 'mbrown@tech.net',
        status: 'ACTIVE',
        riskScore: 28,
        lastActive: '12 mins ago',
        devices: 2,
        threatsBlocked: 3
    }
];

const generateMockIncidents = (): AdminIncident[] => [
    {
        id: 'inc-001',
        userId: 'u-102',
        userName: 'Sarah Conner',
        type: 'SIM_SWAP_BLOCKED',
        severity: RiskLevel.CRITICAL,
        timestamp: '10:42 AM',
        details: 'Unauthorized carrier port-out request detected and blocked.',
        status: 'INVESTIGATING'
    },
    {
        id: 'inc-002',
        userId: 'u-101',
        userName: 'Alex Smith',
        type: 'PHISHING_STOPPED',
        severity: RiskLevel.HIGH,
        timestamp: '09:15 AM',
        details: 'Malicious URL in SMS from "V-BANK" auto-quarantined.',
        status: 'RESOLVED'
    },
    {
        id: 'inc-003',
        userId: 'u-103',
        userName: 'John Doe',
        type: 'SUSPICIOUS_LOGIN',
        severity: RiskLevel.MEDIUM,
        timestamp: 'Yesterday',
        details: 'Login attempt from new device (Lagos, NG) flagged.',
        status: 'ACTIVE'
    },
    {
        id: 'inc-004',
        userId: 'u-102',
        userName: 'Sarah Conner',
        type: 'ACCOUNT_FLAGGED',
        severity: RiskLevel.CRITICAL,
        timestamp: 'Yesterday',
        details: 'Multiple high-risk transactions routed to unknown verified account.',
        status: 'ACTIVE'
    }
];

export const MockAdminService = {
    getUsers: async (): Promise<AdminUser[]> => {
        return new Promise(resolve => setTimeout(() => resolve(generateMockUsers()), 500));
    },
    getIncidents: async (): Promise<AdminIncident[]> => {
        return new Promise(resolve => setTimeout(() => resolve(generateMockIncidents()), 600));
    },
    getStats: async () => {
        return new Promise(resolve => setTimeout(() => resolve({
            totalUsers: 1420,
            activeThreats: 23,
            threatsBlockedToday: 145,
            systemHealth: '98%'
        }), 400));
    }
};
