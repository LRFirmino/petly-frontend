import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { initials } from '../../lib/format';

function useOutsideClose(ref, onClose) {
  useEffect(() => {
    function handleClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        onClose();
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [ref, onClose]);
}

export default function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = user?.name ?? '—';

  const clients = useApi(() => api.clients());
  const services = useApi(() => api.services());
  const pets = useApi(() => api.pets());
  const summary = useApi(() => api.dashboardSummary());
  const clientsSummary = useApi(() => api.clientsSummary());

  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const userRef = useRef(null);
  const inputRef = useRef(null);

  useOutsideClose(searchRef, () => setSearchOpen(false));
  useOutsideClose(notifRef, () => setNotifOpen(false));
  useOutsideClose(userRef, () => setUserOpen(false));

  useEffect(() => {
    function handleKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
        setSearchOpen(true);
      }
      if (event.key === 'Escape') {
        setSearchOpen(false);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (term.length < 2) {
      return [];
    }
    const matches = [];
    (clients.data ?? []).forEach((client) => {
      if (client.name.toLowerCase().includes(term)) {
        matches.push({ kind: 'Tutor', icon: 'users', tone: 'mint', label: client.name, hint: client.phone ?? '', to: `/clientes?q=${encodeURIComponent(client.name)}` });
      }
    });
    (pets.data ?? []).forEach((pet) => {
      const haystack = `${pet.name} ${pet.breed ?? ''} ${pet.clientName ?? ''}`.toLowerCase();
      if (haystack.includes(term)) {
        matches.push({ kind: 'Pet', icon: 'paw', tone: 'purple', label: `${pet.name} · ${pet.clientName ?? ''}`, hint: pet.breed ?? '', to: `/clientes?q=${encodeURIComponent(pet.name)}` });
      }
    });
    (services.data ?? []).forEach((service) => {
      if (service.name.toLowerCase().includes(term)) {
        matches.push({ kind: 'Serviço', icon: 'services', tone: 'orange', label: service.name, hint: service.description ?? '', to: '/servicos' });
      }
    });
    return matches.slice(0, 8);
  }, [query, clients.data, pets.data, services.data]);

  function goTo(to) {
    setSearchOpen(false);
    setQuery('');
    navigate(to);
  }

  const notifications = useMemo(() => {
    const data = summary.data;
    const extra = clientsSummary.data;
    const items = [];
    if (data) {
      items.push({
        icon: 'calendar', tone: 'mint',
        title: `${data.todayAppointments} agendamentos hoje`,
        text: data.inProgress > 0 ? `${data.inProgress} em atendimento agora` : 'Nenhum em atendimento agora',
        to: '/agenda',
      });
      if (data.newClientsThisMonth > 0) {
        items.push({ icon: 'users', tone: 'peach', title: `${data.newClientsThisMonth} novos clientes`, text: 'cadastrados este mês', to: '/clientes' });
      }
    }
    if (extra && extra.upcomingBirthdays > 0) {
      items.push({ icon: 'pets', tone: 'lavender', title: `${extra.upcomingBirthdays} aniversariantes`, text: 'nos próximos 7 dias', to: '/clientes' });
    }
    return items;
  }, [summary.data, clientsSummary.data]);

  return (
    <header className="topbar">
      <div className="mobile-brand">
        <div className="brand-mark">
          <Icon name="paw" size={20} />
        </div>
        <strong>Petly</strong>
      </div>

      <div className="search-box" ref={searchRef}>
        <Icon name="search" size={18} />
        <input
          ref={inputRef}
          aria-label="Buscar"
          placeholder="Buscar cliente, pet ou serviço..."
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setSearchOpen(true);
          }}
          onFocus={() => setSearchOpen(true)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              if (results[0]) {
                goTo(results[0].to);
              } else if (query.trim().length >= 2) {
                goTo(`/clientes?q=${encodeURIComponent(query.trim())}`);
              }
            }
          }}
        />
        <kbd>⌘ K</kbd>

        {searchOpen && query.trim().length >= 2 ? (
          <div className="search-panel">
            {results.length === 0 ? (
              <div className="search-empty">Nada encontrado para “{query.trim()}”.</div>
            ) : (
              results.map((result) => (
                <button
                  type="button"
                  className="search-item"
                  key={`${result.kind}-${result.label}`}
                  onClick={() => goTo(result.to)}
                >
                  <span className={`si-icon ${result.tone}`}>
                    <Icon name={result.icon} size={15} />
                  </span>
                  <span>
                    <strong>{result.label}</strong>
                    <span>
                      {result.kind}
                      {result.hint ? ` · ${result.hint}` : ''}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>

      <div className="top-actions">
        <div className="dropdown" ref={notifRef}>
          <button
            type="button"
            className="icon-button notification"
            aria-label="Notificações"
            onClick={() => setNotifOpen((value) => !value)}
          >
            <Icon name="bell" size={20} />
            {notifications.length > 0 ? <span></span> : null}
          </button>
          {notifOpen ? (
            <div className="dropdown-panel">
              <h4>Notificações</h4>
              {notifications.length === 0 ? (
                <div className="notif-empty">Tudo em dia por aqui.</div>
              ) : (
                notifications.map((item) => (
                  <button
                    type="button"
                    className="notif-item"
                    key={item.title}
                    onClick={() => {
                      setNotifOpen(false);
                      navigate(item.to);
                    }}
                  >
                    <span className={`notif-icon ${item.tone}`}>
                      <Icon name={item.icon} size={15} />
                    </span>
                    <span>
                      <strong>{item.title}</strong>
                      <span>{item.text}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          ) : null}
        </div>

        <div className="top-divider"></div>

        <div className="location">
          <span>Unidade</span>
          <strong>{user?.petshop?.name ?? '—'}</strong>
        </div>

        <div className="dropdown" ref={userRef}>
          <button
            type="button"
            className="avatar small"
            title={name}
            aria-label={name}
            onClick={() => setUserOpen((value) => !value)}
          >
            {initials(name)}
          </button>
          {userOpen ? (
            <div className="dropdown-panel user-panel">
              <div className="user-head">
                <div className="avatar dark">{initials(name)}</div>
                <div>
                  <strong>{name}</strong>
                  <span>{user?.email}</span>
                </div>
              </div>
              <div className="user-actions">
                <button
                  type="button"
                  onClick={() => {
                    setUserOpen(false);
                    navigate('/configuracoes');
                  }}
                >
                  <Icon name="settings" size={15} />
                  Configurações
                </button>
                <button
                  type="button"
                  className="danger"
                  onClick={() => {
                    setUserOpen(false);
                    logout();
                    navigate('/login', { replace: true });
                  }}
                >
                  <Icon name="logout" size={15} />
                  Sair da conta
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
