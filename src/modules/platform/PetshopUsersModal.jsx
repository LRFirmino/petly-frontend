import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { initials } from '../../lib/format';

const ROLE_LABELS = { ADMIN: 'Administrador', STAFF: 'Profissional' };
const EMPTY = { name: '', email: '', password: '', role: 'STAFF' };

export default function PetshopUsersModal({ petshop, onClose }) {
  const users = useApi(() => api.platformPetshopUsers(petshop.id));
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const canSubmit = form.name.trim() && form.email.trim() && form.password.length >= 8;

  async function createAccount() {
    setSaving(true);
    setError(null);
    try {
      await api.createPlatformPetshopUser(petshop.id, form);
      setForm(EMPTY);
      users.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal eyebrow="CONTAS DE ACESSO" title={`Usuários · ${petshop.name}`} onClose={onClose} cancelLabel="Fechar">
      {users.loading ? (
        <Loading label="Carregando usuários..." />
      ) : users.error ? (
        <ErrorState error={users.error} onRetry={users.reload} />
      ) : (users.data ?? []).length === 0 ? (
        <EmptyState title="Nenhuma conta ainda." />
      ) : (
        <div className="platform-users">
          {users.data.map((user) => (
            <div className="platform-user" key={user.id}>
              <span className="avatar micro am">{initials(user.name)}</span>
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <span className={`role-chip ${user.role === 'ADMIN' ? 'admin' : 'staff'}`}>
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="platform-new-user">
        <h4>Nova conta</h4>
        {error ? <div className="auth-error">{error}</div> : null}
        <div className="form-row">
          <label>
            Nome
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ex.: Ana Martins"
            />
          </label>
          <label>
            Perfil
            <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
              <option value="STAFF">Profissional</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </label>
        </div>
        <label>
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            placeholder="pessoa@petshop.com.br"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            placeholder="Mínimo de 8 caracteres"
          />
        </label>
        <button type="button" className="primary-button" disabled={saving || !canSubmit} onClick={createAccount}>
          {saving ? 'Criando...' : 'Criar conta'}
        </button>
      </div>
    </Modal>
  );
}
