
import React, { useState, useEffect } from 'react';
import { AppTab, SMSAlert, MonitoredNumber, AuthState } from './types';
import { Dashboard } from './components/Dashboard';
import { AlertsView } from './components/AlertsView';
import { ForensicsView } from './components/ForensicsView';
import { SettingsView } from './components/SettingsView';
import { PermissionDialog } from './components/PermissionDialog';
import { ProfileView } from './components/ProfileView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { UserManagementView } from './components/admin/UserManagementView';
import { IncidentLogView } from './components/admin/IncidentLogView';
import { GlobalAlertsView } from './components/admin/GlobalAlertsView';
import { UserService } from './services/userService';
import SIMSentinel from './src/plugins/SIMSentinel';

const INITIAL_SIMS: MonitoredNumber[] = [
  {
    id: 'primary',
    phoneNumber: '+91 98765 43210',
    isVerified: true,
    isAadhaarVerified: true,
    aadhaarLastFour: '4582',
    carrier: 'Airtel Digital',
    status: 'active',
    simType: 'PRIMARY'
  }
];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [showPermission, setShowPermission] = useState(true);
  const [alerts, setAlerts] = useState<SMSAlert[]>([]);

  // Use SIMSentinel plugin to check/request permissions on mount or when dialog is acted upon
  const handlePermissionGrant = async () => {
    try {
      const result = await SIMSentinel.requestPermissions();
      if (result.granted) {
        setShowPermission(false);
        // Fetch identifiers after permission grant
        try {
          const ids = await SIMSentinel.getIdentifiers();
          console.log("Device ID:", ids);
          // TODO: Store this ID or use it for registration if needed
        } catch (e) {
          console.warn("Could not get identifiers:", e);
        }
      } else {
        alert("Permissions are required for the app to function properly.");
      }
    } catch (error) {
      console.error("Permission request failed:", error);
      alert("Failed to request permissions. Please enable them in settings.");
    }
  };

  const handlePermissionDeny = () => {
    setShowPermission(false);
    // Optionally show a warning that features won't work
  };

  // 1. Setup SMS Listener
  useEffect(() => {
    let listener: any;
    const setupListener = async () => {
      listener = await SIMSentinel.addListener('smsReceived', async (sms) => {
        console.log("New SMS Received:", sms);

        // Only process if user is logged in
        if (auth.user) {
          // Send to backend for analysis
          try {
            const result = await UserService.analyzeSms({
              smsText: sms.message,
              sender: sms.sender,
              timestamp: sms.timestamp,
              userId: auth.user.id
            });

            // If high risk, maybe show a local alert immediately?
            if (result.analysis.risk_level === 'HIGH' || result.analysis.risk_level === 'CRITICAL') {
              alert(`WARNING: High Risk SMS Detected!\n${result.analysis.summary}`);
            }

            // Refresh alerts
            const newAlerts = await UserService.getAlerts();
            setAlerts(newAlerts);
          } catch (e) {
            console.error("Analysis Error:", e);
          }
        }
      });
    };
    setupListener();

    return () => {
      if (listener) listener.remove();
    };
  }, [auth.user]);

  // Fetch real alerts from backend
  useEffect(() => {
    UserService.getAlerts()
      .then(data => setAlerts(data))
      .catch(err => console.error("Failed to fetch alerts:", err));
  }, []);

  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    view: 'LOGIN',
    user: undefined
  });

  // 1. Setup SMS Listener
  useEffect(() => {
    let listener: any;
    const setupListener = async () => {
      try {
        listener = await SIMSentinel.addListener('smsReceived', async (sms: any) => {
          console.log("New SMS Received:", sms);

          // Only process if user is logged in
          if (auth.user) {
            // Send to backend for analysis
            try {
              const result = await UserService.analyzeSms({
                smsText: sms.message,
                sender: sms.sender,
                timestamp: sms.timestamp,
                userId: auth.user.id
              });

              // If high risk, maybe show a local alert immediately?
              if (result.analysis.risk_level === 'HIGH' || result.analysis.risk_level === 'CRITICAL') {
                alert(`WARNING: High Risk SMS Detected!\n${result.analysis.summary}`);
              }

              // Refresh alerts
              const newAlerts = await UserService.getAlerts();
              setAlerts(newAlerts);
            } catch (e) {
              console.error("Analysis Error:", e);
            }
          }
        });
      } catch (e) {
        console.error("Failed to setup listener:", e);
      }
    };
    setupListener();

    return () => {
      if (listener) listener.remove();
    };
  }, [auth.user]);

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      if (auth.view === 'LOGIN') {
        // Login Logic
        const data = await UserService.login({ email: formData.email, password: formData.password });
        if (data.success && data.user) {
          setAuth({
            isAuthenticated: true,
            view: 'LOGIN',
            user: {
              ...data.user,
              role: data.user.role || 'USER',
              // Add mock monitor numbers for now, in real app fetch these
              monitoredNumbers: INITIAL_SIMS
            }
          });
        }
      } else {
        // Register Logic
        if (!formData.name) throw new Error("Name is required");
        if (formData.password.length < 6) throw new Error("Password must be at least 6 characters");

        await UserService.register({
          name: formData.name,
          email: formData.email,
          password: formData.password
        });

        // Auto login or switch to login view
        alert("Registration Successful! Please login.");
        setAuth({ ...auth, view: 'LOGIN' });
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNumber = (newNumber: MonitoredNumber) => {
    if (auth.user) {
      setAuth({
        ...auth,
        user: {
          ...auth.user,
          monitoredNumbers: [...auth.user.monitoredNumbers, newNumber]
        }
      });
    }
  };

  if (!auth.isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f3edf7] flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500">
          <div className="text-center">
            <div className="w-20 h-20 bg-[#6750a4] rounded-[24px] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-200">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 00-2 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            <h1 className="text-4xl font-black text-[#1d1b20] tracking-tight">SIMtinel</h1>
            <p className="text-gray-500 mt-2 font-medium">Next-Gen Fraud Defense</p>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
            <div className="flex justify-center gap-8 mb-2">
              <button
                onClick={() => setAuth({ ...auth, view: 'LOGIN' })}
                className={`text-sm font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${auth.view === 'LOGIN' ? 'border-[#6750a4] text-[#1d1b20]' : 'border-transparent text-gray-400'}`}
              >
                Login
              </button>
              <button
                onClick={() => setAuth({ ...auth, view: 'REGISTER' })}
                className={`text-sm font-bold uppercase tracking-widest pb-2 border-b-2 transition-all ${auth.view === 'REGISTER' ? 'border-[#6750a4] text-[#1d1b20]' : 'border-transparent text-gray-400'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-100 text-red-700 rounded-xl text-sm font-medium text-center">
                  {errorMsg}
                </div>
              )}
              {auth.view === 'REGISTER' && (
                <input
                  type="text"
                  placeholder="Full Name"
                  required
                  className="w-full p-4 bg-gray-50 rounded-[20px] border-none outline-none focus:ring-2 focus:ring-[#6750a4]"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              )}
              <input
                type="email"
                placeholder="Email Address"
                required
                className="w-full p-4 bg-gray-50 rounded-[20px] border-none outline-none focus:ring-2 focus:ring-[#6750a4]"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
              <input
                type="password"
                placeholder="Password"
                required
                className="w-full p-4 bg-gray-50 rounded-[20px] border-none outline-none focus:ring-2 focus:ring-[#6750a4]"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
              <button className="w-full py-4 bg-[#6750a4] text-white rounded-full font-bold shadow-lg shadow-indigo-100 active:scale-95 transition-transform mt-4">
                {auth.view === 'LOGIN' ? 'Secure Login' : 'Create Account'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!auth.user) return null;

    if (auth.user.role === 'ADMIN') {
      switch (activeTab) {
        case 'dashboard': return <AdminDashboard />;
        case 'users': return <UserManagementView />;
        case 'alerts': return <GlobalAlertsView />;
        case 'incidents': return <IncidentLogView />;
        case 'profile': return (
          <ProfileView
            user={auth.user}
            onAddNumber={handleAddNumber}
            onLogout={() => setAuth({ isAuthenticated: false, view: 'LOGIN' })}
          />
        );
        default: return <AdminDashboard />;
      }
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'alerts': return <AlertsView alerts={alerts} />;
      case 'forensics': return <ForensicsView />;
      case 'settings': return <SettingsView />;
      case 'profile': return (
        <ProfileView
          user={auth.user}
          onAddNumber={handleAddNumber}
          onLogout={() => setAuth({ isAuthenticated: false, view: 'LOGIN' })}
        />
      );
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fc]">
      {showPermission && <PermissionDialog onGrant={handlePermissionGrant} onDeny={handlePermissionDeny} />}

      <main className="flex-1 overflow-y-auto">
        {renderContent()}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-[#f3edf7] border-t border-[#eaddff] flex items-center justify-around px-2 z-40">
        {auth.user?.role === 'ADMIN' ? (
          <>
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} label="Admin" icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" /></svg>} />
            <NavButton active={activeTab === 'users'} onClick={() => setActiveTab('users')} label="Users" icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>} />
            <NavButton active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} label="Feed" icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>} />
            <NavButton active={activeTab === 'incidents'} onClick={() => setActiveTab('incidents')} label="Logs" icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" /></svg>} />
            <NavButton active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Profile" icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>} />
          </>
        ) : (
          <>
            <NavButton
              active={activeTab === 'dashboard'}
              onClick={() => setActiveTab('dashboard')}
              label="Home"
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" /></svg>}
            />
            <NavButton
              active={activeTab === 'alerts'}
              onClick={() => setActiveTab('alerts')}
              label="Alerts"
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" /></svg>}
            />
            <NavButton
              active={activeTab === 'forensics'}
              onClick={() => setActiveTab('forensics')}
              label="SIM"
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-8L4 8v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-1 16H7v-2h10v2zm0-4H7v-2h10v2zm-4-4H7V8h6v2z" /></svg>}
            />
            <NavButton
              active={activeTab === 'profile'}
              onClick={() => setActiveTab('profile')}
              label="Profile"
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>}
            />
            <NavButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              label="Guard"
              icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4z" /></svg>}
            />
          </>
        )}
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
    <div className={`px-4 py-1 rounded-full transition-all duration-300 ${active ? 'bg-[#d3e3fd] text-[#041e49]' : 'text-[#49454f] group-active:bg-gray-200'}`}>
      {icon}
    </div>
    <span className={`text-[10px] font-bold transition-colors uppercase tracking-tight ${active ? 'text-[#1d1b20]' : 'text-[#49454f]'}`}>
      {label}
    </span>
  </button>
);

export default App;
