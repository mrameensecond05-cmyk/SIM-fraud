
import React, { useState } from 'react';
import { MonitoredNumber, SIMType } from '../types';
import * as aadhaarService from '../services/aadhaarService';

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
  const [step, setStep] = useState(1); // 1: Mobile, 2: Aadhaar, 3: OTP
  const [formData, setFormData] = useState({ phone: '', aadhaar: '', otp: '' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [simType, setSimType] = useState<SIMType>('SECONDARY');

  const handleMobileSubmit = async () => {
    setIsProcessing(true);
    const ownership = await aadhaarService.verifyMobileOwnership(formData.phone, "");
    setSimType(ownership.suggestedType as SIMType);
    setIsProcessing(false);
    setStep(2);
  };

  const handleAadhaarSubmit = async () => {
    setIsProcessing(true);
    await aadhaarService.requestAadhaarOTP(formData.aadhaar);
    setIsProcessing(false);
    setStep(3);
  };

  const handleOTPSubmit = async () => {
    setIsProcessing(true);
    const isValid = await aadhaarService.validateOTP(formData.otp);
    
    if (isValid) {
      const newSIM: MonitoredNumber = {
        id: Math.random().toString(36).substr(2, 9),
        phoneNumber: formData.phone,
        isVerified: true,
        isAadhaarVerified: true,
        aadhaarLastFour: formData.aadhaar.slice(-4),
        carrier: "Telecom-India-v4",
        status: 'active',
        simType: simType
      };
      
      onAddNumber(newSIM);
      resetFlow();
    } else {
      alert("Invalid OTP. Try 123456 for demo.");
      setIsProcessing(false);
    }
  };

  const resetFlow = () => {
    setIsProcessing(false);
    setIsAdding(false);
    setStep(1);
    setFormData({ phone: '', aadhaar: '', otp: '' });
  };

  return (
    <div className="p-6 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <h1 className="text-3xl font-medium text-gray-900">Account</h1>
        <button onClick={onLogout} className="text-red-600 font-bold text-sm bg-red-50 px-4 py-1.5 rounded-full">Logout</button>
      </header>

      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="w-16 h-16 bg-[#6750a4] text-white flex items-center justify-center text-2xl font-bold rounded-2xl shadow-inner">
          {user.name.charAt(0)}
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
          <p className="text-gray-500 text-sm">{user.email}</p>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-lg font-medium text-gray-800">Linked SIM Cards</h3>
          <button 
            onClick={() => setIsAdding(true)}
            className="text-[#6750a4] text-sm font-bold bg-[#e7e0ff] px-5 py-2 rounded-full active:scale-95 transition-transform"
          >
            + Add New
          </button>
        </div>

        <div className="space-y-3">
          {user.monitoredNumbers.map((sim) => (
            <div key={sim.id} className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${sim.simType === 'PRIMARY' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <div className="font-bold text-gray-900 text-lg">{sim.phoneNumber}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${sim.simType === 'PRIMARY' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                      {sim.simType}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">UID: •••• {sim.aadhaarLastFour}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="flex items-center gap-1 text-green-600">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-bold uppercase tracking-tighter">Verified</span>
                </div>
                <span className="text-[10px] text-gray-400 mt-1">{sim.carrier}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 px-0 backdrop-blur-sm">
          <div className="bg-white rounded-t-[40px] w-full max-w-md p-8 animate-in slide-in-from-bottom duration-300">
            <div className="w-16 h-1.5 bg-gray-200 rounded-full mx-auto mb-8"></div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  {step === 1 ? "Add SIM" : step === 2 ? "Aadhaar Sync" : "Verify OTP"}
                </h2>
                <div className="flex gap-1">
                    {[1,2,3].map(i => (
                        <div key={i} className={`h-1.5 w-4 rounded-full ${i === step ? 'bg-[#6750a4]' : i < step ? 'bg-green-400' : 'bg-gray-100'}`} />
                    ))}
                </div>
              </div>

              {step === 1 && (
                <div className="space-y-4">
                  <p className="text-gray-500 text-sm">Enter the secondary mobile number. Our Genuineness Service will check its registration status.</p>
                  <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100 focus-within:ring-2 focus-within:ring-[#6750a4]">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Mobile Number</label>
                    <input 
                      type="tel" 
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full bg-transparent outline-none font-bold text-xl mt-1"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={!formData.phone || isProcessing}
                    onClick={handleMobileSubmit}
                    className="w-full py-4 bg-[#6750a4] text-white rounded-full font-bold shadow-lg disabled:opacity-50 active:scale-95 transition-transform flex justify-center"
                  >
                    {isProcessing ? "Checking Telco Registry..." : "Check Ownership"}
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className={`p-4 rounded-2xl border ${simType === 'PRIMARY' ? 'bg-blue-50 border-blue-100' : 'bg-orange-50 border-orange-100'}`}>
                    <p className={`text-xs font-bold ${simType === 'PRIMARY' ? 'text-blue-700' : 'text-orange-700'}`}>
                        {simType === 'PRIMARY' ? 'MATCH DETECTED' : 'ANOMALY DETECTED'}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                        {simType === 'PRIMARY' ? 'This number matches your master record.' : 'This number is not your primary MSISDN. Aadhaar OTP required to link as Secondary SIM.'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">12-Digit Aadhaar</label>
                    <input 
                      type="password" 
                      maxLength={12}
                      placeholder="XXXX XXXX XXXX"
                      className="w-full bg-transparent outline-none font-bold text-xl mt-1 tracking-[0.3em]"
                      value={formData.aadhaar}
                      onChange={(e) => setFormData({...formData, aadhaar: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={formData.aadhaar.length !== 12 || isProcessing}
                    onClick={handleAadhaarSubmit}
                    className="w-full py-4 bg-[#6750a4] text-white rounded-full font-bold shadow-lg disabled:opacity-50 flex justify-center"
                  >
                    {isProcessing ? "Requesting OTP..." : "Get Aadhaar OTP"}
                  </button>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-gray-500 text-sm">Enter the 6-digit code sent by UIDAI to your Aadhaar-linked phone.</p>
                  <div className="bg-gray-50 p-5 rounded-[24px] border border-gray-100">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Verification Code</label>
                    <input 
                      type="text" 
                      maxLength={6}
                      placeholder="XXXXXX"
                      className="w-full bg-transparent outline-none font-bold text-2xl mt-1 text-center tracking-[0.5em]"
                      value={formData.otp}
                      onChange={(e) => setFormData({...formData, otp: e.target.value})}
                    />
                  </div>
                  <button 
                    disabled={formData.otp.length !== 6 || isProcessing}
                    onClick={handleOTPSubmit}
                    className="w-full py-4 bg-green-600 text-white rounded-full font-bold shadow-lg disabled:opacity-50 flex justify-center"
                  >
                    {isProcessing ? "Verifying..." : "Confirm & Secure"}
                  </button>
                </div>
              )}

              <button onClick={resetFlow} className="w-full py-2 text-gray-400 font-medium text-sm">Dismiss</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
