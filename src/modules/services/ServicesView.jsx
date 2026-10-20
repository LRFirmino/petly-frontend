import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon';
import Menu from '../../components/Menu';
import Modal from '../../components/Modal';
import PageHeading from '../../components/PageHeading';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfirm } from '../../hooks/useConfirm';
import { SIZE_COLUMNS, money, toneFor } from '../../lib/presentation';

const SERVICE_ICONS = ['paw', 'services', 'sparkles', 'sparkles'];
const COMBO_ICONS = ['paw', 'sparkles', 'services'];

const EMPTY_SERVICE = { name: '', description: '', durationMinutes: 60, priceSmall: '', priceMedium: '', priceLarge: '' };
const EMPTY_COMBO = { name: '', description: '', durationMinutes: 90, priceSmall: '', priceMedium: '', priceLarge: '' };

export default function ServicesView() {
  const [params, setParams] = useSearchParams();
  const services = useApi(() => api.services());
  const combos = useApi(() => api.combos());

  const [tab, setTab] = useState(() => params.get('tab') ?? 'services');
  const [serviceModal, setServiceModal] = useState(null);
  const [comboModal, setComboModal] = useState(null);
  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE);
  const [comboForm, setComboForm] = useState(EMPTY_COMBO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const { confirm, element: confirmElement } = useConfirm();

  useEffect(() => {
    const requestedTab = params.get('tab');
    if (requestedTab) {
      setTab(requestedTab);
    }
    if (params.get('novoCombo') === '1') {
      setTab('combos');
      openCreateCombo();
      const next = new URLSearchParams(params);
      next.delete('novoCombo');
      setParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  function openCreateService() {
    setTab('services');
    setServiceForm(EMPTY_SERVICE);
    setError(null);
    setServiceModal({ mode: 'create' });
  }

  function openEditService(service) {
    setServiceForm({
      name: service.name ?? '',
      description: service.description ?? '',
      durationMinutes: service.durationMinutes ?? '',
      priceSmall: service.prices?.[0] ?? '',
      priceMedium: service.prices?.[1] ?? '',
      priceLarge: service.prices?.[2] ?? '',
    });
    setError(null);
    setServiceModal({ mode: 'edit', service });
  }

  function openCreateCombo() {
    setTab('combos');
    setComboForm(EMPTY_COMBO);
    setError(null);
    setComboModal({ mode: 'create' });
  }

  function openEditCombo(combo) {
    setComboForm({
      name: combo.name ?? '',
      description: combo.description ?? '',
      durationMinutes: combo.durationMinutes ?? '',
      priceSmall: combo.prices?.[0] ?? '',
      priceMedium: combo.prices?.[1] ?? '',
      priceLarge: combo.prices?.[2] ?? '',
    });
    setError(null);
    setComboModal({ mode: 'edit', combo });
  }

  function numberOrNull(value) {
    return value === '' || value === null || value === undefined ? null : Number(value);
  }

  async function submitService(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: serviceForm.name,
      description: serviceForm.description || null,
      durationMinutes: numberOrNull(serviceForm.durationMinutes),
      priceSmall: numberOrNull(serviceForm.priceSmall),
      priceMedium: numberOrNull(serviceForm.priceMedium),
      priceLarge: numberOrNull(serviceForm.priceLarge),
    };
    try {
      if (serviceModal.mode === 'create') {
        await api.createService(payload);
      } else {
        await api.updateService(serviceModal.service.id, payload);
      }
      setServiceModal(null);
      services.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function submitCombo(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: comboForm.name,
      description: comboForm.description || null,
      durationMinutes: numberOrNull(comboForm.durationMinutes),
      priceSmall: numberOrNull(comboForm.priceSmall),
      priceMedium: numberOrNull(comboForm.priceMedium),
      priceLarge: numberOrNull(comboForm.priceLarge),
    };
    try {
      if (comboModal.mode === 'create') {
        await api.createCombo(payload);
      } else {
        await api.updateCombo(comboModal.combo.id, payload);
      }
      setComboModal(null);
      combos.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function removeService(service) {
    const ok = await confirm({
      title: 'Excluir serviço',
      message: `Excluir o serviço ${service.name}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
    });
    if (!ok) {
      return;
    }
    try {
      await api.deleteService(service.id);
      services.reload();
    } catch (err) {
      setNotice(err.message);
    }
  }

  async function removeCombo(combo) {
    const ok = await confirm({
      title: 'Excluir combo',
      message: `Excluir o combo ${combo.name}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
    });
    if (!ok) {
      return;
    }
    try {
      await api.deleteCombo(combo.id);
      combos.reload();
    } catch (err) {
      setNotice(err.message);
    }
  }

  const serviceList = services.data ?? [];
  const comboList = combos.data ?? [];

  return (
    <>
      <PageHeading
        eyebrow="CATÁLOGO E PREÇOS"
        title="Serviços"
        description="Gerencie serviços, combos e valores por porte."
        action="Novo serviço"
        onAction={openCreateService}
      />

      {notice ? <div className="auth-error">{notice}</div> : null}

      <div className="section-tabs">
        <button className={tab === 'services' ? 'active' : ''} onClick={() => setTab('services')}>
          Serviços avulsos <span>{serviceList.length}</span>
        </button>
        <button className={tab === 'combos' ? 'active' : ''} onClick={() => setTab('combos')}>
          Combos <span>{comboList.length}</span>
        </button>
        <button className={tab === 'extras' ? 'active' : ''} onClick={() => setTab('extras')}>
          Adicionais <span>0</span>
        </button>
      </div>

      {tab === 'services' ? (
        services.loading ? (
          <Loading label="Carregando serviços..." />
        ) : services.error ? (
          <ErrorState error={services.error} onRetry={services.reload} />
        ) : serviceList.length === 0 ? (
          <EmptyState title="Nenhum serviço cadastrado." hint="Use “Novo serviço” para começar." />
        ) : (
          <div className="service-grid">
            {serviceList.map((service, index) => (
              <article className="service-card" key={service.id}>
                <div className="service-card-top">
                  <div className={`combo-icon ${toneFor(index)}`}>
                    <Icon name={SERVICE_ICONS[index % SERVICE_ICONS.length]} size={20} />
                  </div>
                  <Menu
                    label={`Opções para ${service.name}`}
                    items={[
                      { label: 'Editar', icon: 'pencil', onClick: () => openEditService(service) },
                      { separator: true },
                      { label: 'Excluir', icon: 'trash', danger: true, onClick: () => removeService(service) },
                    ]}
                  />
                </div>
                <h2>{service.name}</h2>
                <p>{service.description}</p>
                <div className="duration">
                  <Icon name="clock" size={14} />
                  {service.durationMinutes ?? '—'} min
                </div>
                <div className="price-table">
                  {SIZE_COLUMNS.map((label, priceIndex) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{money(service.prices?.[priceIndex], 0)}</strong>
                    </div>
                  ))}
                </div>
                <div className="service-footer">
                  <span>
                    <i></i>Disponível
                  </span>
                  <button onClick={() => openEditService(service)}>Editar</button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}

      {tab === 'combos' ? (
        combos.loading ? (
          <Loading label="Carregando combos..." />
        ) : combos.error ? (
          <ErrorState error={combos.error} onRetry={combos.reload} />
        ) : comboList.length === 0 ? (
          <EmptyState title="Nenhum combo cadastrado." hint="Crie combos para aumentar o ticket médio." />
        ) : (
          <div className="service-grid">
            {comboList.map((combo, index) => (
              <article className="service-card" key={combo.id}>
                <div className="service-card-top">
                  <div className={`combo-icon ${toneFor(index)}`}>
                    <Icon name={COMBO_ICONS[index % COMBO_ICONS.length]} size={20} />
                  </div>
                  <Menu
                    label={`Opções para ${combo.name}`}
                    items={[
                      { label: 'Editar', icon: 'pencil', onClick: () => openEditCombo(combo) },
                      { separator: true },
                      { label: 'Excluir', icon: 'trash', danger: true, onClick: () => removeCombo(combo) },
                    ]}
                  />
                </div>
                <h2>{combo.name}</h2>
                <p>{combo.description}</p>
                <div className="duration">
                  <Icon name="clock" size={14} />
                  {combo.durationMinutes ?? '—'} min
                </div>
                <div className="price-table">
                  {SIZE_COLUMNS.map((label, priceIndex) => (
                    <div key={label}>
                      <span>{label}</span>
                      <strong>{money(combo.prices?.[priceIndex], 0)}</strong>
                    </div>
                  ))}
                </div>
                <div className="service-footer">
                  <span>
                    <i></i>{combo.popularity ?? 0} vendas
                  </span>
                  <button onClick={() => openEditCombo(combo)}>Editar</button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : null}

      {tab === 'extras' ? (
        <EmptyState title="Nenhum adicional cadastrado." hint="Itens extras como perfume ou laço aparecerão aqui." />
      ) : null}

      {tab === 'combos' ? (
        <button className="secondary-button" style={{ marginTop: 14 }} onClick={openCreateCombo}>
          <Icon name="plus" size={17} />
          Criar novo combo
        </button>
      ) : null}

      <div className="combo-banner">
        <div className="combo-banner-icon">
          <Icon name="sparkles" size={22} />
        </div>
        <div>
          <span>COMBOS INTELIGENTES</span>
          <h2>Aumente o ticket médio oferecendo experiências completas</h2>
          <p>Combine serviços, defina descontos e crie opções irresistíveis para seus clientes.</p>
        </div>
        <button onClick={() => setTab('combos')}>
          Gerenciar combos <Icon name="chevronRight" size={16} />
        </button>
      </div>

      {serviceModal ? (
        <Modal
          eyebrow="CATÁLOGO"
          title={serviceModal.mode === 'create' ? 'Novo serviço' : 'Editar serviço'}
          onClose={() => setServiceModal(null)}
          onSubmit={submitService}
          submitLabel={serviceModal.mode === 'create' ? 'Criar serviço' : 'Salvar alterações'}
          submitting={saving}
          error={error}
        >
          <label>
            Nome
            <input
              required
              value={serviceForm.name}
              onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
              placeholder="Ex.: Banho Essencial"
            />
          </label>
          <label>
            Descrição
            <input
              value={serviceForm.description}
              onChange={(event) => setServiceForm({ ...serviceForm, description: event.target.value })}
              placeholder="Banho, secagem, escovação e perfume"
            />
          </label>
          <label>
            Duração (min)
            <input
              type="number"
              min="0"
              value={serviceForm.durationMinutes}
              onChange={(event) => setServiceForm({ ...serviceForm, durationMinutes: event.target.value })}
            />
          </label>
          <div className="form-row">
            <label>
              Pequeno (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={serviceForm.priceSmall}
                onChange={(event) => setServiceForm({ ...serviceForm, priceSmall: event.target.value })}
              />
            </label>
            <label>
              Médio (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={serviceForm.priceMedium}
                onChange={(event) => setServiceForm({ ...serviceForm, priceMedium: event.target.value })}
              />
            </label>
            <label>
              Grande (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={serviceForm.priceLarge}
                onChange={(event) => setServiceForm({ ...serviceForm, priceLarge: event.target.value })}
              />
            </label>
          </div>
        </Modal>
      ) : null}

      {comboModal ? (
        <Modal
          eyebrow="CATÁLOGO"
          title={comboModal.mode === 'create' ? 'Novo combo' : 'Editar combo'}
          onClose={() => setComboModal(null)}
          onSubmit={submitCombo}
          submitLabel={comboModal.mode === 'create' ? 'Criar combo' : 'Salvar alterações'}
          submitting={saving}
          error={error}
        >
          <label>
            Nome
            <input
              required
              value={comboForm.name}
              onChange={(event) => setComboForm({ ...comboForm, name: event.target.value })}
              placeholder="Ex.: Combo Completo"
            />
          </label>
          <label>
            Descrição
            <input
              value={comboForm.description}
              onChange={(event) => setComboForm({ ...comboForm, description: event.target.value })}
              placeholder="Banho, tosa e unhas"
            />
          </label>
          <label>
            Duração (min)
            <input
              type="number"
              min="0"
              value={comboForm.durationMinutes}
              onChange={(event) => setComboForm({ ...comboForm, durationMinutes: event.target.value })}
            />
          </label>
          <div className="form-row">
            <label>
              Pequeno (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={comboForm.priceSmall}
                onChange={(event) => setComboForm({ ...comboForm, priceSmall: event.target.value })}
              />
            </label>
            <label>
              Médio (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={comboForm.priceMedium}
                onChange={(event) => setComboForm({ ...comboForm, priceMedium: event.target.value })}
              />
            </label>
            <label>
              Grande (R$)
              <input
                type="number"
                min="0"
                step="0.01"
                value={comboForm.priceLarge}
                onChange={(event) => setComboForm({ ...comboForm, priceLarge: event.target.value })}
              />
            </label>
          </div>
        </Modal>
      ) : null}

      {confirmElement}
    </>
  );
}
