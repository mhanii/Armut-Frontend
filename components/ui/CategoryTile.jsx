'use client';
import React from 'react';
import Link from 'next/link';
import { Thumb } from './Thumb.jsx';

export function CategoryTile({ name, image, href }) {
  const to = href || `/category/${encodeURIComponent(name)}`;
  return (
    <Link href={to} className="tile">
      <Thumb className="tile__img" src={image} alt="" loading="lazy"
        slot={320} sizes="(max-width: 34rem) 50vw, 20rem"
        fallbackClassName="card__empty tile__empty" />
      <span className="tile__scrim" aria-hidden="true" />
      <span className="tile__label">
        <h3 className="tile__name">{name}</h3>
        <span className="tile__arrow" aria-hidden="true">&rarr;</span>
      </span>
    </Link>
  );
}
