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

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['Administrator', 'Researcher', 'Field Staff'] },
    { label: 'GIS Field Map', path: '/gis', icon: Map, roles: ['Administrator', 'Researcher', 'Field Staff'] },
    { label: 'Plot Management', path: '/plots', icon: Grid, roles: ['Administrator', 'Researcher'] },
    { label: 'Variety Master', path: '/varieties', icon: Sprout, roles: ['Administrator', 'Researcher'] },
    { label: 'Trial Management', path: '/trials', icon: TestTube2, roles: ['Administrator', 'Researcher'] },
    { label: 'Plot Designer', path: '/designer', icon: Ruler, roles: ['Administrator', 'Researcher'] },
    { label: 'Layout History', path: '/layout-history', icon: History, roles: ['Administrator', 'Researcher'] },
    { label: 'Planting Management', path: '/planting', icon: CalendarCheck2, roles: ['Administrator', 'Researcher', 'Field Staff'] },
    { label: 'Field Observations', path: '/observations', icon: ClipboardList, roles: ['Administrator', 'Researcher', 'Field Staff'] },
    { label: 'Harvest Management', path: '/harvest', icon: Wheat, roles: ['Administrator', 'Researcher', 'Field Staff'] },
    { label: 'Reports & Export', path: '/reports', icon: FileText, roles: ['Administrator', 'Researcher'] },
    { label: 'Audit Trail', path: '/audit', icon: ShieldCheck, roles: ['Administrator'] },
    { label: 'User Management', path: '/users', icon: Users, roles: ['Administrator'] },
  ];

  const userRole = user?.role || 'Researcher';
  const filteredNav = navItems.filter(item => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-slate-900 text-slate-100 flex flex-col h-screen sticky top-0 shadow-xl z-30">
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

      {/* Active Prototype Plot Badge */}
      <div className="mx-3 my-3 p-3 rounded-lg bg-emerald-950/60 border border-emerald-700/50 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <div>
            <p className="text-xs text-emerald-300 font-semibold uppercase">Active Prototype</p>
            <p className="text-sm font-bold text-white">Plot E4A</p>
          </div>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-800 text-emerald-100 font-mono">N36 E30</span>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto py-2 px-3 space-y-1">
        {filteredNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-60" />
            </NavLink>
          );
        })}
      </div>

      {/* User Footer Profile */}
      <div className="p-3 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
        <div className="flex items-center space-x-2 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-emerald-800 text-white font-bold flex items-center justify-center text-xs">
            {user?.full_name ? user.full_name.charAt(0) : 'U'}
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.full_name || 'Demo User'}</p>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-emerald-400 font-mono">
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
    </aside>
  );
}
