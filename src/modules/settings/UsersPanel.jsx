import React, { useState } from 'react';
import Icon from '../../components/Icon';
import Menu from '../../components/Menu';
import Modal from '../../components/Modal';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import { useConfirm } from '../../hooks/useConfirm';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { initials } from '../../lib/format';

const ROLE_LABELS = { ADMIN: 'Administrador', STAFF: 'Profissional' };
const TONES = ['am', 'ls', 'br'];
const EMPTY_FORM = { name: '', email: '', password: '', role: 'STAFF', active: true };

export default function UsersPanel({ currentUserId }) {
  const users = useApi(() => api.users());
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const { confirm, element: confirmElement } = useConfirm();

  const list = users.data ?? [];

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setModal({ mode: 'create' });
  }

  function openEdit(user) {
    setForm({ name: user.name, email: user.email, password: '', role: user.role, active: user.active });
    setError(null);
    setModal({ mode: 'edit', user });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modal.mode === 'create') {
        await api.createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
        });
      } else {
        const payload = { name: form.name, role: form.role, active: form.active };
        if (form.password) {
          payload.password = form.password;
        }
        await api.updateUser(modal.user.id, payload);
      }
      setModal(null);
      users.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(user) {
    const ok = await confirm({
      title: 'Excluir usuário',
      message: `Excluir ${user.name}? O acesso será removido imediatamente.`,
      confirmLabel: 'Excluir',
    });
    if (!ok) {
      return;
    }
    setNotice(null);
    try {
      await api.deleteUser(user.id);
      users.reload();
    } catch (err) {
      setNotice(err.message);
    }
  }

  return (
    <>
      <div className="users-toolbar">
        <div>
          <strong>Usuários e acessos</strong>
          <span>Contas com acesso ao seu petshop.</span>
        </div>
        <button className="primary-button" onClick={openCreate}>
          <Icon name="plus" size={18} />
          Novo usuário
        </button>
      </div>

      {notice ? <div className="auth-error">{notice}</div> : null}

      {users.loading ? (
        <Loading label="Carregando usuários..." />
      ) : users.error ? (
        <ErrorState error={users.error} onRetry={users.reload} />
      ) : list.length === 0 ? (
        <EmptyState title="Nenhum usuário cadastrado." hint="Use “Novo usuário” para criar o primeiro acesso." />
      ) : (
        <div className="users-table">
          <div className="users-head">
            <span>Nome</span>
            <span>E-mail</span>
            <span>Perfil</span>
            <span>Status</span>
            <span></span>
          </div>
          {list.map((user, index) => (
            <div className="user-row" key={user.id}>
              <div className="user-name">
                <span className={`avatar micro ${TONES[index % TONES.length]}`}>{initials(user.name)}</span>
                <strong>
                  {user.name}
                  {user.id === currentUserId ? ' (você)' : ''}
                </strong>
              </div>
              <span className="user-email">{user.email}</span>
              <span className={`role-chip ${user.role === 'ADMIN' ? 'admin' : 'staff'}`}>
                {ROLE_LABELS[user.role] ?? user.role}
              </span>
              <span className={`status-chip ${user.active ? 'active' : 'inactive'}`}>
                {user.active ? 'Ativo' : 'Inativo'}
              </span>
              <Menu
                label={`Opções para ${user.name}`}
                items={[
                  { label: 'Editar', icon: 'pencil', onClick: () => openEdit(user) },
                  { separator: true },
                  { label: 'Excluir', icon: 'trash', danger: true, onClick: () => remove(user) },
                ]}
              />
            </div>
          ))}
        </div>
      )}

      {modal ? (
        <Modal
          eyebrow="USUÁRIOS E ACESSOS"
          title={modal.mode === 'create' ? 'Novo usuário' : 'Editar usuário'}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          submitLabel={modal.mode === 'create' ? 'Criar usuário' : 'Salvar alterações'}
          submitting={saving}
          error={error}
        >
          <label>
            Nome
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ex.: Ana Martins"
            />
          </label>

          {modal.mode === 'create' ? (
            <label>
              E-mail
              <input
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="pessoa@petly.com.br"
              />
            </label>
          ) : null}

          <div className="form-row">
            <label>
              Perfil
              <select value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                <option value="STAFF">Profissional</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </label>
            {modal.mode === 'edit' ? (
              <label>
                Status
                <select
                  value={form.active ? 'true' : 'false'}
                  onChange={(event) => setForm({ ...form, active: event.target.value === 'true' })}
                >
                  <option value="true">Ativo</option>
                  <option value="false">Inativo</option>
                </select>
              </label>
            ) : null}
          </div>

          <label>
            {modal.mode === 'create' ? 'Senha' : 'Nova senha (opcional)'}
            <input
              type="password"
              required={modal.mode === 'create'}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              placeholder={modal.mode === 'create' ? 'Mínimo de 8 caracteres' : 'Deixe em branco para manter'}
            />
          </label>
        </Modal>
      ) : null}

      {confirmElement}
    </>
  );
}
