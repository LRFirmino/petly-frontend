import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import Menu from '../../components/Menu';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import CreatePetshopModal from './CreatePetshopModal';
import PetshopUsersModal from './PetshopUsersModal';

export default function PlatformView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const petshops = useApi(() => api.platformPetshops());

  const [createOpen, setCreateOpen] = useState(false);
  const [usersOf, setUsersOf] = useState(null);
  const [notice, setNotice] = useState(null);

  const list = petshops.data ?? [];
  const totals = useMemo(
    () =>
      list.reduce(
        (acc, shop) => ({
          petshops: acc.petshops + 1,
          users: acc.users + shop.users,
          clients: acc.clients + shop.clients,
        }),
        { petshops: 0, users: 0, clients: 0 },
      ),
    [list],
  );

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function toggleActive(shop) {
    setNotice(null);
    try {
      await api.setPlatformPetshopActive(shop.id, !shop.active);
      petshops.reload();
    } catch (err) {
      setNotice(err.message);
    }
  }

  return (
    <div className="platform-shell">
      <header className="topbar">
        <div className="platform-brand">
          <div className="brand-mark">
            <Icon name="paw" size={20} />
          </div>
          <div>
            <strong>Petly</strong>
            <span>Plataforma</span>
          </div>
        </div>
        <div className="top-actions">
          <div className="location">
            <span>Administrador</span>
            <strong>{user?.name}</strong>
          </div>
          <button className="outline-button" onClick={handleLogout}>
            <Icon name="logout" size={15} />
            Sair
          </button>
        </div>
      </header>

      <div className="page-content">
        <div className="welcome-row page-heading">
          <div>
            <p className="eyebrow">ADMINISTRAÇÃO DA PLATAFORMA</p>
            <h1>Petshops</h1>
            <p className="subtitle">Crie petshops e contas de acesso para os clientes do Petly.</p>
          </div>
          <button className="primary-button" onClick={() => setCreateOpen(true)}>
            <Icon name="plus" size={18} />
            Novo petshop
          </button>
        </div>

        <div className="mini-stats">
          <div>
            <span>Petshops</span>
            <strong>{totals.petshops}</strong>
            <small>na plataforma</small>
          </div>
          <div>
            <span>Usuários</span>
            <strong>{totals.users}</strong>
            <small>contas com acesso</small>
          </div>
          <div>
            <span>Clientes</span>
            <strong>{totals.clients}</strong>
            <small>tutores cadastrados</small>
          </div>
        </div>

        {notice ? <div className="auth-error">{notice}</div> : null}

        <section className="workspace-card">
          {petshops.loading ? (
            <Loading label="Carregando petshops..." />
          ) : petshops.error ? (
            <ErrorState error={petshops.error} onRetry={petshops.reload} />
          ) : list.length === 0 ? (
            <EmptyState title="Nenhum petshop cadastrado." hint="Use “Novo petshop” para criar o primeiro." />
          ) : (
            <>
              <div className="platform-grid-head">
                <span>Petshop</span>
                <span>Contato</span>
                <span>Usuários</span>
                <span>Clientes</span>
                <span>Status</span>
                <span></span>
              </div>
              {list.map((shop) => (
                <div className="platform-grid-row" key={shop.id}>
                  <div className="shop-name">
                    <strong>{shop.name}</strong>
                    <span>{shop.slug}</span>
                  </div>
                  <div className="shop-contact">
                    <span>{shop.email ?? '—'}</span>
                    <span>{shop.phone ?? '—'}</span>
                  </div>
                  <div className="shop-metric">
                    <strong>{shop.users}</strong>
                  </div>
                  <div className="shop-metric">
                    <strong>{shop.clients}</strong>
                  </div>
                  <span className={`status-chip ${shop.active ? 'active' : 'inactive'}`}>
                    {shop.active ? 'Ativo' : 'Inativo'}
                  </span>
                  <Menu
                    label={`Opções para ${shop.name}`}
                    items={[
                      { label: 'Usuários e contas', icon: 'users', onClick: () => setUsersOf(shop) },
                      { separator: true },
                      {
                        label: shop.active ? 'Desativar petshop' : 'Ativar petshop',
                        icon: shop.active ? 'close' : 'check',
                        danger: shop.active,
                        onClick: () => toggleActive(shop),
                      },
                    ]}
                  />
                </div>
              ))}
            </>
          )}
        </section>
      </div>

      {createOpen ? (
        <CreatePetshopModal
          onClose={() => setCreateOpen(false)}
          onCreated={() => {
            setCreateOpen(false);
            petshops.reload();
          }}
        />
      ) : null}

      {usersOf ? <PetshopUsersModal petshop={usersOf} onClose={() => setUsersOf(null)} /> : null}
    </div>
  );
}
