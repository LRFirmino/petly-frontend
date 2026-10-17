import React, { useCallback, useRef, useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

/**
 * Confirmação assíncrona com modal estilizado:
 *   const { confirm, element } = useConfirm();
 *   if (await confirm({ title, message, confirmLabel })) { ... }
 *   return <>{...}{element}</>;
 */
export function useConfirm() {
  const [options, setOptions] = useState(null);
  const resolverRef = useRef(null);

  const confirm = useCallback(
    (opts) =>
      new Promise((resolve) => {
        resolverRef.current = resolve;
        setOptions(opts);
      }),
    [],
  );

  const finish = (result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
    }
    resolverRef.current = null;
    setOptions(null);
  };

  const element = options ? (
    <ConfirmDialog
      title={options.title}
      message={options.message}
      confirmLabel={options.confirmLabel}
      onConfirm={() => finish(true)}
      onCancel={() => finish(false)}
    />
  ) : null;

  return { confirm, element };
}
