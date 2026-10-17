import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { initials } from '../../lib/format';

const roleLabels = { ADMIN: 'Administradora', STAFF: 'Profissional' };

const NAV_ITEMS = [
  { label: 'Visão geral', icon: 'home', path: '/' },
  { label: 'Agenda', icon: 'calendar', path: '/agenda', badge: 'agenda' },
  { label: 'Clientes & Pets', icon: 'users', path: '/clientes' },
  { label: 'Serviços', icon: 'services', path: '/servicos' },
  { label: 'Equipe', icon: 'pets', path: '/equipe' },
  { label: 'Relatórios', icon: 'chart', path: '/relatorios' },
];

const SETTINGS_ITEM = { label: 'Configurações', icon: 'settings', path: '/configuracoes' };

function navClass({ isActive }) {
  return `nav-item ${isActive ? 'active' : ''}`;
}

export default function Sidebar({ onLogout }) {
  const { user } = useAuth();
  const summary = useApi(() => api.dashboardSummary());
  const name = user?.name ?? '—';
  const role = roleLabels[user?.role] ?? 'Profissional';
  const agendaBadge = summary.data?.todayAppointments ?? 0;

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">
          <Icon name="paw" size={23} />
        </div>
        <div>
          <strong>Petly</strong>
          <span>Gestão pet</span>
        </div>
      </div>

      <nav className="main-nav" aria-label="Navegação principal">
        <span className="nav-caption">MENU</span>
        {NAV_ITEMS.map((item) => {
          const badge = item.badge === 'agenda' ? agendaBadge : null;
          return (
            <NavLink key={item.path} to={item.path} end={item.path === '/'} className={navClass}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {badge ? <small>{badge}</small> : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <NavLink to={SETTINGS_ITEM.path} className={navClass}>
          <Icon name={SETTINGS_ITEM.icon} size={19} />
          <span>{SETTINGS_ITEM.label}</span>
        </NavLink>

        <div className="support-card">
          <div className="support-icon">
            <Icon name="sparkles" size={17} />
          </div>
          <strong>Precisa de ajuda?</strong>
          <span>Nossa equipe está por aqui.</span>
          <button
            type="button"
            onClick={() => {
              window.location.href = 'mailto:suporte@petly.com.br?subject=Ajuda%20com%20o%20Petly';
            }}
          >
            Falar com suporte
          </button>
        </div>

        <div className="user-card">
          <div className="avatar dark">{initials(name)}</div>
          <div>
            <strong>{name}</strong>
            <span>{role}</span>
          </div>
          <button
            type="button"
            className="more-button"
            onClick={onLogout}
            title="Sair da conta"
            aria-label="Sair da conta"
          >
            <Icon name="logout" size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
