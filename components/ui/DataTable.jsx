'use client';
import React from 'react';
import { Thumb } from './Thumb.jsx';

// One table for both consoles. Wrapped in a scroll container so a wide table
// scrolls itself on a narrow screen rather than stretching the page.
export function DataTable({ columns, children, caption }) {
  return (
    <div className="table-wrap">
      <table className="table">
        {caption && <caption className="visually-hidden">{caption}</caption>}
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th key={i} scope="col" className={c.align === 'right' ? 'num' : undefined}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

// A stat that is also a way in. A dashboard number you cannot act on is
// decoration; when `onClick` is given the tile becomes a button that takes you
// to the thing it is counting.
export function StatTile({ label, value, note, onClick }) {
  // Two of the four tiles on the admin overview are buttons and two are not,
  // and they were indistinguishable until hover — which does not exist on a
  // phone. The arrow is the only thing that says "this one goes somewhere".
  const body = (
    <>
      <p className="stat__label">{label}</p>
      <p className="stat__value">{value}</p>
      {note && (
        <p className="stat__note">
          {note}
          {onClick && <span className="stat__go" aria-hidden="true">&rarr;</span>}
        </p>
      )}
    </>
  );
  if (!onClick) return <div className="stat">{body}</div>;
  return (
    <button type="button" className="stat stat--action" onClick={onClick}>
      {body}
    </button>
  );
}

// Small product cell: thumbnail + name, with a placeholder when a listing has
// no image yet (Drafts are allowed to have none).
export function ThingCell({ image, name, sub }) {
  return (
    <div className="thing">
      <Thumb className="thing__img" src={image} alt="" loading="lazy" slot={40}
        fallbackClassName="thing__img thing__img--empty" fallback="" />
      <span style={{ minWidth: 0 }}>
        <span className="thing__name">{name}</span>
        {sub && <span className="meta" style={{ display: 'block' }}>{sub}</span>}
      </span>
    </div>
  );
}
