import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

/**
 * Botão "…" com menu suspenso de ações.
 * items: [{ label, icon?, danger?, onClick }]
 */
export default function Menu({ items, label = 'Opções', align = 'right', size = 18, trigger = null }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    function handleDocumentClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        setOpen(false);
      }
    }
    function handleKey(event) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleDocumentClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocumentClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const visible = items.filter(Boolean);
  if (visible.length === 0) {
    return null;
  }

  const toggle = (event) => {
    event.stopPropagation();
    setOpen((value) => !value);
  };

  return (
    <div className="menu" ref={ref}>
      {trigger ? (
        React.cloneElement(trigger, {
          onClick: toggle,
          'aria-haspopup': 'menu',
          'aria-expanded': open,
        })
      ) : (
        <button
          type="button"
          className="more-button"
          aria-label={label}
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={toggle}
        >
          <Icon name="more" size={size} />
        </button>
      )}

      {open ? (
        <div className={`menu-popover ${align === 'left' ? 'left' : ''}`} role="menu">
          {visible.map((item, index) =>
            item.separator ? (
              <div className="menu-sep" key={`sep-${index}`} />
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                className={item.danger ? 'danger' : ''}
                onClick={(event) => {
                  event.stopPropagation();
                  setOpen(false);
                  item.onClick();
                }}
              >
                {item.icon ? <Icon name={item.icon} size={15} /> : null}
                {item.label}
              </button>
            ),
          )}
        </div>
      ) : null}
    </div>
  );
}
