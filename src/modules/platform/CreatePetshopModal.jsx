import React, { useState } from 'react';
import Modal from '../../components/Modal';
import { api } from '../../lib/api';

const EMPTY = {
  petshopName: '',
  phone: '',
  email: '',
  address: '',
  adminName: '',
  adminEmail: '',
  adminPassword: '',
};

export default function CreatePetshopModal({ onClose, onCreated }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.createPlatformPetshop(form);
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      eyebrow="PLATAFORMA"
      title="Novo petshop"
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel="Criar petshop"
      submitting={saving}
      error={error}
    >
      <label>
        Nome do petshop
        <input
          required
          value={form.petshopName}
          onChange={(event) => update('petshopName', event.target.value)}
          placeholder="Ex.: Petly Moema"
        />
      </label>
      <div className="form-row">
        <label>
          Telefone
          <input value={form.phone} onChange={(event) => update('phone', event.target.value)} placeholder="(11) 3000-0000" />
        </label>
        <label>
          E-mail
          <input
            type="email"
            value={form.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="contato@petshop.com.br"
          />
        </label>
      </div>
      <label>
        Endereço
        <input value={form.address} onChange={(event) => update('address', event.target.value)} placeholder="Rua, número - cidade - UF" />
      </label>

      <p className="form-section">Responsável (primeiro administrador)</p>
      <label>
        Nome
        <input
          required
          value={form.adminName}
          onChange={(event) => update('adminName', event.target.value)}
          placeholder="Ex.: Marina Souza"
        />
      </label>
      <div className="form-row">
        <label>
          E-mail de acesso
          <input
            type="email"
            required
            value={form.adminEmail}
            onChange={(event) => update('adminEmail', event.target.value)}
            placeholder="responsavel@petshop.com.br"
          />
        </label>
        <label>
          Senha
          <input
            type="password"
            required
            minLength={8}
            value={form.adminPassword}
            onChange={(event) => update('adminPassword', event.target.value)}
            placeholder="Mínimo de 8 caracteres"
          />
        </label>
      </div>
    </Modal>
  );
}
