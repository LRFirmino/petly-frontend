import React from 'react';
import Modal from './Modal';

export default function ConfirmDialog({ title, message, confirmLabel = 'Confirmar', onConfirm, onCancel }) {
  return (
    <Modal
      title={title}
      onClose={onCancel}
      cancelLabel="Cancelar"
      submitLabel={confirmLabel}
      danger
      onSubmit={(event) => {
        event.preventDefault();
        onConfirm();
      }}
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  );
}
