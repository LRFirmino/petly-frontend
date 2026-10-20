import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon';
import { Loading, ErrorState } from '../components/DataState';
import { api } from '../lib/api';
import { useApi } from '../lib/useApi';
import { firstName } from '../lib/format';
import { SIZE_COLUMNS, SIZE_KEYS, money } from '../lib/presentation';

const AppointmentModalContext = createContext(() => {});

export function useAppointmentModal() {
  return useContext(AppointmentModalContext);
}

function todayIso() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function durationMinutesOf(item) {
  const value = item?.durationMinutes;
  return value && value > 0 ? value : 60;
}

function rangesOverlap(startA, endA, startB, endB) {
  return startA.getTime() < endB.getTime() && startB.getTime() < endA.getTime();
}

function hhmm(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function AppointmentModal({ onClose, onConfirm }) {
  const { data: pets, loading: petsLoading, error: petsError, reload: reloadPets } = useApi(() => api.pets());
  const { data: services, loading: servicesLoading, error: servicesError, reload: reloadServices } = useApi(() => api.services());
  const { data: combos, loading: combosLoading, error: combosError, reload: reloadCombos } = useApi(() => api.combos());
  const { data: team, loading: teamLoading, error: teamError, reload: reloadTeam } = useApi(() => api.team());

  const [clientId, setClientId] = useState('');
  const [petId, setPetId] = useState('');
  const [itemType, setItemType] = useState('SERVICE');
  const [itemId, setItemId] = useState('');
  const [size, setSize] = useState('MEDIUM');
  const [date, setDate] = useState(todayIso());
  const [time, setTime] = useState('10:30');
  const [staffName, setStaffName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const items = itemType === 'COMBO' ? (combos ?? []) : (services ?? []);

  useEffect(() => {
    if (pets?.length && !petId) {
      setPetId(String(pets[0].id));
      setClientId(String(pets[0].clientId));
      setSize(pets[0].size ?? 'MEDIUM');
    }
  }, [pets, petId]);

  useEffect(() => {
    if (items.length && !items.some((item) => String(item.id) === itemId)) {
      setItemId(String(items[0].id));
    }
  }, [items, itemId]);

  useEffect(() => {
    if (team?.length && !staffName) {
      setStaffName(team[0].name);
    }
  }, [team, staffName]);

  const selectedItem = useMemo(
    () => items.find((item) => String(item.id) === itemId) ?? null,
    [items, itemId],
  );

  const price = useMemo(() => {
    if (!selectedItem) {
      return null;
    }
    const index = SIZE_KEYS.indexOf(size);
    return index >= 0 ? selectedItem.prices?.[index] : null;
  }, [selectedItem, size]);

  // Disponibilidade do profissional no dia escolhido (o backend revalida).
  const dayAppointments = useApi(
    () => api.appointments(`${date}T00:00:00`, `${date}T23:59:59`),
    [date],
  );

  const busySlots = useMemo(() => {
    return (dayAppointments.data ?? [])
      .filter((item) => item.status !== 'CANCELLED')
      .filter((item) => (item.staffName ?? '').toLowerCase() === (staffName ?? '').toLowerCase())
      .map((item) => {
        const start = new Date(item.scheduledAt);
        const end = item.endTime ? new Date(item.endTime) : new Date(start.getTime() + 60 * 60000);
        return { start, end, pet: item.petName };
      })
      .sort((a, b) => a.start - b.start);
  }, [dayAppointments.data, staffName]);

  const conflict = useMemo(() => {
    if (!date || !time || !staffName) {
      return null;
    }
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + durationMinutesOf(selectedItem) * 60000);
    return busySlots.find((slot) => rangesOverlap(start, end, slot.start, slot.end)) ?? null;
  }, [date, time, staffName, selectedItem, busySlots]);

  function handlePetChange(value) {
    setPetId(value);
    const pet = pets?.find((item) => String(item.id) === value);
    if (pet) {
      setClientId(String(pet.clientId));
      setSize(pet.size ?? 'MEDIUM');
    }
  }

  function handleItemTypeChange(value) {
    setItemType(value);
    setItemId('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!clientId || !selectedItem || !date || !time) {
      setError('Preencha todos os campos para confirmar o agendamento.');
      return;
    }
    if (conflict) {
      setError(
        `Conflito de horário: ${staffName} já atende das ${hhmm(conflict.start)} às ${hhmm(conflict.end)}. Escolha outro horário ou profissional.`,
      );
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await api.createAppointment({
        clientId: Number(clientId),
        petId: petId ? Number(petId) : null,
        itemType,
        itemId: Number(itemId),
        service: selectedItem.name,
        scheduledAt: `${date}T${time}:00`,
        status: 'SCHEDULED',
        staffName: staffName || null,
        durationMinutes: selectedItem.durationMinutes ?? null,
        price,
      });
      onConfirm();
    } catch (err) {
      setError(err.message ?? 'Não foi possível criar o agendamento.');
    } finally {
      setSubmitting(false);
    }
  }

  const loading = petsLoading || servicesLoading || combosLoading || teamLoading;
  const loadError = petsError || servicesError || combosError || teamError;
  const hasPets = (pets?.length ?? 0) > 0;
  const hasItems = (services?.length ?? 0) > 0 || (combos?.length ?? 0) > 0;

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <span className="eyebrow">AGENDA</span>
            <h2 id="modal-title">Novo agendamento</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <Icon name="close" size={18} />
          </button>
        </div>

        {loading ? (
          <Loading label="Carregando clientes, serviços e equipe..." />
        ) : loadError ? (
          <ErrorState
            error={loadError}
            message="Não foi possível carregar os dados."
            onRetry={() => {
              reloadPets();
              reloadServices();
              reloadCombos();
              reloadTeam();
            }}
          />
        ) : !hasPets || !hasItems ? (
          <div className="data-state">
            <strong>Cadastre um cliente e um serviço primeiro.</strong>
            <span>É preciso ter ao menos um pet e um serviço para agendar.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label>
              Pet e tutor
              <select value={petId} onChange={(event) => handlePetChange(event.target.value)}>
                {pets.map((pet) => (
                  <option key={pet.id} value={pet.id}>
                    {pet.name} · {pet.clientName}
                  </option>
                ))}
              </select>
            </label>

            <div className="form-row">
              <label>
                Tipo
                <select value={itemType} onChange={(event) => handleItemTypeChange(event.target.value)}>
                  <option value="SERVICE">Serviço</option>
                  <option value="COMBO">Combo</option>
                </select>
              </label>
              <label>
                {itemType === 'COMBO' ? 'Combo' : 'Serviço'}
                <select value={itemId} onChange={(event) => setItemId(event.target.value)}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Porte
                <select value={size} onChange={(event) => setSize(event.target.value)}>
                  {SIZE_KEYS.map((key, index) => (
                    <option key={key} value={key}>
                      {SIZE_COLUMNS[index]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Profissional
                <select value={staffName} onChange={(event) => setStaffName(event.target.value)}>
                  {team.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-row">
              <label>
                Data
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label>
                Horário
                <input type="time" value={time} onChange={(event) => setTime(event.target.value)} />
              </label>
            </div>

            {selectedItem ? (
              <p className="modal-hint">
                Duração: {selectedItem.durationMinutes ?? '—'} min · Valor: {money(price, 0)}
              </p>
            ) : null}

            {busySlots.length > 0 ? (
              <div className="slot-availability">
                <span>Ocupado de {firstName(staffName) || '—'}:</span>
                <div className="slot-chips">
                  {busySlots.map((slot, index) => (
                    <b
                      key={index}
                      className={conflict && slot === conflict ? 'conflict' : ''}
                    >
                      {hhmm(slot.start)}–{hhmm(slot.end)}
                    </b>
                  ))}
                </div>
              </div>
            ) : null}

            {conflict ? (
              <div className="auth-error">
                <Icon name="alert" size={16} />
                <span>
                  Conflito de horário: {staffName} já atende das {hhmm(conflict.start)} às {hhmm(conflict.end)}.
                  Escolha outro horário ou profissional.
                </span>
              </div>
            ) : null}

            {error ? <div className="auth-error">{error}</div> : null}

            <div className="modal-actions">
              <button type="button" onClick={onClose}>
                Cancelar
              </button>
              <button
                type="submit"
                className="primary-button"
                disabled={submitting || dayAppointments.loading || Boolean(conflict)}
              >
                {submitting ? 'Confirmando...' : 'Confirmar agendamento'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function AppointmentModalProvider({ children }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState(false);
  const onCreated = useRef(null);
  const timer = useRef(null);

  const openModal = useCallback((callback) => {
    onCreated.current = typeof callback === 'function' ? callback : null;
    setOpen(true);
  }, []);

  const closeModal = useCallback(() => setOpen(false), []);

  const handleConfirm = useCallback(() => {
    setOpen(false);
    setToast(true);
    if (typeof onCreated.current === 'function') {
      onCreated.current();
    }
    if (timer.current) {
      clearTimeout(timer.current);
    }
    timer.current = setTimeout(() => setToast(false), 3200);
  }, []);

  useEffect(() => () => {
    if (timer.current) {
      clearTimeout(timer.current);
    }
  }, []);

  return (
    <AppointmentModalContext.Provider value={openModal}>
      {children}
      {open ? <AppointmentModal onClose={closeModal} onConfirm={handleConfirm} /> : null}
      {toast ? (
        <div className="toast" role="status">
          <span>
            <Icon name="calendar" size={18} />
          </span>
          <div>
            <strong>Agendamento confirmado</strong>
            <small>O novo horário já está na agenda.</small>
          </div>
        </div>
      ) : null}
    </AppointmentModalContext.Provider>
  );
}
