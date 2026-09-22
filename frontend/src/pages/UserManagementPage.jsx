import React, { useState, useEffect } from 'react';
import { Users, Shield } from 'lucide-react';
import api from '../services/api';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600" /> Station User & Role Management
        </h1>
        <p className="text-xs text-slate-500">
          User accounts and role-based access control (Administrator, Researcher, Field Staff).
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden text-xs">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase">
            <tr>
              <th className="p-3">User ID</th>
              <th className="p-3">Username</th>
              <th className="p-3">Full Name</th>
              <th className="p-3">Email Address</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="p-3 font-mono">{u.id}</td>
                <td className="p-3 font-bold text-slate-900">{u.username}</td>
                <td className="p-3">{u.full_name}</td>
                <td className="p-3 text-slate-500">{u.email}</td>
                <td className="p-3 font-bold text-emerald-800">{u.role}</td>
                <td className="p-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
