import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import ProtectedRoute from './components/routing/ProtectedRoute';
import LoginView from './modules/auth/LoginView';
import DashboardView from './modules/dashboard/DashboardView';
import AgendaView from './modules/agenda/AgendaView';
import ClientsView from './modules/clients/ClientsView';
import ServicesView from './modules/services/ServicesView';
import TeamView from './modules/team/TeamView';
import ReportsView from './modules/reports/ReportsView';
import SettingsView from './modules/settings/SettingsView';
import PlatformView from './modules/platform/PlatformView';
import { useAuth } from './context/AuthContext';

/** Área do petshop (níveis ADMIN/STAFF). Administradores da plataforma são
 *  redirecionados para o console da plataforma. */
function PetshopArea() {
  const { user } = useAuth();
  if (user?.role === 'PLATFORM_ADMIN') {
    return <Navigate to="/plataforma" replace />;
  }
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardView />} />
        <Route path="/agenda" element={<AgendaView />} />
        <Route path="/clientes" element={<ClientsView />} />
        <Route path="/servicos" element={<ServicesView />} />
        <Route path="/equipe" element={<TeamView />} />
        <Route path="/relatorios" element={<ReportsView />} />
        <Route path="/configuracoes" element={<SettingsView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

/** Área da equipe Petly (PLATFORM_ADMIN). */
function PlatformArea() {
  const { user } = useAuth();
  if (user?.role !== 'PLATFORM_ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <PlatformView />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginView />} />
        <Route
          path="/plataforma"
          element={
            <ProtectedRoute>
              <PlatformArea />
            </ProtectedRoute>
          }
        />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <PetshopArea />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}
