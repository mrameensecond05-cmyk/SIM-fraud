
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
  isAadhaarVerified?: boolean; // Influence of Aadhaar status on the alert
}

export interface UserDeviceProfile {
  imsi: string;
  imei: string;
  lastSimSwap: string;
  carrier: string;
  phoneNumber: string;
  isRegistered: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user?: {
    name: string;
    email: string;
    monitoredNumbers: MonitoredNumber[];
  };
}

export type AppTab = 'dashboard' | 'alerts' | 'forensics' | 'settings' | 'profile';
