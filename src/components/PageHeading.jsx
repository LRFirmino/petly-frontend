import React from 'react';
import Icon from './Icon';

// Cabeçalho de página (eyebrow + título + descrição + ação) igual ao original.
export default function PageHeading({ eyebrow, title, description, action, onAction }) {
  return (
    <div className="welcome-row page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtitle">{description}</p>
      </div>
      {action ? (
        <button type="button" className="primary-button" onClick={onAction}>
          <Icon name="plus" size={18} />
          {action}
        </button>
      ) : null}
    </div>
  );
}
