'use client';
import { money } from '@/lib/money.js';
import React from 'react';
import Link from 'next/link';
import { Icon } from './Icon.jsx';
import { Thumb } from './Thumb.jsx';

// A real anchor, so the card is keyboard-reachable and supports middle-click,
// cmd-click and "open in new tab" the way shoppers expect of a product grid.
export function ProductCard({ product, href }) {
  const { id, name, price, discount = 0, rating = 0, reviewCount = 0, image, category, stock } = product;
  const finalPrice = discount > 0 ? price * (1 - discount / 100) : price;
  const to = href || `/product/${id}`;

  // The detail page has said "Out of stock" and "Only 3 left" since it was
  // written; the grid said nothing, so a shopper browsed, chose, clicked, and
  // only then found out the piece was unavailable. Availability belongs at the
  // point of choosing, not after it.
  const soldOut = stock != null && stock <= 0;
  const low = !soldOut && stock != null && stock <= 3;

  return (
    <Link href={to} className={`card${soldOut ? ' card--out' : ''}`}>
      <div className="card__media">
        <Thumb className="card__img" src={image} alt={name} loading="lazy"
          slot={320} sizes="(max-width: 34rem) 50vw, 20rem" />
        {/* A discount on something you cannot buy is not news. One flag. */}
        {soldOut
          ? <span className="card__flag card__flag--out">Sold out</span>
          : discount > 0 && <span className="card__flag">{discount}% off</span>}
      </div>
      <div className="card__body">
        {category && <p className="card__cat">{category}</p>}
        <div className="card__line">
          <h3 className="card__name">{name}</h3>
          <span className="card__price">
            {discount > 0 && <span className="card__was">{money(price)}</span>}
            <span className="card__now">{money(finalPrice)}</span>
          </span>
        </div>
        {/* Scarcity belongs next to the price, which is the number it
            qualifies. Putting it on the rating line worked at desktop widths
            and wrapped at phone widths, and a wrapped line is taller — which
            broke the very row alignment the pinned rating exists to keep. */}
        {low && <p className="card__stock">Only {stock} left</p>}
        <p className="rating card__rating">
          <Icon name="star" size={13} aria-hidden="true" />
          <span className="rating__text">
            {reviewCount > 0 ? `${rating} · ${reviewCount} review${reviewCount === 1 ? '' : 's'}` : 'New'}
          </span>
        </p>
      </div>
    </Link>
  );
}
