import React, { useMemo, useState } from 'react';
import Icon from '../../components/Icon';
import Menu from '../../components/Menu';
import Modal from '../../components/Modal';
import PageHeading from '../../components/PageHeading';
import { EmptyState, ErrorState, Loading } from '../../components/DataState';
import { api } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { useConfirm } from '../../hooks/useConfirm';
import { firstName, initials } from '../../lib/format';

const TEAM_TONES = ['am', 'ls', 'br'];
const EMPTY_FORM = { name: '', role: '', specialty: '', rating: '', dailyCapacity: 6 };

export default function TeamView() {
  const team = useApi(() => api.team());
  const members = team.data ?? [];

  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const { confirm, element: confirmElement } = useConfirm();

  const freeSlots = useMemo(
    () => members.reduce((total, member) => total + Math.max(0, (member.goal ?? 0) - member.todayCount), 0),
    [members],
  );

  function openCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setModal({ mode: 'create' });
  }

  function openEdit(member) {
    setForm({
      name: member.name ?? '',
      role: member.role ?? '',
      specialty: member.specialty ?? '',
      rating: member.rating ?? '',
      dailyCapacity: member.goal ?? 0,
    });
    setError(null);
    setModal({ mode: 'edit', member });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      role: form.role || null,
      specialty: form.specialty || null,
      rating: form.rating || null,
      dailyCapacity: form.dailyCapacity === '' ? null : Number(form.dailyCapacity),
    };
    try {
      if (modal.mode === 'create') {
        await api.createTeamMember(payload);
      } else {
        await api.updateTeamMember(modal.member.id, payload);
      }
      setModal(null);
      team.reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function remove(member) {
    const ok = await confirm({
      title: 'Remover profissional',
      message: `Remover ${member.name} da equipe? Esta ação não pode ser desfeita.`,
      confirmLabel: 'Remover',
    });
    if (!ok) {
      return;
    }
    try {
      await api.deleteTeamMember(member.id);
      team.reload();
    } catch (err) {
      setNotice(err.message);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow="PESSOAS E PERFORMANCE"
        title="Equipe"
        description="Gerencie profissionais, escalas e especialidades."
        action="Adicionar profissional"
        onAction={openCreate}
      />

      {notice ? <div className="auth-error">{notice}</div> : null}

      {team.loading ? (
        <Loading label="Carregando equipe..." />
      ) : team.error ? (
        <ErrorState error={team.error} onRetry={team.reload} />
      ) : members.length === 0 ? (
        <EmptyState title="Nenhum profissional cadastrado." hint="Adicione profissionais para montar a equipe." />
      ) : (
        <div className="team-layout">
          <div className="team-list">
            {members.map((member, index) => (
              <article className="team-card" key={member.id}>
                <div className={`avatar team-avatar ${TEAM_TONES[index % TEAM_TONES.length]}`}>
                  {initials(member.name)}
                </div>
                <div className="team-name">
                  <h2>{member.name}</h2>
                  <span>{member.role}</span>
                </div>
                <Menu
                  label={`Opções para ${member.name}`}
                  items={[
                    { label: 'Editar', icon: 'pencil', onClick: () => openEdit(member) },
                    { separator: true },
                    { label: 'Remover', icon: 'trash', danger: true, onClick: () => remove(member) },
                  ]}
                />

                <div className="team-metrics">
                  <div>
                    <span>Hoje</span>
                    <strong>{member.todayCount} atend.</strong>
                  </div>
                  <div>
                    <span>Avaliação</span>
                    <strong>{member.rating ?? '—'}</strong>
                  </div>
                </div>

                <div className="specialty">
                  <Icon name="sparkles" size={14} />
                  <strong>{member.specialty ?? '—'}</strong>
                </div>

                <div className="availability">
                  <span>
                    <i></i>Disponível hoje
                  </span>
                  <button onClick={() => openEdit(member)}>Editar escala</button>
                </div>
              </article>
            ))}
          </div>

          <section className="capacity-card workspace-card">
            <div className="card-heading">
              <div>
                <h2>Capacidade de hoje</h2>
                <p>Ocupação por profissional</p>
              </div>
            </div>

            {members.map((member, index) => (
              <div className="capacity-row" key={member.id}>
                <div>
                  <span className={`avatar micro ${TEAM_TONES[index % TEAM_TONES.length]}`}>
                    {initials(member.name)}
                  </span>
                  <strong>{firstName(member.name)}</strong>
                  <small>
                    {member.todayCount} de {member.goal} horários
                  </small>
                </div>
                <div className="progress">
                  <i style={{ width: `${Math.min(100, member.capacityPct)}%` }} />
                </div>
                <b>{member.capacityPct}%</b>
              </div>
            ))}

            <div className="capacity-note">
              <Icon name="clock" size={18} />
              <div>
                <strong>{freeSlots} horários livres</strong>
                <span>Você ainda pode receber agendamentos hoje.</span>
              </div>
            </div>
          </section>
        </div>
      )}

      {modal ? (
        <Modal
          eyebrow="EQUIPE"
          title={modal.mode === 'create' ? 'Adicionar profissional' : 'Editar profissional'}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
          submitLabel={modal.mode === 'create' ? 'Adicionar' : 'Salvar alterações'}
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
          <div className="form-row">
            <label>
              Cargo
              <input
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value })}
                placeholder="Ex.: Groomer sênior"
              />
            </label>
            <label>
              Avaliação
              <input
                value={form.rating}
                onChange={(event) => setForm({ ...form, rating: event.target.value })}
                placeholder="Ex.: 4,9"
              />
            </label>
          </div>
          <label>
            Especialidade
            <input
              value={form.specialty}
              onChange={(event) => setForm({ ...form, specialty: event.target.value })}
              placeholder="Ex.: Tosas especiais"
            />
          </label>
          <label>
            Capacidade diária (horários)
            <input
              type="number"
              min="0"
              value={form.dailyCapacity}
              onChange={(event) => setForm({ ...form, dailyCapacity: event.target.value })}
            />
          </label>
        </Modal>
      ) : null}

      {confirmElement}
    </>
  );
}
