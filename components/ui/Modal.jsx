'use client';
import React from 'react';
import { Icon } from './Icon.jsx';

// Escape closes, focus moves into the dialog on open and returns to whatever
// opened it on close, and Tab is kept inside while it is open.
export function Modal({ show, title, children, onClose }) {
  const ref = React.useRef(null);
  const restoreTo = React.useRef(null);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!show) return undefined;
    restoreTo.current = document.activeElement;

    const focusables = () => Array.from(
      ref.current?.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])') || []
    );
    (focusables()[0] || ref.current)?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose?.(); return; }
      if (e.key !== 'Tab') return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };

    document.addEventListener('keydown', onKeyDown);
    // Stop the page behind the dialog from scrolling.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
      if (restoreTo.current instanceof HTMLElement) restoreTo.current.focus();
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1}>
        <div className="row row--between" style={{ alignItems: 'flex-start', flexWrap: 'nowrap', marginBottom: 'var(--space-4)' }}>
          <h2 className="modal__title" id={titleId} style={{ marginBottom: 0 }}>{title}</h2>
          <button type="button" className="action action--quiet" onClick={onClose} aria-label="Close dialog" style={{ marginTop: 4 }}>
            <Icon name="x" size={18} aria-hidden="true" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
