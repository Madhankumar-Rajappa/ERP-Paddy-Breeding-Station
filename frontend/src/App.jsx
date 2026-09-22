import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';

import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import GisPage from './pages/GisPage';
import PlotManagementPage from './pages/PlotManagementPage';
import VarietyManagementPage from './pages/VarietyManagementPage';
import TrialManagementPage from './pages/TrialManagementPage';
import PlotDesignerPage from './pages/PlotDesignerPage';
import LayoutHistoryPage from './pages/LayoutHistoryPage';
import PlantingManagementPage from './pages/PlantingManagementPage';
import ObservationManagementPage from './pages/ObservationManagementPage';
import HarvestManagementPage from './pages/HarvestManagementPage';
import ReportsPage from './pages/ReportsPage';
import AuditLogPage from './pages/AuditLogPage';
import UserManagementPage from './pages/UserManagementPage';

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="p-6 flex-1 overflow-y-auto">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/gis" element={<GisPage />} />
            <Route path="/plots" element={<PlotManagementPage />} />
            <Route path="/varieties" element={<VarietyManagementPage />} />
            <Route path="/trials" element={<TrialManagementPage />} />
            <Route path="/designer" element={<PlotDesignerPage />} />
            <Route path="/layout-history" element={<LayoutHistoryPage />} />
            <Route path="/planting" element={<PlantingManagementPage />} />
            <Route path="/observations" element={<ObservationManagementPage />} />
            <Route path="/harvest" element={<HarvestManagementPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/audit" element={<AuditLogPage />} />
            <Route path="/users" element={<UserManagementPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
