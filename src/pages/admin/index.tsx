import React, { useEffect, useState } from 'react';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users').then(r => r.json()).then(data => {
      if (data.error) setError(data.error);
      else setUsers(data.users || []);
    }).catch(err => setError(String(err)));
  }, []);

  if (error) return <div className="p-6">Error: {error}</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Founder Panel</h1>
      <p className="mb-4 text-sm text-gray-300">Only the founder can access this page.</p>
      <div className="space-y-3">
        {users.map(u => (
          <div key={u.id} className="p-3 bg-gray-900 rounded-md flex items-center justify-between">
            <div>
              <div className="font-semibold text-yellow-200">{u.nick}</div>
              <div className="text-xs text-gray-400">role: {u.role}</div>
            </div>
            <div className="flex gap-2">
              {/* Placeholder actions: promote/demote/pin/ban could be added */}
              <button className="px-3 py-1 bg-yellow-500 text-black rounded">Promote</button>
              <button className="px-3 py-1 bg-gray-700 text-white rounded">Demote</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
