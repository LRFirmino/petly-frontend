import React from 'react';
import Icon from './Icon';

export function Loading({ label = 'Carregando...' }) {
  return (
    <div className="data-state">
      <Icon name="loader" size={22} className="data-spin" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, message = 'Não foi possível carregar os dados.' }) {
  return (
    <div className="data-state error">
      <strong>{message}</strong>
      <span>{error?.message}</span>
      {onRetry ? (
        <button type="button" onClick={onRetry}>
          Tentar de novo
        </button>
      ) : null}
    </div>
  );
}

export function EmptyState({ title = 'Nada por aqui ainda.', hint }) {
  return (
    <div className="data-state">
      <strong>{title}</strong>
      {hint ? <span>{hint}</span> : null}
    </div>
  );
}
