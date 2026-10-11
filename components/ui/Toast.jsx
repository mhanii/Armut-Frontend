'use client';
import React from 'react';

// role="status" + aria-live makes the message reach screen readers; the region
// stays mounted so announcements are not missed when it appears.
export function Toast({ message, show, type = 'note' }) {
  return (
    <div role="status" aria-live="polite" aria-atomic="true">
      {show && (
        <div className={`toast${type === 'error' ? ' toast--error' : ''}`}>
          {message}
        </div>
      )}
    </div>
  );
}
