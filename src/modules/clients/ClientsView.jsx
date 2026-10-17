import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import Menu from '../../components/Menu';
import Modal from '../../components/Modal';
import PageHeading from '../../components/PageHeading';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfirm } from '../../hooks/useConfirm';
import { shortDate, sizeLabel, toneFor } from '../../lib/presentation';

const PAGE_SIZE = 8;
const SIZE_OPTIONS = [
  { value: 'ALL', label: 'Todos os portes' },
  { value: 'SMALL', label: 'Pequeno' },
  { value: 'MEDIUM', label: 'Médio' },
  { value: 'LARGE', label: 'Grande' },
];

const EMPTY_FORM = { name: '', email: '', phone: '', notes: '' };

function relativeDay(iso) {
  if (!iso) {
    return 'sem atendimentos';
  }
  const then = new Date(iso);
  then.setHours(0, 0, 0, 0);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const days = Math.round((now - then) / 86400000);
  if (days <= 0) {
    return 'hoje';
  }
  if (days === 1) {
    return 'ontem';
  }
  return `há ${days} dias`;
}

export default function ClientsView() {
  const [params, setParams] = useSearchParams();
  const clients = useApi(() => api.clients());
  const summary = useApi(() => api.clientsSummary());

  const [query, setQuery] = useState(() => params.get('q') ?? '');
  const [size, setSize] = useState('ALL');
  const [recentFirst, setRecentFirst] = useState(false);
  const [page, setPage] = useState(1);

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const { confirm, element: confirmElement } = useConfirm();

  useEffect(() => {
    const q = params.get('q');
    if (q !== null) {
      setQuery(q);
      setPage(1);
    }
    if (params.get('novo') === '1') {
      openCreate();
      const next = new URLSearchParams(params);
      next.delete('novo');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setModal({ mode: 'create' });
  }

  function openEdit(client) {
    setForm({
      name: client.name ?? '',
      email: client.email ?? '',
      phone: client.phone ?? '',
      notes: client.notes ?? '',
    });
    setError(null);
    setModal({ mode: 'edit', client });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (modal.mode === 'create') {
        await api.createClient(form);
      } else {
        await api.updateClient(modal.client.id, form);
      }
      setModal(null);
      clients.reload();
      summary.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeClient(client) {
    const ok = await confirm({
      title: 'Excluir cliente',
      message: `Tem certeza que deseja excluir ${client.name}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
    });
    if (!ok) {
      return;
    }
    try {
      await api.deleteClient(client.id);
      clients.reload();
      summary.reload();
    } catch (err) {
      setNotice(err.message);
    }
  }

  const minis = summary.data
    ? [
        { label: 'Clientes ativos', value: summary.data.activeClients, note: 'no petshop' },
        {
          label: 'Pets cadastrados',
          value: summary.data.registeredPets,
          note: summary.data.activeClients
            ? `${(summary.data.registeredPets / summary.data.activeClients).toFixed(1)} por tutor`
            : '—',
        },
        { label: 'Aniversariantes', value: summary.data.upcomingBirthdays, note: 'nos próximos 7 dias' },
      ]
    : [];

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    let list = clients.data ?? [];

    if (term) {
      list = list.filter((client) =>
        [client.name, client.email, client.phone, ...(client.pets ?? []).map((pet) => `${pet.name} ${pet.breed}`)]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(term)),
      );
    }

    if (size !== 'ALL') {
      list = list.filter((client) => (client.pets ?? []).some((pet) => pet.size === size));
    }

    list = [...list];
    if (recentFirst) {
      list.sort((a, b) => new Date(b.lastVisit ?? 0) - new Date(a.lastVisit ?? 0));
    } else {
      list.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    }
    return list;
  }, [clients.data, query, size, recentFirst]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <>
      <PageHeading
        eyebrow="RELACIONAMENTO"
        title="Clientes & Pets"
        description="Todos os tutores e seus melhores amigos em um só lugar."
        action="Novo cadastro"
        onAction={openCreate}
      />

      {notice ? <div className="auth-error">{notice}</div> : null}

      <div className="mini-stats">
        {summary.loading ? (
          <div><span>Carregando...</span><strong>—</strong><small>&nbsp;</small></div>
        ) : (
          minis.map((mini) => (
            <div key={mini.label}>
              <span>{mini.label}</span>
              <strong>{mini.value}</strong>
              <small>{mini.note}</small>
            </div>
          ))
        )}
      </div>

      <section className="workspace-card">
        <div className="workspace-toolbar">
          <div className="inner-search">
            <Icon name="search" size={17} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por pet, tutor ou raça..."
            />
          </div>
          <div className="toolbar-actions">
            <select
              className="outline-button"
              value={size}
              onChange={(event) => {
                setSize(event.target.value);
                setPage(1);
              }}
            >
              {SIZE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              className="outline-button"
              onClick={() => setRecentFirst((value) => !value)}
            >
              {recentFirst ? 'Mais recentes' : 'Ordem alfabética'}
            </button>
          </div>
        </div>

        {clients.loading ? (
          <Loading label="Carregando clientes..." />
        ) : clients.error ? (
          <ErrorState error={clients.error} onRetry={clients.reload} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Nenhum cliente encontrado." hint="Ajuste a busca ou cadastre um novo cliente." />
        ) : (
          <div className="client-table">
            <div className="table-head">
              <span>Pet</span>
              <span>Tutor</span>
              <span>Porte</span>
              <span>Visitas</span>
              <span>Último atendimento</span>
              <span></span>
            </div>

            {pageItems.map((client, index) => {
              const pet = client.pets?.[0];
              return (
                <div className="client-row" key={client.id}>
                  <div className="client-pet">
                    <div className={`pet-avatar ${toneFor(index)}`}>
                      <Icon name="paw" size={20} />
                    </div>
                    <div>
                      <strong>{pet?.name ?? '—'}</strong>
                      <span>{pet?.breed ?? '—'}</span>
                    </div>
                  </div>
                  <div className="client-owner">
                    <strong>{client.name}</strong>
                    <span>{client.phone ?? client.email ?? '—'}</span>
                  </div>
                  <span className="size-chip">{sizeLabel(pet?.size)}</span>
                  <strong className="visit-count">{client.visits}</strong>
                  <div className="last-visit">
                    <strong>{shortDate(client.lastVisit)}</strong>
                    <span>{relativeDay(client.lastVisit)}</span>
                  </div>
                  <Menu
                    label={`Opções para ${pet?.name ?? client.name}`}
                    items={[
                      { label: 'Editar cadastro', icon: 'pencil', onClick: () => openEdit(client) },
                      { separator: true },
                      { label: 'Excluir', icon: 'trash', danger: true, onClick: () => removeClient(client) },
                    ]}
                  />
                </div>
              );
            })}

            <div className="table-footer">
              <span>
                Mostrando {pageItems.length} de {filtered.length} clientes
              </span>
              {totalPages > 1 ? (
                <div>
                  {Array.from({ length: totalPages }).map((_, index) => (
                    <button
                      key={index}
                      className={currentPage === index + 1 ? 'active' : ''}
                      onClick={() => setPage(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        )}
      </section>

      {modal ? (
        <Modal
          eyebrow="CLIENTES & PETS"
          title={modal.mode === 'create' ? 'Novo cadastro' : 'Editar cadastro'}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          submitLabel={modal.mode === 'create' ? 'Cadastrar cliente' : 'Salvar alterações'}
          submitting={saving}
          error={error}
        >
          <label>
            Nome do tutor
            <input
              required
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Ex.: Clara Mendes"
            />
          </label>
          <div className="form-row">
            <label>
              E-mail
              <input
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="cliente@email.com"
              />
            </label>
            <label>
              Telefone
              <input
                value={form.phone}
                onChange={(event) => setForm({ ...form, phone: event.target.value })}
                placeholder="(11) 90000-0000"
              />
            </label>
          </div>
          <label>
            Observações
            <textarea
              value={form.notes}
              onChange={(event) => setForm({ ...form, notes: event.target.value })}
              placeholder="Preferências, alergias, histórico..."
            />
          </label>
        </Modal>
      ) : null}

      {confirmElement}
    </>
  );
}
