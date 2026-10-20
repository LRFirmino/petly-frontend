// Helpers de apresentação (não são dados de negócio).

export const TONES = ['mint', 'purple', 'orange', 'blue'];

export function toneFor(index) {
  return TONES[index % TONES.length];
}

const SIZE_LABELS = { SMALL: 'Pequeno', MEDIUM: 'Médio', LARGE: 'Grande' };

export function sizeLabel(size) {
  return SIZE_LABELS[size] ?? size ?? '—';
}

export const SIZE_KEYS = ['SMALL', 'MEDIUM', 'LARGE'];
export const SIZE_COLUMNS = ['Pequeno', 'Médio', 'Grande'];

const STATUS_LABELS = {
  SCHEDULED: 'Agendado',
  IN_PROGRESS: 'Em atendimento',
  COMPLETED: 'Concluído',
  CANCELLED: 'Cancelado',
};

export function statusLabel(status) {
  return STATUS_LABELS[status] ?? status ?? '—';
}

export function money(value, decimals = 0) {
  if (value === null || value === undefined) {
    return '—';
  }
  const formatted = Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `R$ ${formatted}`;
}

const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

export function shortDate(iso) {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_SHORT[date.getMonth()]}, ${date.getFullYear()}`;
}

export function timeOf(iso) {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// Converte um AppointmentDto na carga aceita por POST/PUT /appointments.
export function appointmentPayload(item, overrides = {}) {
  return {
    clientId: item.clientId,
    petId: item.petId,
    itemType: item.itemType ?? null,
    itemId: item.itemId ?? null,
    service: item.service,
    scheduledAt: item.scheduledAt,
    status: item.status,
    staffName: item.staffName,
    durationMinutes: item.durationMinutes,
    price: item.price,
    notes: item.notes,
    ...overrides,
  };
}
