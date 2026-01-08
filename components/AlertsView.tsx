
import React from 'react';
import { SMSAlert, RiskLevel } from '../types';

interface Props {
  alerts: SMSAlert[];
}

export const AlertsView: React.FC<Props> = ({ alerts }) => {
  return (
    <div className="p-6 space-y-6 pb-24">
      <header>
        <h1 className="text-3xl font-medium text-gray-900">Flagged Items</h1>
        <p className="text-gray-500">Messages blocked or flagged by AI</p>
      </header>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="bg-gray-100 p-8 rounded-full mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-900">No threats detected</h3>
          <p className="text-gray-500 max-w-xs mx-auto mt-2">
            SecureSIM hasn't found any suspicious SMS traffic lately.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <div key={alert.id} className="bg-white rounded-[28px] border border-gray-100 shadow-sm overflow-hidden">
              <div className={`h-1.5 w-full ${
                alert.riskLevel === RiskLevel.CRITICAL ? 'bg-red-600' : 
                alert.riskLevel === RiskLevel.HIGH ? 'bg-orange-500' : 'bg-yellow-400'
              }`} />
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="font-medium text-gray-900 text-lg">{alert.sender}</div>
                  <span className="text-xs text-gray-400">{alert.timestamp}</span>
                </div>
                <div className="bg-gray-50 p-4 rounded-2xl mb-4 italic text-gray-700 text-sm border-l-4 border-gray-200">
                  "{alert.originalText}"
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase ${
                      alert.riskLevel === RiskLevel.CRITICAL ? 'bg-red-100 text-red-700' : 
                      alert.riskLevel === RiskLevel.HIGH ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {alert.riskLevel} RISK
                    </span>
                    <span className="text-sm font-medium text-gray-900">Analysis</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {alert.reasoning}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
