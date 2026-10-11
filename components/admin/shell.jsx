'use client';
import React from 'react';
import { Icon } from '@/components/ui/Icon.jsx';
import { useEdgeFade } from '@/lib/useEdgeFade.js';
import { ThemeToggle } from '@/components/ui/ThemeToggle.jsx';

// Products and Site Content both used the pencil icon, and Customers used a
// magnifying glass. Each section now has a glyph that matches what it opens.
const ITEMS = [
  { id: 'overview', label: 'Overview', icon: 'grid' },
  { id: 'vendors', label: 'Vendors', icon: 'store' },
  { id: 'products', label: 'Products', icon: 'package' },
  { id: 'orders', label: 'Orders', icon: 'cart' },
  { id: 'clients', label: 'Customers', icon: 'users' },
  { id: 'content', label: 'Site content', icon: 'image' },
  { id: 'account', label: 'Account', icon: 'user' },
];

export function AdminSidebar({ tab, setTab, onSignOut }) {
  const [nav, fade] = useEdgeFade();
  return (
    <aside className="console__side">
      <div className="console__brand">
        <div className="console__brand-row">
          <span className="console__wordmark">Armut</span>
          <span className="console__badge">Admin</span>
        </div>
      </div>
      <nav className="console__nav" ref={nav} data-fade={fade} aria-label="Admin sections">
        {ITEMS.map(it => (
          <button
            key={it.id}
            type="button"
            className="console__link"
            aria-current={tab === it.id ? 'page' : undefined}
            onClick={() => setTab(it.id)}
          >
            <Icon name={it.icon} size={17} />{it.label}
          </button>
        ))}
      </nav>
      <div className="console__foot console__foot--row">
        <button type="button" className="console__link" onClick={onSignOut} style={{ flex: 1 }}>
          <Icon name="log-out" size={17} />Sign out
        </button>
        <ThemeToggle />
      </div>
    </aside>
  );
}

export function PageTitle({ eyebrow, title, children }) {
  return (
    <div className="console__head">
      <div className="section-head__text">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display-2">{title}</h1>
      </div>
      {children}
    </div>
  );
}

const PILL = {
  Delivered: 'pill--ok', Active: 'pill--ok', VIP: 'pill--ok',
  Processing: 'pill--warn', Pending: 'pill--warn', 'Pending review': 'pill--warn',
  // "Out of stock" sat with Cancelled, Suspended and Flagged in red, which
  // read as though something were wrong with the listing. Selling out is a
  // normal — often good — commercial state that needs a restock, not a
  // policy decision. Amber, with the other things that need attention.
  Cancelled: 'pill--risk', Suspended: 'pill--risk', Flagged: 'pill--risk',
  'Out of stock': 'pill--warn',
};
export function StatusPill({ status }) {
  return <span className={`pill ${PILL[status] ?? ''}`}>{status}</span>;
}

export function AdminCard({ title, children, style, action, className = '' }) {
  const flush = className.includes('panel--flush');
  return (
    <section className={`panel ${className}`.trim()} style={style}>
      {(title || action) && (
        <div className={flush ? 'panel__head' : 'row row--between'} style={flush ? undefined : { marginBottom: 'var(--space-5)' }}>
          {title && <h2 className="display-3">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

// Wrapped so a wide table scrolls on a narrow screen instead of forcing the
// whole page sideways.
export function AdminTable({ columns, children, caption }) {
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

export const adminIconBtn = { background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--ink-500)', padding: 6, marginLeft: 2, verticalAlign: 'middle' };
