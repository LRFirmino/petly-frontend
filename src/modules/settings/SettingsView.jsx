import React, { useEffect, useRef, useState } from 'react';
import Icon from '../../components/Icon';
import PageHeading from '../../components/PageHeading';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import UsersPanel from './UsersPanel';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';

const NAV_ITEMS = [
  { label: 'Dados da empresa', icon: 'home' },
  { label: 'Horários', icon: 'clock' },
  { label: 'Agendamento', icon: 'calendar' },
  { label: 'Notificações', icon: 'bell' },
  { label: 'Usuários e acessos', icon: 'users' },
];

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export default function SettingsView() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const navItems = isAdmin
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => item.label !== 'Usuários e acessos');

  const petshop = useApi(() => api.petshop());
  const [tab, setTab] = useState('Dados da empresa');
  const [form, setForm] = useState({ name: '', email: '', phone: '', cnpj: '', address: '', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (petshop.data) {
      setForm({
        name: petshop.data.name ?? '',
        email: petshop.data.email ?? '',
        phone: petshop.data.phone ?? '',
        cnpj: petshop.data.cnpj ?? '',
        address: petshop.data.address ?? '',
        logoUrl: petshop.data.logoUrl ?? '',
      });
    }
  }, [petshop.data]);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.updatePetshop(form);
      setSaved(true);
      petshop.reload();
      setTimeout(() => setSaved(false), 3200);
    } catch (err) {
      setError(err.message ?? 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Selecione um arquivo de imagem (PNG ou JPG).');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError('A imagem deve ter no máximo 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setError(null);
      update('logoUrl', reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <>
      <PageHeading
        eyebrow="PREFERÊNCIAS"
        title="Configurações"
        description="Personalize os dados e o funcionamento da sua unidade."
        action={saving ? 'Salvando...' : 'Salvar alterações'}
        onAction={handleSave}
      />

      {petshop.loading ? (
        <Loading label="Carregando configurações..." />
      ) : petshop.error ? (
        <ErrorState error={petshop.error} onRetry={petshop.reload} />
      ) : (
        <div className="settings-layout">
          <nav className="settings-nav workspace-card" aria-label="Seções de configuração">
            {navItems.map((item) => (
              <button
                key={item.label}
                className={tab === item.label ? 'active' : ''}
                onClick={() => setTab(item.label)}
              >
                <Icon name={item.icon} size={17} />
                {item.label}
              </button>
            ))}
          </nav>

          <section className="workspace-card">
            <div className="settings-body">
              {tab === 'Dados da empresa' ? (
                <>
                  <div className="business-brand">
                    <div className="logo-preview">
                      {form.logoUrl ? (
                        <img src={form.logoUrl} alt="Logo da empresa" />
                      ) : (
                        <Icon name="paw" size={24} />
                      )}
                    </div>
                    <div>
                      <strong>{form.name || 'Logo da empresa'}</strong>
                      <span>PNG ou JPG, máximo de 2 MB</span>
                    </div>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/png,image/jpeg"
                      style={{ display: 'none' }}
                      onChange={handleLogoChange}
                    />
                    <button className="outline-button" onClick={() => fileRef.current?.click()}>
                      Alterar logo
                    </button>
                    {form.logoUrl ? (
                      <button
                        className="outline-button danger"
                        style={{ marginLeft: 8 }}
                        onClick={() => update('logoUrl', '')}
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>

                  {error ? <div className="auth-error">{error}</div> : null}

                  <div className="settings-fields">
                    <label>
                      Nome do estabelecimento
                      <input value={form.name} onChange={(event) => update('name', event.target.value)} />
                    </label>
                    <label>
                      Telefone
                      <input value={form.phone} onChange={(event) => update('phone', event.target.value)} />
                    </label>
                    <label>
                      E-mail
                      <input value={form.email} onChange={(event) => update('email', event.target.value)} />
                    </label>
                    <label>
                      CNPJ
                      <input value={form.cnpj} onChange={(event) => update('cnpj', event.target.value)} />
                    </label>
                    <label className="wide">
                      Endereço
                      <input value={form.address} onChange={(event) => update('address', event.target.value)} />
                    </label>
                  </div>
                </>
              ) : tab === 'Usuários e acessos' && isAdmin ? (
                <UsersPanel currentUserId={user?.id} />
              ) : (
                <EmptyState title={`${tab}`} hint="Esta seção ainda não possui configurações." />
              )}
            </div>
          </section>
        </div>
      )}

      {saved ? (
        <div className="toast" role="status">
          <span>
            <Icon name="check" size={18} />
          </span>
          <div>
            <strong>Alterações salvas</strong>
            <small>Os dados da unidade foram atualizados.</small>
          </div>
        </div>
      ) : null}
    </>
  );
}
