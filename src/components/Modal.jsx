import React from 'react';
import Icon from './Icon';

/**
 * Modal genérico (reaproveita o visual .modal / .modal-backdrop).
 * - Com `onSubmit`: renderiza o botão primário de confirmação.
 * - Sem `onSubmit`: apenas o botão secundário (ex.: "Fechar").
 */
export default function Modal({
  eyebrow,
  title,
  onClose,
  onSubmit,
  submitLabel = 'Salvar',
  cancelLabel = 'Cancelar',
  submitting = false,
  error = null,
  danger = false,
  children,
}) {
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
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
            <h2 id="modal-title">{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar">
            <Icon name="close" size={18} />
          </button>
        </div>

        <form onSubmit={onSubmit ?? ((event) => event.preventDefault())}>
          {children}
          {error ? <div className="auth-error">{error}</div> : null}
          <div className="modal-actions">
            <button type="button" onClick={onClose}>
              {cancelLabel}
            </button>
            {onSubmit ? (
              <button type="submit" className={`primary-button ${danger ? 'danger' : ''}`} disabled={submitting}>
                {submitting ? 'Salvando...' : submitLabel}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </div>
  );
}
