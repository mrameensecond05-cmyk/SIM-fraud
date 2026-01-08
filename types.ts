
export enum RiskLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface SMSAlert {
  id: string;
  sender: string;
  timestamp: string;
  originalText: string;
  riskScore: number;
  riskLevel: RiskLevel;
  reasoning: string;
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
  };
}

export type AppTab = 'dashboard' | 'alerts' | 'forensics' | 'settings' | 'profile';
