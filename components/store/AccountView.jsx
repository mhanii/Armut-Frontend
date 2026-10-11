'use client';
import { fmtDate } from '@/lib/date.js';
import { money } from '@/lib/money.js';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button.jsx';
import { Icon } from '@/components/ui/Icon.jsx';
import { api } from '@/lib/api.js';
import { useStore } from './StoreProvider.jsx';
import { AddressBook } from './AddressBook.jsx';

export const STATUS_PILL = {
  Processing: 'pill--warn',
  Shipped: '',
  Delivered: 'pill--ok',
  Cancelled: 'pill--risk',
};

function OrderHistory() {
  const [orders, setOrders] = React.useState(null);
  const [error, setError] = React.useState(null);
  const [open, setOpen] = React.useState(null);

  const load = React.useCallback(() => {
    setError(null);
    api.store.getOrders().then(({ orders: list }) => setOrders(list)).catch(err => { setOrders([]); setError(err); });
  }, []);
  React.useEffect(() => { load(); }, [load]);

  if (orders === null) return <p className="meta">Loading your orders…</p>;

  if (error) {
    return (
      <div className="note">
        <p className="field__error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>{error.message}</p>
        <Button variant="ghost" size="sm" onClick={load}>Try again</Button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="stack">
        <p className="meta">You haven&apos;t placed an order yet.</p>
        <div><Link href="/category" className="btn btn--outline btn--sm">Browse furniture</Link></div>
      </div>
    );
  }

  return (
    <ul className="stack stack--sm list-reset">
      {orders.map(o => {
        const isOpen = open === o.id;
        const panelId = `order-${o.id}`;
        return (
          <li key={o.id} className="order">
            <button
              type="button"
              className="order__head"
              onClick={() => setOpen(isOpen ? null : o.id)}
              aria-expanded={isOpen}
              aria-controls={panelId}
            >
              {/* Three groups rather than two, so the narrow layout can put the
                  chevron beside the title and drop the status and total onto
                  their own line. As one nowrap row they had about 280px to
                  share on a phone, and "Order #1043" wrapped mid-number. */}
              <span className="order__title">
                <span className="order__id">Order #{o.id}</span>
                <span className="meta" style={{ display: 'block', marginTop: 2 }}>
                  {fmtDate(o.date)}{o.vendor ? ` · ${o.vendor}` : ''}
                </span>
              </span>
              <span className="order__state">
                <span className={`pill ${STATUS_PILL[o.status] ?? ''}`}>{o.status}</span>
                <span className="summary__value">{money(o.total)}</span>
              </span>
              <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} aria-hidden="true"
                className="order__chev" />
            </button>
            {isOpen && (
              <div className="order__body" id={panelId}>
                <ul className="list-reset">
                  {(o.items || []).map((it, i) => (
                    <li key={i} className="summary__row" style={{ padding: 'var(--space-3) 0', fontSize: 'var(--text-sm)' }}>
                      <span>{it.name} × {it.qty}</span>
                      <span className="summary__value">{money((it.price * it.qty))}</span>
                    </li>
                  ))}
                </ul>
                <p className="meta" style={{ marginTop: 'var(--space-3)' }}>
                  Delivering to <span style={{ color: 'var(--ink-body)' }}>{o.address || '—'}</span>
                  {o.deliveryMethod && <> · {o.deliveryMethod === 'express' ? 'Express' : 'Standard'} delivery</>}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export function AccountView() {
  const router = useRouter();
  const { user, signOut, flash } = useStore();
  const [checked, setChecked] = React.useState(false);

  // `user` hydrates after mount, so wait a tick before deciding it is missing.
  React.useEffect(() => { setChecked(true); }, []);

  if (!user) {
    if (!checked) {
      return (
        <div className="container auth">
          <div className="auth__head"><h1 className="display-2">Your account</h1></div>
        </div>
      );
    }
    return (
      <div className="container auth">
        <div className="auth__head">
          <h1 className="display-2">Sign in to your account</h1>
          <p className="body">Manage your delivery addresses and review past orders.</p>
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link href="/login" className="btn btn--lg">Sign in</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <div className="section-head">
        <div className="section-head__text">
          <p className="eyebrow">Your account</p>
          <h1 className="display-2">Hello, {user.name}</h1>
          {user.email && <p className="meta">{user.email}</p>}
        </div>
        <Button variant="outline" onClick={() => { signOut(); router.push('/'); }}>Sign out</Button>
      </div>

      {/* Orders lead. Almost nobody opens an account page to edit an address —
          they open it to find out where their order is, which is also where
          "View your orders" on the confirmation page sends them, and what the
          footer link has always called this: "Orders & addresses". Addresses
          were first in the DOM, so on a phone, where the columns stack, they
          were the whole first screen. Orders take the wider column too: an
          order row carries a number, a date, a workshop, a status and a total;
          an address is two short lines. */}
      <div className="split split--content">
        <section className="panel" aria-labelledby="orders-head">
          <h2 className="pdp__fact-label" id="orders-head" style={{ marginBottom: 'var(--space-4)' }}>Order history</h2>
          <OrderHistory />
        </section>
        <section className="panel" aria-labelledby="addr-head">
          <AddressBook
            heading="Delivery addresses"
            headingId="addr-head"
            flash={flash}
            emptyHint="No saved addresses yet — add one and it will be ready at checkout."
          />
        </section>
      </div>
    </div>
  );
}
