import React from 'react';
import FounderBadgeAnimated from './FounderBadgeAnimated';

export default function ChatMessage({ message, sender }: { message: string; sender: any }) {
  const isFounder = sender?.role === 'founder';
  return (
    <div className={`p-3 rounded-lg mb-3 ${isFounder ? 'founder-glow' : 'bg-gray-800'} ${isFounder ? 'border-2 border-transparent founder-border-gradient' : ''}`}>
      <div className="flex items-center">
        <img src={sender?.avatar_url || '/default-avatar.png'} alt={sender?.nick} className={`h-10 w-10 rounded-full ${isFounder ? 'ring-2 ring-yellow-400' : ''}`} />
        <div className="ml-3">
          <div className="flex items-center">
            <div className={`text-sm font-semibold ${isFounder ? 'text-yellow-200' : 'text-white'}`}>{sender?.nick}</div>
            {isFounder && <FounderBadgeAnimated nick={sender.nick} />}
          </div>
          <div className="text-xs text-gray-400">{new Date().toLocaleString()}</div>
        </div>
      </div>
      <div className="mt-3 text-white">{message}</div>
    </div>
  );
}
