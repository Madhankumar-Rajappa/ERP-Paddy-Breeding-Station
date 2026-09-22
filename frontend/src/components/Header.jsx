import React from 'react';
import { Search, Compass, Bell, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Header({ activePlotCode = 'E4A' }) {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search plot, variety, or trial (e.g. E4A)..."
            className="pl-9 pr-4 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-full w-72 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
          />
        </div>
        <div className="hidden md:flex items-center space-x-2 text-xs text-slate-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-medium text-emerald-900">Paddy Station Zone A</span>
          <span className="text-emerald-400">•</span>
          <span className="font-bold text-emerald-700">Plot E4A Selected</span>
        </div>
      </div>

      {/* Right Header Status Pill & Notifications */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
          <Compass className="w-4 h-4 text-emerald-600" />
          <div className="text-right leading-tight">
            <span className="text-[10px] uppercase text-slate-400 font-bold block">Field Note Mesh</span>
            <span className="text-xs font-mono font-bold text-slate-700">N:36m | E:30m | W:31.2m | S:34.8m</span>
          </div>
        </div>

        <button className="relative p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
      </div>
    </header>
  );
}
