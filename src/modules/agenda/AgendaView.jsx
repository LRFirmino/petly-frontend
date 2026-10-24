import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import Menu from '../../components/Menu';
import Modal from '../../components/Modal';
import PageHeading from '../../components/PageHeading';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import { useAppointmentModal } from '../../context/AppointmentModalContext';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfirm } from '../../hooks/useConfirm';
import { firstName } from '../../lib/format';
import { appointmentPayload, money, sizeLabel, statusLabel, timeOf, toneFor } from '../../lib/presentation';

const WEEK_LABELS = ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const DAY_START_HOUR = 8;
const DAY_SPAN_HOURS = 9;

function mondayOfWeek(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset * 7);
  const weekday = date.getDay();
  const diff = weekday === 0 ? -6 : 1 - weekday;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function sameDay(a, b) {
  return a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
}

function eventPosition(event) {
  const start = new Date(event.scheduledAt);
  const minutes = (start.getHours() - DAY_START_HOUR) * 60 + start.getMinutes();
  const top = Math.max(0, (minutes / 60 / DAY_SPAN_HOURS) * 100);
  const height = Math.max(6, ((event.durationMinutes ?? 60) / 60 / DAY_SPAN_HOURS) * 100);
  return { top: `${top}%`, height: `${height}%` };
}

