
import React, { useState, useEffect } from 'react';
import { AppTab, AuthState, SMSAlert, RiskLevel } from './types';
import { Dashboard } from './components/Dashboard';
import { AlertsView } from './components/AlertsView';
import { ForensicsView } from './components/ForensicsView';
import { SettingsView } from './components/SettingsView';
import { PermissionDialog } from './components/PermissionDialog';

const INITIAL_ALERTS: SMSAlert[] = [
  {
    id: '1',
    sender: '+1 (800) 999-0123',
    timestamp: 'Today, 2:45 PM',
    originalText: 'SECURE-BANK: We detected a login attempt from London, UK. If this was not you, click here to secure your account: http://bank-secure-v2.net/verify',
    riskScore: 92,
    riskLevel: RiskLevel.CRITICAL,
    reasoning: 'AI detected a phishing URL pattern combined with urgent language designed to trigger panic. Domain "bank-secure-v2.net" is blacklisted.'
  },
  {
    id: '2',
    sender: 'CHASE-ALERT',
    timestamp: 'Today, 11:10 AM',
    originalText: 'Transfer of $1,250.00 to ZELLE-USER-XY2 confirmed. Msg 2 to cancel.',
    riskScore: 78,
    riskLevel: RiskLevel.HIGH,
    reasoning: 'Significant outgoing transaction detected shortly after a reported system configuration change. High value exceeds user preference.'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [showPermission, setShowPermission] = useState(true);
  const [alerts, setAlerts] = useState<SMSAlert[]>(INITIAL_ALERTS);
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: true,
    user: { name: 'John Doe', email: 'j.doe@example.com' }
  });

  const handleGrantPermission = () => {
    setShowPermission(false);
    // In a real app, this would trigger navigator.permissions or specific android bridge calls
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'alerts': return <AlertsView alerts={alerts} />;
      case 'forensics': return <ForensicsView />;
      case 'settings': return <SettingsView />;
      case 'profile': return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-medium">Profile</h1>
            <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm text-center">
                <div className="w-24 h-24 bg-[#6750a4] text-white flex items-center justify-center text-4xl font-bold rounded-full mx-auto mb-4">JD</div>
                <h2 className="text-xl font-medium">{authState.user?.name}</h2>
                <p className="text-gray-500">{authState.user?.email}</p>
                <div className="mt-8 pt-8 border-t border-gray-50 flex flex-col gap-3">
                    <button className="w-full py-3 bg-[#f3edf7] text-[#6750a4] rounded-full font-medium">Edit Profile</button>
                    <button onClick={() => setAuthState({ isAuthenticated: false })} className="w-full py-3 text-red-600 font-medium">Log Out</button>
                </div>
            </div>
        </div>
      );
      default: return <Dashboard />;
    }
  };

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f3edf7] flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-[#6750a4] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
            </div>
            <h1 className="text-3xl font-bold text-[#1d1b20]">SecureSIM AI</h1>
            <p className="text-gray-600 mt-2">Enterprise Fraud Prevention</p>
          </div>
          <div className="bg-white p-8 rounded-[32px] shadow-sm space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              className="w-full p-4 bg-[#f3edf7] rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#6750a4]" 
            />
            <input 
              type="password" 
              placeholder="Password" 
              className="w-full p-4 bg-[#f3edf7] rounded-2xl border-none outline-none focus:ring-2 focus:ring-[#6750a4]" 
            />
            <button 
              onClick={() => setAuthState({ isAuthenticated: true, user: { name: 'John Doe', email: 'j.doe@example.com' } })}
              className="w-full py-4 bg-[#6750a4] text-white rounded-full font-bold shadow-md active:scale-95 transition-transform"
            >
              Sign In
            </button>
            <p className="text-center text-sm text-gray-500">New here? <span className="text-[#6750a4] font-bold cursor-pointer">Create account</span></p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fc]">
      {showPermission && <PermissionDialog onGrant={handleGrantPermission} onDeny={() => setShowPermission(false)} />}
      
      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Android Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#f3edf7] border-t border-[#eaddff] flex items-center justify-around px-4 z-40">
        <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            label="Home"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>}
        />
        <NavButton 
            active={activeTab === 'alerts'} 
            onClick={() => setActiveTab('alerts')} 
            label="Alerts"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>}
        />
        <NavButton 
            active={activeTab === 'forensics'} 
            onClick={() => setActiveTab('forensics')} 
            label="SIM"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-8L4 8v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 16H7v-2h10v2zm0-4H7v-2h10v2zm-4-4H7V8h6v2z"/></svg>}
        />
        <NavButton 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
            label="Guard"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z"/></svg>}
        />
        <NavButton 
            active={activeTab === 'profile'} 
            onClick={() => setActiveTab('profile')} 
            label="User"
            icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
        />
      </nav>
    </div>
  );
};

interface NavBtnProps {
    active: boolean;
    onClick: () => void;
    label: string;
    icon: React.ReactNode;
}

const NavButton: React.FC<NavBtnProps> = ({ active, onClick, label, icon }) => (
    <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 group">
        <div className={`px-5 py-1 rounded-full transition-all duration-300 ${active ? 'bg-[#d3e3fd] text-[#041e49]' : 'text-[#49454f] group-active:bg-gray-200'}`}>
            {icon}
        </div>
        <span className={`text-xs font-medium transition-colors ${active ? 'text-[#1d1b20]' : 'text-[#49454f]'}`}>
            {label}
        </span>
    </button>
);

export default App;
