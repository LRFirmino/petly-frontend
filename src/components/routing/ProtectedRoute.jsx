import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';

function FullScreenLoader() {
  return (
    <div
      className="auth-shell"
      style={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--green-600)' }}>
        <Icon name="loader" size={22} className="auth-spin" />
        <span style={{ fontWeight: 700, fontSize: 13 }}>Carregando sua sessão...</span>
      </div>
    </div>
  );
}

export default function ProtectedRoute({ children }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullScreenLoader />;
  }

  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