export default function AgendaView() {
  const openNewAppointment = useAppointmentModal();
  const team = useApi(() => api.team());

  const [weekOffset, setWeekOffset] = useState(0);
  const [viewMode, setViewMode] = useState('week');
  const [activeDay, setActiveDay] = useState(null);
  const [professional, setProfessional] = useState('Todos');
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState(null);
  const { confirm, element: confirmElement } = useConfirm();

  const week = useMemo(() => {
    const monday = mondayOfWeek(weekOffset);
    const days = Array.from({ length: 6 }).map((_, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return date;
    });
    return { monday, days };
  }, [weekOffset]);

  const todayIndex = useMemo(
    () => week.days.findIndex((day) => sameDay(day, new Date())),
    [week],
  );

  useEffect(() => {
    setActiveDay(todayIndex >= 0 ? todayIndex : 0);
  }, [todayIndex]);

  const appointments = useApi(() => {
    const from = `${isoDate(week.monday)}T00:00:00`;
    const to = `${isoDate(week.days[5])}T23:59:59`;
    return api.appointments(from, to);
  }, [weekOffset]);

  const filtered = useMemo(() => {
    const list = appointments.data ?? [];
    if (professional === 'Todos') {
      return list;
    }
    return list.filter((item) => item.staffName === professional);
  }, [appointments.data, professional]);

  const eventsByDay = useMemo(() => {
    const grouped = {};
    filtered.forEach((item) => {
      const date = new Date(item.scheduledAt);
      const index = week.days.findIndex((day) => sameDay(day, date));
      if (index >= 0) {
        grouped[index] = grouped[index] ?? [];
        grouped[index].push(item);
      }
    });
    Object.values(grouped).forEach((list) =>
      list.sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt)));
    return grouped;
  }, [filtered, week]);

  const monthLabel = week.days[0].toLocaleDateString('pt-BR', { month: 'long' });
  const rangeLabel = `${week.days[0].getDate()} — ${week.days[5].getDate()} de ${monthLabel} de ${week.days[5].getFullYear()}`;
  const dayNumberLabel = `${activeDay !== null ? week.days[activeDay].getDate() : ''} de ${monthLabel}`;

  const visibleColumns = viewMode === 'day' && activeDay !== null
    ? [activeDay]
    : week.days.map((_, index) => index);

  async function changeStatus(item, status) {
    setNotice(null);
    try {
      await api.updateAppointment(item.id, appointmentPayload(item, { status }));
      setSelected(null);
      appointments.reload();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function removeEvent(item) {
    const ok = await confirm({
      title: 'Excluir agendamento',
      message: `Excluir o agendamento de ${item.petName ?? 'pet'}? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
    });
    if (!ok) {
      return;
    }
    setNotice(null);
    try {
      await api.deleteAppointment(item.id);
      setSelected(null);
      appointments.reload();
    } catch (error) {
      setNotice(error.message);
    }
  }

  const teamMenuItems = [
    { label: 'Toda a equipe', icon: 'users', onClick: () => setProfessional('Todos') },
    ...(team.data ?? []).map((member) => ({
      label: member.name,
      icon: 'paw',
      onClick: () => setProfessional(member.name),
    })),
  ];

  return (
    <>
      <PageHeading
        eyebrow="ORGANIZAÇÃO DA ROTINA"
        title="Agenda"
        description="Visualize e organize os horários de toda a equipe."
        action="Novo agendamento"
        onAction={() => openNewAppointment(appointments.reload)}
      />

      {notice ? <div className="auth-error">{notice}</div> : null}

      <section className="workspace-card calendar-page">
        <div className="workspace-toolbar">
          <div className="date-navigator">
            <button aria-label="Semana anterior" onClick={() => setWeekOffset((value) => value - 1)}>
              <Icon name="chevronLeft" size={17} />
            </button>
            <strong>{rangeLabel}</strong>
            <button aria-label="Próxima semana" onClick={() => setWeekOffset((value) => value + 1)}>
              <Icon name="chevronRight" size={17} />
            </button>
            <button
              className="today-button"
              onClick={() => {
                setWeekOffset(0);
                setActiveDay(todayIndex >= 0 ? todayIndex : 0);
              }}
            >
              Hoje
            </button>
          </div>
          <div className="toolbar-actions">
            <Menu
              label="Filtrar por profissional"
              size={16}
              items={teamMenuItems}
              trigger={
                <button className="outline-button">
                  <Icon name="users" size={16} />
                  {professional === 'Todos' ? 'Toda a equipe' : firstName(professional)}
                </button>
              }
            />
            <div className="view-toggle">
              <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>
                Semana
              </button>
              <button className={viewMode === 'day' ? 'active' : ''} onClick={() => setViewMode('day')}>
                Dia
              </button>
            </div>
          </div>
        </div>

        {appointments.loading ? (
          <Loading label="Carregando agenda..." />
        ) : appointments.error ? (
          <ErrorState error={appointments.error} onRetry={appointments.reload} />
        ) : (
          <>
            <div className="week-strip">
              <div className="week-spacer"></div>
              {week.days.map((day, index) => (
                <button
                  key={index}
                  className={index === activeDay ? 'active' : ''}
                  onClick={() => {
                    setActiveDay(index);
                    if (viewMode === 'week') {
                      setViewMode('day');
                    }
                  }}
                >
                  <span>{WEEK_LABELS[index]}</span>
                  <strong>{day.getDate()}</strong>
                  <small>{(eventsByDay[index]?.length ?? 0)} agend.</small>
                </button>
              ))}
            </div>

            {viewMode === 'day' ? (
              <div className="workspace-toolbar" style={{ minHeight: 56, padding: '6px 18px' }}>
                <strong style={{ fontSize: 'var(--text-base)' }}>{dayNumberLabel}</strong>
                <button className="outline-button" onClick={() => setViewMode('week')}>
                  Ver semana completa
                </button>
              </div>
            ) : null}

            <div className="week-grid">
              <div className="time-axis">
                {HOURS.map((hour) => (
                  <span key={hour}>{hour}</span>
                ))}
              </div>
              <div className={`week-columns ${viewMode === 'day' ? 'day-view' : ''}`}>
                {visibleColumns.map((index) => (
                  <div key={index} className={`day-column ${index === todayIndex ? 'active' : ''}`}>
                    {(eventsByDay[index] ?? []).map((event, eventIndex) => (
                      <button
                        key={event.id}
                        type="button"
                        className={`calendar-event ${toneFor(eventIndex)}`}
                        style={eventPosition(event)}
                        onClick={() => setSelected(event)}
                      >
                        <strong>{event.petName ?? '—'}</strong>
                        <span>{event.service}</span>
                        <small>
                          {timeOf(event.scheduledAt)} · {firstName(event.staffName) || '—'}
                        </small>
                      </button>
                    ))}
                    {viewMode === 'day' && (eventsByDay[index]?.length ?? 0) === 0 ? (
                      <EmptyState title="Nenhum atendimento neste dia." />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </section>

      {selected ? (
        <Modal
          eyebrow="AGENDAMENTO"
          title={selected.petName ?? 'Agendamento'}
          onClose={() => setSelected(null)}
          cancelLabel="Fechar"
        >
          <div className="modal-detail">
            <p><span>Tutor</span><strong>{selected.clientName ?? '—'}</strong></p>
            <p><span>Serviço</span><strong>{selected.service}</strong></p>
            <p><span>Horário</span><strong>{timeOf(selected.scheduledAt)} — {timeOf(selected.endTime)}</strong></p>
            <p><span>Profissional</span><strong>{selected.staffName ?? '—'}</strong></p>
            <p><span>Porte</span><strong>{sizeLabel(selected.petSize)}</strong></p>
            <p><span>Valor</span><strong>{money(selected.price, 0)}</strong></p>
            <p><span>Status</span><strong>{statusLabel(selected.status)}</strong></p>
          </div>
          <div className="modal-actions" style={{ borderTop: '1px solid #edf1ef', marginTop: 7, paddingTop: 16 }}>
            {selected.status !== 'IN_PROGRESS' && selected.status !== 'COMPLETED' ? (
              <button type="button" className="outline-button" onClick={() => changeStatus(selected, 'IN_PROGRESS')}>
                Iniciar atendimento
              </button>
            ) : null}
            {selected.status !== 'COMPLETED' ? (
              <button type="button" className="outline-button" onClick={() => changeStatus(selected, 'COMPLETED')}>
                Concluir
              </button>
            ) : null}
            <button type="button" className="outline-button danger" onClick={() => removeEvent(selected)}>
              Excluir
            </button>
          </div>
        </Modal>
      ) : null}

      {confirmElement}
    </>
  );
}
