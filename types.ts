
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export type SIMType = 'PRIMARY' | 'SECONDARY';

export interface MonitoredNumber {
  id: string;
  phoneNumber: string;
  isVerified: boolean;
  isAadhaarVerified: boolean;
  aadhaarLastFour: string;
  carrier: string;
  status: 'active' | 'pending' | 'suspended';
  simType: SIMType;
}

export interface SMSAlert {
  id: string;
  sender: string;
  timestamp: string;
  originalText: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reasoning: string;
  isAadhaarVerified?: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  view: 'LOGIN' | 'REGISTER';
  user?: {
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
    monitoredNumbers: MonitoredNumber[];
  };
}

export type AppTab = 'dashboard' | 'alerts' | 'forensics' | 'settings' | 'profile';

export interface AdminIncident {
  id: string;
  userId: string;
  userName: string;
  type: 'PHISHING_STOPPED' | 'ACCOUNT_FLAGGED' | 'SUSPICIOUS_LOGIN' | 'SIM_SWAP_BLOCKED';
  severity: RiskLevel;
  timestamp: string;
  details: string;
  status: 'ACTIVE' | 'RESOLVED' | 'INVESTIGATING';
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'FLAGGED';
  riskScore: number;
  lastActive: string;
  devices: number;
  threatsBlocked: number;
}
