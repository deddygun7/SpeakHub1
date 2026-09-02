import React from 'react';
import FounderBadge from './FounderBadge';

export default function ChatMessage({ message, sender }: { message: string; sender: any }) {
  const isFounder = sender?.role === 'founder';
  return (
    <div className={`p-3 rounded-lg mb-3 ${isFounder ? 'bg-gradient-to-r from-black via-yellow-900 to-orange-900 border border-yellow-600' : 'bg-gray-800'}`}>
      <div className="flex items-center">
        <img src={sender?.avatar_url || '/default-avatar.png'} alt={sender?.nick} className="h-10 w-10 rounded-full" />
        <div className="ml-3">
          <div className="flex items-center">
            <div className="text-sm font-semibold text-yellow-200">{sender?.nick}</div>
            {isFounder && <FounderBadge />}
          </div>
          <div className="text-xs text-gray-400">{new Date().toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-3 text-white">{message}</div>
    </div>
  );
}
