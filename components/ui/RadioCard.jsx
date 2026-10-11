'use client';
import React from 'react';

// A real radio input, visually hidden but still the thing being focused and
// announced — so arrow keys move between options as users expect.
export function RadioCard({ label, sublabel, checked, onChange, name }) {
  return (
    <label className={`choice${checked ? ' is-selected' : ''}`}>
      <input
        type="radio"
        name={name}
        checked={checked}
        onChange={onChange}
        className="visually-hidden"
      />
      <span className="choice__marker" aria-hidden="true" />
      <span style={{ minWidth: 0 }}>
        <span className="choice__title" style={{ display: 'block' }}>{label}</span>
        {sublabel && <span className="choice__sub" style={{ display: 'block' }}>{sublabel}</span>}
      </span>
    </label>
  );
}
