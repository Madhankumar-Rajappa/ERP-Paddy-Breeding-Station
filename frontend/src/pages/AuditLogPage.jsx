import React, { useState, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';
import api from '../services/api';

export default function AuditLogPage() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await api.get('/audit');
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" /> System Audit Trail Log
        </h1>
        <p className="text-xs text-slate-500">
          Full audit trail recording trial creation, layout saving, planting status transitions, observations, and harvest entries.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">User</th>
              <th className="p-3">Action</th>
              <th className="p-3">Entity</th>
              <th className="p-3">Details / Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {logs.map((l) => (
              <tr key={l.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono text-slate-500">{l.timestamp}</td>
                <td className="p-3 font-bold text-slate-900">{l.user_name}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold font-mono text-[10px]">
                    {l.action}
                  </span>
                </td>
                <td className="p-3 text-slate-600">{l.entity} (ID: {l.entity_id || '-'})</td>
                <td className="p-3 font-mono text-slate-500 max-w-xs truncate">{l.new_value || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
