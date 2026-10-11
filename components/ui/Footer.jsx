'use client';
import React from 'react';
import Link from 'next/link';

const ROOMS = ['Living Room', 'Bedroom', 'Dining', 'Storage'];

// Everything here points somewhere real. The previous footer rendered
// "Delivery", "Returns", "Careers" and the rest as plain <p> styled to look
// like links — they were never clickable. Rather than ship eight dead ends or
// invent eight pages of filler, the shop and account columns link to routes
// that exist, and the delivery terms are stated as information.
export function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <span className="footer__brand">Armut</span>
            <p className="footer__blurb">
              Solid hardwood furniture, handcrafted in our İstanbul workshop and
              delivered and assembled anywhere in Türkiye.
            </p>
          </div>

          <div>
            <h2 className="footer__head">Shop</h2>
            <ul className="footer__list">
              {ROOMS.map(name => (
                <li key={name}>
                  <Link className="footer__link" href={`/category/${encodeURIComponent(name)}`}>{name}</Link>
                </li>
              ))}
              <li><Link className="footer__link" href="/category">All furniture</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="footer__head">Account</h2>
            <ul className="footer__list">
              <li><Link className="footer__link" href="/account">Your account</Link></li>
              <li><Link className="footer__link" href="/account">Orders &amp; addresses</Link></li>
              <li><Link className="footer__link" href="/cart">Cart</Link></li>
              <li><Link className="footer__link" href="/vendor">Sell on Armut</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="footer__head">Delivery</h2>
            <p className="footer__text">
              Standard delivery in 3–5 business days, express in 1–2.
              Assembly is included at your home, and returns are accepted
              within 30 days.
            </p>
            <p className="footer__text" style={{ marginTop: 'var(--space-4)' }}>
              <a className="footer__link" href="mailto:hello@armut.com">hello@armut.com</a>
            </p>
          </div>
        </div>

        <div className="footer__base">
          <span>© {new Date().getFullYear()} Armut. All rights reserved.</span>
          <span>İstanbul, Türkiye</span>
        </div>
      </div>
    </footer>
  );
}
