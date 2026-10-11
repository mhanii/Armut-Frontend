'use client';
import { STATUS_PILL } from './AccountView.jsx';
import { money } from '@/lib/money.js';
import React from 'react';
import Link from 'next/link';
import { api } from '@/lib/api.js';
import { deliveryOf } from '@/lib/delivery.js';
import { useStore } from './StoreProvider.jsx';

// A cart is split into one order per workshop, because each ships on its own
// schedule. The confirmation used to be a modal showing the first order's id
// beside the combined total — two numbers that did not belong to each other,
// and no mention that a second order existed at all.
export function OrderConfirmation({ ids }) {
  const { user } = useStore();
  const [orders, setOrders] = React.useState(null);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!user || !ids.length) return;
    let alive = true;
    api.store.getOrders()
      // getOrders is newest-first, which puts the second half of a split
      // order above the first. Here they are one purchase, so they read in
      // the order they were created — and in the order the URL lists them.
      .then(r => { if (alive) setOrders((r.orders || []).filter(o => ids.includes(o.id)).sort((a, b) => a.id - b.id)); })
      .catch(e => { if (alive) setError(e); });
    return () => { alive = false; };
  }, [user, ids]);

  if (!ids.length) {
    return (
      <div className="container page">
        <h1 className="display-2 page__title">Your order</h1>
        <p className="lede">We could not tell which order this was.</p>
        <p style={{ marginTop: 'var(--space-6)' }}><Link href="/account" className="btn">View your orders</Link></p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container page">
        <h1 className="display-2 page__title">Your order</h1>
        <p className="lede">Sign in to see the details of this order.</p>
        <p style={{ marginTop: 'var(--space-6)' }}><Link href="/login" className="btn">Sign in</Link></p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container page">
        <h1 className="display-2 page__title">Your order</h1>
        <div className="alert alert--error" role="alert">{error.message}</div>
        <p style={{ marginTop: 'var(--space-6)' }}><Link href="/account" className="btn">View your orders</Link></p>
      </div>
    );
  }

  if (orders === null) {
    return (
      <div className="container page">
        <h1 className="display-2 page__title">Order confirmed</h1>
        <p className="meta" role="status">Loading your order…</p>
      </div>
    );
  }

  // Nothing matched this customer's history: someone else's link, a typo, or
  // an order still settling. Thanking them and promising an email would be a
  // claim this page cannot back.
  if (orders.length === 0) {
    return (
      <div className="container page">
        <h1 className="display-2 page__title">Your order</h1>
        <p className="lede">This order is not in your history. If you have just placed it, give it a moment and reload.</p>
        <p style={{ marginTop: 'var(--space-6)' }}><Link href="/account" className="btn">View your orders</Link></p>
      </div>
    );
  }

  const first = orders[0];
  const method = deliveryOf(first?.deliveryMethod);
  const goods = orders.reduce((s, o) => s + o.total, 0);
  const split = orders.length > 1;

  return (
    <div className="container page">
      <div className="container--prose stack stack--lg" style={{ marginInline: 'auto' }}>
        <div className="stack stack--sm">
          <p className="eyebrow">Thank you{user.name ? `, ${user.name}` : ''}</p>
          <h1 className="display-1">Order confirmed</h1>
          <p className="lede">
            {split
              ? `Your pieces come from ${orders.length} workshops, so they were placed as ${orders.length} orders — each one ships on its own schedule.`
              : orders.every(o => o.status === 'Processing')
                ? 'A confirmation is on its way to your email. We will let you know as soon as it ships.'
                : 'A confirmation was sent to your email.'}
          </p>
        </div>

        <ul className="stack stack--sm list-reset">
            {orders.map(o => (
              <li key={o.id} className="panel confirm__order">
                <div className="row row--between confirm__head">
                  <span>
                    <span className="order__id">Order #{o.id}</span>
                    {o.vendor && <span className="meta" style={{ display: 'block', marginTop: 2 }}>{o.vendor}</span>}
                  </span>
                  <span className={`pill ${STATUS_PILL[o.status] ?? ''}`}>{o.status}</span>
                </div>
                <ul className="list-reset">
                  {(o.items || []).map((it, i) => (
                    <li key={i} className="summary__row" style={{ padding: 'var(--space-2) 0', fontSize: 'var(--text-sm)' }}>
                      <span>{it.name} × {it.qty}</span>
                      <span className="summary__value">{money((it.price * it.qty))}</span>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>

        {first && (
          <div className="panel confirm__totals">
            <div className="summary__row"><span>{split ? 'Items across all orders' : 'Items'}</span><span className="summary__value">{money(goods)}</span></div>
            {/* Delivery is charged once for the whole basket, not per workshop. */}
            <div className="summary__row"><span>{method.label}</span><span className="summary__value">{money(method.cost)}</span></div>
            <div className="summary__row summary__row--total">
              <span>Total</span><span className="summary__value">{money((goods + method.cost))}</span>
            </div>
            <p className="meta" style={{ marginTop: 'var(--space-4)' }}>
              {first.address
                ? <>Delivering to <span style={{ color: 'var(--ink-body)' }}>{first.address}</span> · {method.detail}</>
                : method.detail}
            </p>
          </div>
        )}

        <div className="row">
          <Link href="/account" className="btn btn--lg">View your orders</Link>
          <Link href="/category" className="btn btn--outline btn--lg">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
}
