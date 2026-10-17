import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon';
import Menu from '../../components/Menu';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import { useAuth } from '../../context/AuthContext';
import { useAppointmentModal } from '../../context/AppointmentModalContext';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfirm } from '../../hooks/useConfirm';
import { firstName, initials } from '../../lib/format';
import { appointmentPayload, money, sizeLabel, timeOf, toneFor } from '../../lib/presentation';

const COMBO_ICONS = ['paw', 'sparkles', 'services'];

function isoDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function longDateLabel(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  if (offset === 0) {
    return `Hoje, ${date.getDate()} de ${date.toLocaleDateString('pt-BR', { month: 'long' })}`;
  }
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: 'numeric', month: 'long' }).format(date);
}

export default function DashboardView() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const openNewAppointment = useAppointmentModal();
  const name = firstName(user?.name) || 'você';

  const [professional, setProfessional] = useState('Todos');
  const [dayOffset, setDayOffset] = useState(0);
  const [notice, setNotice] = useState(null);
  const { confirm, element: confirmElement } = useConfirm();

  const summary = useApi(() => api.dashboardSummary());
  const combos = useApi(() => api.combos());
  const team = useApi(() => api.team());

  const day = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + dayOffset);
    return date;
  }, [dayOffset]);

  const dayAppointments = useApi(() => {
    const from = `${isoDate(day)}T00:00:00`;
    const to = `${isoDate(day)}T23:59:59`;
    return api.appointments(from, to);
  }, [dayOffset]);

  const professionals = useMemo(
    () => [{ name: 'Todos', initials: '' }, ...(team.data ?? []).map((member) => ({
      name: member.name,
      short: firstName(member.name),
      initials: initials(member.name),
    }))],
    [team.data],
  );

  const visibleAppointments = useMemo(() => {
    const list = dayAppointments.data ?? [];
    if (professional === 'Todos') {
      return list;
    }
    const selected = professionals.find((person) => person.name === professional);
    return list.filter((item) => item.staffName === selected?.name);
  }, [dayAppointments.data, professional, professionals]);

  const today = summary.data;

  const eyebrowDate = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(new Date())
    .toUpperCase();

  const stats = [
    { label: 'Agendamentos hoje', value: today?.todayAppointments ?? '—', note: `${today?.pets ?? 0} pets · ${today?.clients ?? 0} clientes`, icon: 'calendar', tone: 'mint' },
    { label: 'Em atendimento', value: today?.inProgress ?? '—', note: 'em andamento agora', icon: 'clock', tone: 'lavender' },
    { label: 'Novos clientes', value: today?.newClientsThisMonth ?? '—', note: 'este mês', icon: 'pets', tone: 'peach' },
  ];

  const favoriteCombos = (combos.data ?? []).slice(0, 3);

  function refresh() {
    summary.reload();
    dayAppointments.reload();
  }

  async function changeStatus(item, status) {
    setNotice(null);
    try {
      await api.updateAppointment(item.id, appointmentPayload(item, { status }));
      refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  async function removeAppointment(item) {
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
      refresh();
    } catch (error) {
      setNotice(error.message);
    }
  }

  function appointmentActions(item) {
    return [
      { label: 'Ver agenda completa', icon: 'calendar', onClick: () => navigate('/agenda') },
      ...(item.status !== 'IN_PROGRESS'
        ? [{ label: 'Iniciar atendimento', icon: 'clock', onClick: () => changeStatus(item, 'IN_PROGRESS') }]
        : []),
      ...(item.status !== 'COMPLETED'
        ? [{ label: 'Marcar como concluído', icon: 'check', onClick: () => changeStatus(item, 'COMPLETED') }]
        : []),
      { separator: true },
      { label: 'Excluir', icon: 'trash', danger: true, onClick: () => removeAppointment(item) },
    ];
  }

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">{eyebrowDate}</p>
          <h1>Bom dia, {name}!</h1>
          <p className="subtitle">
            Você tem {today?.todayAppointments ?? 0} atendimentos hoje. Vamos cuidar de cada detalhe.
          </p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => openNewAppointment(refresh)}
        >
          <Icon name="plus" size={18} />
          Novo agendamento
        </button>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <div className={`stat-icon ${stat.tone}`}>
              <Icon name={stat.icon} size={20} />
            </div>
            <div>
              <span>{stat.label}</span>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </div>
          </div>
        ))}

        <div className="stat-card revenue">
          <div>
            <span>Faturamento do dia</span>
            <strong>{money(today?.revenueToday, 0)}</strong>
            <small>{today?.todayAppointments ?? 0} atendimentos hoje</small>
          </div>
          <div className="mini-chart">
            {Array.from({ length: 7 }).map((_, index) => (
              <i key={index} />
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="schedule-card">
          <div className="card-heading">
            <div>
              <h2>Agenda do dia</h2>
              <p>Acompanhe os atendimentos da equipe</p>
            </div>
            <div className="date-controls">
              <button aria-label="Dia anterior" onClick={() => setDayOffset((value) => value - 1)}>
                <Icon name="chevronLeft" size={17} />
              </button>
              <span>
                <Icon name="calendar" size={16} />
                {longDateLabel(dayOffset)}
              </span>
              <button aria-label="Próximo dia" onClick={() => setDayOffset((value) => value + 1)}>
                <Icon name="chevronRight" size={17} />
              </button>
            </div>
          </div>

          <div className="schedule-toolbar">
            <div className="professional-filter">
              {professionals.map((person) => (
                <button
                  key={person.name}
                  className={professional === person.name ? 'selected' : ''}
                  onClick={() => setProfessional(person.name)}
                >
                  {person.initials ? (
                    <span className={`avatar micro ${person.initials.toLowerCase()}`}>{person.initials}</span>
                  ) : null}
                  {person.short ?? person.name}
                </button>
              ))}
            </div>
            <button className="view-all" onClick={() => navigate('/agenda')}>
              Ver agenda completa <Icon name="chevronRight" size={15} />
            </button>
          </div>

          {notice ? <div className="auth-error" style={{ margin: '10px 18px' }}>{notice}</div> : null}

          {summary.loading || dayAppointments.loading ? (
            <Loading label="Carregando agenda..." />
          ) : summary.error || dayAppointments.error ? (
            <ErrorState
              error={summary.error || dayAppointments.error}
              onRetry={refresh}
            />
          ) : visibleAppointments.length === 0 ? (
            <EmptyState title="Nenhum atendimento neste dia." hint="Ajuste o filtro ou crie um novo agendamento." />
          ) : (
            <div className="schedule-list">
              {visibleAppointments.map((item, index) => (
                <article className="appointment" key={item.id}>
                  <div className="time">
                    <strong>{timeOf(item.scheduledAt)}</strong>
                    <span>{timeOf(item.endTime)}</span>
                  </div>
                  <div className={`appointment-stripe ${toneFor(index)}`}></div>
                  <div className={`pet-avatar ${toneFor(index)}`}>
                    <Icon name="paw" size={20} />
                  </div>
                  <div className="pet-info">
                    <strong>{item.petName ?? '—'}</strong>
                    <span>
                      {item.petBreed ?? '—'} · {sizeLabel(item.petSize)}
                    </span>
                  </div>
                  <div className="service-info">
                    <span>Serviço</span>
                    <strong>{item.service}</strong>
                  </div>
                  <div className="owner-info">
                    <span>Tutor</span>
                    <strong>{item.clientName ?? '—'}</strong>
                  </div>
                  <div className={`avatar staff ${initials(item.staffName).toLowerCase()}`}>
                    {initials(item.staffName)}
                  </div>
                  <Menu items={appointmentActions(item)} label={`Opções para ${item.petName ?? 'pet'}`} />
                </article>
              ))}
            </div>
          )}
        </section>

        <aside className="right-column">
          <section className="combos-card">
            <div className="card-heading compact">
              <div>
                <h2>Combos favoritos</h2>
                <p>Mais escolhidos este mês</p>
              </div>
              <Menu
                align="right"
                label="Opções dos combos"
                size={19}
                items={[
                  { label: 'Ver catálogo', icon: 'services', onClick: () => navigate('/servicos') },
                  { label: 'Criar novo combo', icon: 'plus', onClick: () => navigate('/servicos?novoCombo=1') },
                ]}
              />
            </div>
            {combos.loading ? (
              <Loading label="Carregando combos..." />
            ) : combos.error ? (
              <ErrorState error={combos.error} onRetry={combos.reload} />
            ) : favoriteCombos.length === 0 ? (
              <EmptyState title="Nenhum combo cadastrado." />
            ) : (
              <div className="combo-list">
                {favoriteCombos.map((combo, index) => (
                  <button className="combo-item" key={combo.id} onClick={() => navigate('/servicos')}>
                    <div className={`combo-icon ${toneFor(index)}`}>
                      <Icon name={COMBO_ICONS[index % COMBO_ICONS.length]} size={20} />
                    </div>
                    <div>
                      <strong>{combo.name}</strong>
                      <span>{combo.description}</span>
                      <small>a partir de {money(combo.priceFrom, 0)}</small>
                    </div>
                    <Icon name="chevronRight" size={16} />
                  </button>
                ))}
              </div>
            )}
            <button className="secondary-button" onClick={() => navigate('/servicos?novoCombo=1')}>
              <Icon name="plus" size={17} />
              Criar novo combo
            </button>
          </section>

          <section className="quick-card">
            <div className="quick-art">
              <div className="dog-face">
                <span className="ear left"></span>
                <span className="ear right"></span>
                <i></i>
                <b></b>
                <em></em>
              </div>
            </div>
            <div>
              <h3>Cadastro rapidinho</h3>
              <p>Adicione um novo pet e seu tutor em poucos passos.</p>
              <button onClick={() => navigate('/clientes?novo=1')}>
                Cadastrar cliente <Icon name="chevronRight" size={15} />
              </button>
            </div>
          </section>
        </aside>
      </div>

      {confirmElement}
    </>
  );
}
