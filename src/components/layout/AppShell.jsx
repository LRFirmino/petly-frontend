import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../../context/AuthContext';
import { AppointmentModalProvider } from '../../context/AppointmentModalContext';

export default function AppShell({ children }) {
  const { logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <AppointmentModalProvider>
      <div className="app-shell">
        <Sidebar onLogout={handleLogout} />
        <main className="main-content">
          <Topbar />
          <section className="page-content">{children}</section>
        </main>
      </div>
    </AppointmentModalProvider>
  );
}
