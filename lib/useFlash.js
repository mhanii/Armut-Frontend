'use client';
import React from 'react';

// Transient status messages. One timer per provider, so two messages in quick
// succession do not cut each other short, and nothing fires into an unmounted
// tree. 2.6s — shorter than about 2.5s and a short notice cannot reliably be
// read at a glance.
const DURATION = 2600;

export function useFlash() {
  const [toast, setToast] = React.useState(null);
  const timer = React.useRef(null);

  const flash = React.useCallback((message, type = 'success') => {
    setToast({ message, type });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), DURATION);
  }, []);

  React.useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  return [toast, flash];
}
