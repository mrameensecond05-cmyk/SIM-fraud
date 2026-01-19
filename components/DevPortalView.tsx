
import React, { useState } from 'react';

type Platform = 'KOTLIN' | 'FLUTTER';

export const DevPortalView: React.FC = () => {
  const [targetPlatform, setTargetPlatform] = useState<Platform>('FLUTTER');

  return (
    <div className="p-6 space-y-8 pb-32 bg-[#f8f9fa]">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Migration Hub</h1>
          <p className="text-gray-500 font-medium">Flutter Architecture Guide</p>
        </div>
        <div className="flex bg-gray-200 p-1 rounded-xl">
          <button 
            onClick={() => setTargetPlatform('FLUTTER')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${targetPlatform === 'FLUTTER' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
          >
            FLUTTER
          </button>
          <button 
            onClick={() => setTargetPlatform('KOTLIN')}
            className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${targetPlatform === 'KOTLIN' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-500'}`}
          >
            KOTLIN
          </button>
        </div>
      </header>

      {/* Intro Card */}
      <div className={`p-6 rounded-[32px] shadow-xl text-white transition-colors duration-500 ${targetPlatform === 'FLUTTER' ? 'bg-[#02569B]' : 'bg-[#1c1b1f]'}`}>
        <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-2xl ${targetPlatform === 'FLUTTER' ? 'bg-white/20' : 'bg-purple-500/20'}`}>
                {targetPlatform === 'FLUTTER' ? (
                   <svg className="w-8 h-8 text-blue-200" fill="currentColor" viewBox="0 0 24 24"><path d="M14.33 10l-2.83 2.83L14.33 15.66 20 10l-5.67-5.67zM7 10l5.67-5.67L18.33 10l-5.66 5.66L7 10zm-2.33 0l5.66-5.67L16 10l-5.67 5.67L4.67 10z"/></svg>
                ) : (
                   <svg className="w-8 h-8 text-purple-400" fill="currentColor" viewBox="0 0 24 24"><path d="M1.5 1.5h21v21h-21zM12 4.5l-7.5 7.5 7.5 7.5 7.5-7.5z"/></svg>
                )}
            </div>
            <div>
                <h3 className="text-lg font-bold">{targetPlatform === 'FLUTTER' ? 'Web to Flutter (Dart)' : 'Web to Kotlin (Native)'}</h3>
                <p className="text-[11px] text-white/60 uppercase font-black tracking-widest">Architectural Mapping</p>
            </div>
        </div>
        <p className="text-sm text-white/80 leading-relaxed mb-4">
            {targetPlatform === 'FLUTTER' 
              ? "For the Dashboard graphs, use the 'fl_chart' package. For the Authentication UI, use 'TextFormField' with 'InputDecoration' for the Material 3 look."
              : "Transitioning to Kotlin allows for deep system integration, background SMS interception, and hardware-bound cryptography."
            }
        </p>
      </div>

      {/* Mapping Section */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 px-2">Flutter Widget Mapping</h3>
        <div className="grid grid-cols-1 gap-4">
            <MappingCard 
                title="Graphing Engine" 
                react="Recharts" 
                target="fl_chart package" 
                desc="Map the Risk Gauge to 'PieChart' and the history line to 'LineChart' with 'curved' properties."
            />
            <MappingCard 
                title="Bottom Navigation" 
                react="Custom React Nav" 
                target="NavigationBar (Material 3)" 
                desc="Use 'NavigationDestination' items inside a 'NavigationBar' for the native Android 14 feel."
            />
            <MappingCard 
                title="Identity Verification" 
                react="Aadhaar Modal Flow" 
                target="Step-driven PageView" 
                desc="Implement the 3-step process using a PageView controlled by an 'AnimateToPage' function."
            />
        </div>
      </section>

      {/* Dynamic Code Snippets */}
      <section className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 px-2">
          {targetPlatform === 'FLUTTER' ? 'Dart Dashboard Logic' : 'Kotlin Native Integration'}
        </h3>
        <div className="bg-[#2d2d2d] rounded-[28px] p-6 overflow-x-auto shadow-inner border border-gray-700">
            <pre className="text-xs font-mono text-gray-300 leading-relaxed">
{targetPlatform === 'FLUTTER' ? 
`// Flutter Chart Example
LineChart(
  LineChartData(
    lineBarsData: [
      LineChartBarData(
        isCurved: true,
        color: Theme.of(context).primaryColor,
        spots: [
          FlSpot(0, 94),
          FlSpot(1, 92),
          FlSpot(2, 98),
        ],
      ),
    ],
  ),
)` 
: 
`// Android Biometric Auth
val biometricPrompt = BiometricPrompt(activity, executor, callback)
val promptInfo = BiometricPrompt.PromptInfo.Builder()
    .setTitle("SIMtinel Hardware Lock")
    .setSubtitle("Confirm SIM Identity")
    .build()
biometricPrompt.authenticate(promptInfo)`}
            </pre>
        </div>
      </section>

      <div className={`p-6 border rounded-[28px] transition-colors ${targetPlatform === 'FLUTTER' ? 'bg-blue-50 border-blue-100 text-blue-800' : 'bg-purple-50 border-purple-100 text-purple-800'}`}>
        <h4 className="font-bold mb-2">Pro Tip: Local Storage</h4>
        <p className="text-xs leading-relaxed opacity-90">
            {targetPlatform === 'FLUTTER' 
              ? "In Flutter, use the 'hive' or 'sqflite' package to cache fraud logs locally. This ensures your Dashboard populates instantly even when the device is offline."
              : "Use the Android KeyStore system to securely store hashes of the IMSI/IMEI pairing."
            }
        </p>
      </div>
    </div>
  );
};

interface MappingCardProps {
    title: string;
    react: string;
    target: string;
    desc: string;
}

const MappingCard: React.FC<MappingCardProps> = ({ title, react, target, desc }) => (
    <div className="bg-white p-5 rounded-[28px] border border-gray-100 shadow-sm transition-all hover:border-blue-200">
        <div className="font-black text-[10px] text-blue-600 uppercase tracking-widest mb-3">{title}</div>
        <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-bold text-gray-400">{react}</div>
            <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M13 5l7 7-7 7M5 5l7 7-7 7"/></svg>
            <div className="text-sm font-black text-gray-900">{target}</div>
        </div>
        <p className="text-[11px] text-gray-500 mt-2 font-medium">{desc}</p>
    </div>
);
