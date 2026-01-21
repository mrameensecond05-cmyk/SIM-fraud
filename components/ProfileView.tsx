
import React, { useState } from 'react';
import { MonitoredNumber, SIMType } from '../types';
import * as aadhaarService from '../services/aadhaarService';
import { API_URL } from '../services/userService'; // Import shared config

interface Props {
  user: {
    name: string;
    email: string;
    monitoredNumbers: MonitoredNumber[];
  };
  onAddNumber: (newNumber: MonitoredNumber) => void;
  onLogout: () => void;
}

export const ProfileView: React.FC<Props> = ({ user, onAddNumber, onLogout }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [step, setStep] = useState(1); // 1: Mobile, 2: OTP
  const [formData, setFormData] = useState({ phone: '', otp: '' });
  const [isProcessing, setIsProcessing] = useState(false);

  // Use local IP for Android compatibility as per UserService
  // const SERVER_IP = 'http://192.168.1.13:5000'; // Match UserService
  // const API_URL = `${SERVER_IP}/api`;

  const handleMobileSubmit = async () => {
    setIsProcessing(true);
    try {
      // Call Backend to Send OTP
      const res = await fetch(`${API_URL}/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone })
      });
      const data = await res.json();

      if (data.success) {
        setStep(2);
      } else {
        alert("Error sending OTP: " + data.error);
      }
    } catch (e) {
      alert("Failed to connect to server");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOTPSubmit = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`${API_URL}/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: formData.phone, otp: formData.otp })
      });
      const data = await res.json();

      if (data.success) {
        const newSIM: MonitoredNumber = {
          id: Math.random().toString(36).substr(2, 9),
          phoneNumber: formData.phone,
          isVerified: true,
          isAadhaarVerified: true, // Legacy flag, kept true for UI consistency
          aadhaarLastFour: 'XXXX', // No longer collecting this
          carrier: "Verified-Network",
          status: 'active',
          simType: 'SECONDARY'
        };

        onAddNumber(newSIM);
        resetFlow();
        alert("Phone Number Verified & Added Successfully!");
      } else {
        alert("Invalid OTP: " + data.error);
      }
    } catch (e) {
      alert("Verification failed");
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setIsProcessing(false);
    setIsAdding(false);
    setStep(1);
    setFormData({ phone: '', otp: '' });
  };

  return (
    <div className="p-6 space-y-8 pb-32 bg-[#f8f9fa]">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Profile</h1>
          <p className="text-gray-500 font-medium">Identity & SIM Management</p>
        </div>
        <button
          onClick={onLogout}
          className="p-3 text-red-500 bg-red-50 rounded-2xl active:scale-90 transition-transform"
          title="Sign Out"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
        </button>
      </header>

      {/* Identity Trust Card */}
      <div className="bg-[#1c1b1f] rounded-[32px] p-6 shadow-xl relative overflow-hidden text-white">
        <div className="absolute -right-8 -top-8 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
            {user.name.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold">{user.name}</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Master Identity Secured</span>
            </div>
          </div>
          <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md">
            <svg className="w-6 h-6 text-indigo-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
          <div>
            <div className="text-[9px] font-black text-gray-500 uppercase mb-1">Protection Level</div>
            <div className="text-sm font-bold">ENTREPRISE ELITE</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] font-black text-gray-500 uppercase mb-1">SIMs Linked</div>
            <div className="text-sm font-bold">{user.monitoredNumbers.length} Active</div>
          </div>
        </div>
      </div>

      {/* Linked SIM Cards Section */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <div>
            <h3 className="text-xl font-bold text-gray-800">Linked SIM Cards</h3>
            <p className="text-xs text-gray-400">Actively monitoring {user.monitoredNumbers.length} endpoints</p>
          </div>
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 bg-[#6750a4] text-white px-5 py-2.5 rounded-full text-xs font-bold active:scale-95 transition-transform shadow-lg shadow-indigo-100"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            ADD NEW
          </button>
        </div>

        <div className="space-y-4">
          {user.monitoredNumbers.map((sim) => (
            <div key={sim.id} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm transition-all hover:shadow-md">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl ${sim.simType === 'PRIMARY' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-black text-gray-900 text-lg leading-tight">{sim.phoneNumber}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${sim.simType === 'PRIMARY' ? 'bg-indigo-100 text-indigo-700' : 'bg-orange-100 text-orange-700'}`}>
                        {sim.simType}
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">Verified</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-green-50 px-3 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span className="text-[9px] font-black text-green-700 uppercase tracking-widest">Monitoring</span>
                </div>
              </div>

              {/* SIM Stats Grid */}
              <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-50">
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <div className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Protected Trans.</div>
                  <div className="text-sm font-bold text-gray-800">124</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-2xl">
                  <div className="text-[9px] font-black text-gray-400 uppercase mb-0.5">Carrier Integrity</div>
                  <div className="text-sm font-bold text-indigo-600">HIGH</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Add SIM Modal Flow */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm px-0">
          <div className="bg-white rounded-t-[44px] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-500 ease-out shadow-2xl">
            <div className="w-12 h-1.5 bg-gray-100 rounded-full mx-auto mb-8"></div>

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                    {step === 1 ? "Target SIM" : "Verify Ownership"}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium mt-0.5">Step {step} of 2 • OTP Verification</p>
                </div>
                <div className="flex gap-1">
                  {[1, 2].map(i => (
                    <div key={i} className={`h-1.5 w-6 rounded-full transition-all duration-300 ${i === step ? 'bg-[#6750a4] w-8' : i < step ? 'bg-green-400' : 'bg-gray-100'}`} />
                  ))}
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-gray-500 text-sm leading-relaxed">Enter the mobile number you wish to add. We will send a One-Time Password (OTP) to verify ownership.</p>
                  <div className="bg-gray-50 p-5 rounded-[28px] border-2 border-transparent focus-within:border-[#6750a4] transition-all group">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-focus-within:text-[#6750a4]">Mobile Number</label>
                    <input
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-transparent outline-none font-black text-2xl mt-2 tracking-tight"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <button
                    disabled={!formData.phone || isProcessing}
                    onClick={handleMobileSubmit}
                    className="w-full py-4 bg-[#6750a4] text-white rounded-full font-bold shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95 transition-transform flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Sending OTP...</span>
                      </>
                    ) : "Send OTP"}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  <p className="text-gray-500 text-sm leading-relaxed">Enter the 6-digit OTP code sent to {formData.phone}.</p>
                  <div className="bg-gray-50 p-6 rounded-[28px] border-2 border-transparent focus-within:border-green-500 transition-all">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center block mb-2">Verification Code</label>
                    <input
                      type="text"
                      maxLength={6}
                      placeholder="000000"
                      className="w-full bg-transparent outline-none font-black text-4xl text-center tracking-[0.6em] text-gray-900"
                      value={formData.otp}
                      onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                      autoFocus
                    />
                  </div>
                  <button
                    disabled={formData.otp.length !== 6 || isProcessing}
                    onClick={handleOTPSubmit}
                    className="w-full py-4 bg-green-600 text-white rounded-full font-bold shadow-xl shadow-green-100 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        <span>Verifying...</span>
                      </>
                    ) : "Verify & Add Number"}
                  </button>
                </div>
              )}

              <button
                onClick={resetFlow}
                className="w-full py-2 text-gray-400 font-bold text-xs uppercase tracking-widest active:opacity-50 transition-opacity"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
