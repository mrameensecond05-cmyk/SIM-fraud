
import React from 'react';

interface Props {
  onGrant: () => void;
  onDeny: () => void;
}

export const PermissionDialog: React.FC<Props> = ({ onGrant, onDeny }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="bg-white rounded-[28px] w-full max-w-sm p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex justify-center mb-6">
          <div className="bg-[#e7e0ff] p-4 rounded-2xl">
            <svg className="w-8 h-8 text-[#6750a4]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-medium text-center text-gray-900 mb-4">
          Allow SecureSIM to read your messages?
        </h2>
        <p className="text-[#49454f] text-center mb-8 leading-relaxed">
          SecureSIM AI needs to monitor SMS traffic locally to detect fraud. Messages are never stored or shared with our servers.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onGrant}
            className="w-full bg-[#6750a4] text-white py-3.5 rounded-full font-medium transition-transform active:scale-95"
          >
            Allow access
          </button>
          <button
            onClick={onDeny}
            className="w-full text-[#6750a4] py-3.5 rounded-full font-medium transition-transform active:scale-95"
          >
            Don't allow
          </button>
        </div>
      </div>
    </div>
  );
};
