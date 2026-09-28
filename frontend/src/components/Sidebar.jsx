import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Map, Grid, Sprout, TestTube2, 
  Ruler, History, CalendarCheck2, ClipboardList, Wheat, 
  FileText, ShieldCheck, Users, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const navSections = [
    {
      title: 'Station & GIS',
      items: [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { label: 'GIS Field Map', path: '/gis', icon: Map },
        { label: 'Plot Management', path: '/plots', icon: Grid },
      ]
    },
    {
      title: 'Breeding & Trials',
      items: [
        { label: 'Variety Master', path: '/varieties', icon: Sprout },
        { label: 'Trial Management', path: '/trials', icon: TestTube2 },
        { label: 'Plot Designer', path: '/designer', icon: Ruler },
        { label: 'Layout History', path: '/layout-history', icon: History },
      ]
    },
    {
      title: 'Field Operations',
      items: [
        { label: 'Planting Management', path: '/planting', icon: CalendarCheck2 },
        { label: 'Field Observations', path: '/observations', icon: ClipboardList },
        { label: 'Harvest Management', path: '/harvest', icon: Wheat },
      ]
    },
    {
      title: 'Reports & Admin',
      items: [
        { label: 'Reports & Export', path: '/reports', icon: FileText },
        { label: 'Audit Trail', path: '/audit', icon: ShieldCheck },
        { label: 'User Management', path: '/users', icon: Users },
      ]
    }
  ];

  const userRole = user?.role || 'Field Staff';

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 shadow-xl z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950">
        <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md">
          <Sprout className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-emerald-400 uppercase">Paddy ERP + GIS</h1>
          <p className="text-xs text-slate-400">Breeding Station</p>
        </div>
      </div>

      {/* Active Station & Field Status Badge */}
      <NavLink
        to="/gis"
        className="mx-3 my-2.5 p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-700/60 flex items-center justify-between hover:border-emerald-500 transition group"
      >
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <div>
            <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">Station PBS-CBE</p>
            <p className="text-xs font-bold text-white group-hover:text-emerald-300">TNAU Coimbatore • 5 Blocks</p>
          </div>
        </div>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-800 text-emerald-100 font-mono font-bold">
          GIS Map
        </span>
      </NavLink>

      {/* Navigation List Organized by Sections */}
      <div className="flex-1 overflow-y-auto py-1 px-3 space-y-3">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pt-1">
              {section.title}
            </p>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-emerald-600 text-white shadow-md font-bold'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`
                  }
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 opacity-50" />
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* User Profile & Demo Switcher Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs uppercase">
              {user?.full_name ? user.full_name.charAt(0) : 'U'}
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Demo User'}</p>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 font-mono font-bold">
                {userRole}
              </span>
            </div>
          </div>
          <button
            onClick={logout}
            title="Logout"
            className="p-1.5 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
