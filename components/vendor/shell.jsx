'use client';
import React from 'react';
import { Icon } from '@/components/ui/Icon.jsx';
import { useEdgeFade } from '@/lib/useEdgeFade.js';
import { ThemeToggle } from '@/components/ui/ThemeToggle.jsx';

// Icons now match what they open. Dashboard was a star, Products a pencil and
// sign-out an "x" — arbitrary glyphs the eye has to learn rather than read.
const ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'products', label: 'Products', icon: 'package' },
  { id: 'orders', label: 'Orders', icon: 'cart' },
  { id: 'store', label: 'My store', icon: 'store' },
];

export function VendorSidebar({ tab, setTab, store, onSignOut }) {
  const [nav, fade] = useEdgeFade();
  return (
    <aside className="console__side">
      <div className="console__brand">
        <div>
          <div className="console__brand-row">
            <span className="console__wordmark">Armut</span>
            <span className="console__badge">Vendor</span>
          </div>
          {store?.name && <p className="console__who">{store.name}</p>}
        </div>
      </div>
      <nav className="console__nav" ref={nav} data-fade={fade} aria-label="Vendor sections">
        {ITEMS.map(it => {
          const active = tab === it.id || (tab === 'product-form' && it.id === 'products');
          return (
            <button
              key={it.id}
              type="button"
              className="console__link"
              aria-current={active ? 'page' : undefined}
              onClick={() => setTab(it.id)}
            >
              <Icon name={it.icon} size={17} />{it.label}
            </button>
          );
        })}
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

export function VendorPageTitle({ eyebrow, title, children }) {
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

// One pill vocabulary shared by both consoles: green for a good end state,
// clay for "needs attention", red for a failure, neutral for everything else.
const PILL = {
  Delivered: 'pill--ok', Active: 'pill--ok', VIP: 'pill--ok',
  Processing: 'pill--warn', Pending: 'pill--warn', 'Pending review': 'pill--warn',
  Cancelled: 'pill--risk', Suspended: 'pill--risk', Flagged: 'pill--risk', 'Out of stock': 'pill--risk',
};
export function VendorStatusPill({ status }) {
  return <span className={`pill ${PILL[status] ?? ''}`}>{status}</span>;
}

export function VendorField({ label, children, hint }) {
  const id = React.useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      {React.isValidElement(children) ? React.cloneElement(children, { id }) : children}
      {hint && <p className="meta">{hint}</p>}
    </div>
  );
}

export function VendorCard({ title, children, style, className = '' }) {
  return (
    <section className={`panel ${className}`.trim()} style={style}>
      {title && <h2 className="display-3" style={{ marginBottom: 'var(--space-5)' }}>{title}</h2>}
      {children}
    </section>
  );
}
