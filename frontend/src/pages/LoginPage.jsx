import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sprout, ShieldCheck, UserCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('researcher');
  const [password, setPassword] = useState('researcher123');
  const [errorMsg, setErrorMsg] = useState('');

  const handleQuickSelect = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const res = await login(username, password);
    if (!res.success) {
      setErrorMsg(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Graphic Accents */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-900/20 rounded-full blur-3xl"></div>

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-8 relative z-10 backdrop-blur-xl">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-900/50">
            <Sprout className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-wide">Paddy Breeding Station</h1>
          <p className="text-xs text-slate-400">GIS + ERP Trial Planning & Management System</p>
        </div>

        {/* Demo Seed Credentials Selector Pills */}
        <div className="mb-6 p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
            Click to Select Demo Role Credential:
          </span>
          <div className="grid grid-cols-3 gap-2 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleQuickSelect('admin', 'admin123')}
              className={`p-2 rounded-lg border text-center transition ${
                username === 'admin'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <div className="font-bold">Admin</div>
              <div className="text-[10px] opacity-80">admin123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('researcher', 'researcher123')}
              className={`p-2 rounded-lg border text-center transition ${
                username === 'researcher'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <div className="font-bold">Researcher</div>
              <div className="text-[10px] opacity-80">researcher123</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSelect('fieldstaff', 'field123')}
              className={`p-2 rounded-lg border text-center transition ${
                username === 'fieldstaff'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <div className="font-bold">Field Staff</div>
              <div className="text-[10px] opacity-80">field123</div>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800 text-rose-300 rounded-lg text-xs">
            {errorMsg}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Username</label>
            <div className="relative">
              <UserCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Password</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-emerald-950 disabled:opacity-50 mt-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Station Portal'}
          </button>
        </form>
      </div>
    </div>
  );
}
