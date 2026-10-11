'use client';
import { money } from '@/lib/money.js';
import React from 'react';
import Link from 'next/link';
import { RadioCard } from '@/components/ui/RadioCard.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useStore } from './StoreProvider.jsx';
import { AddressBook } from './AddressBook.jsx';
import { DELIVERY } from '@/lib/delivery.js';
import { CartView } from './CartView.jsx';

const net = (p) => p.price * (1 - (p.discount || 0) / 100);

export function CheckoutView() {
  const { cartItems, cartReady, placing, placeOrder, user, flash } = useStore();
  const [delivery, setDelivery] = React.useState('standard');
  const [addresses, setAddresses] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState(null);
  const [ready, setReady] = React.useState(false);

  const onLoaded = React.useCallback((list) => {
    setAddresses(list);
    setReady(true);
    setSelectedId(prev => (list.some(a => a.id === prev) ? prev : (list.find(a => a.isDefault) || list[0] || {}).id ?? null));
  }, []);

  // Falling through to CartView before the catalogue loads would show
  // "your cart is empty" to someone who is mid-checkout.
  if (!cartReady) {
    return (
      <div className="container page">
        <h1 className="display-2 page__title">Review your order</h1>
        <p className="meta" role="status">Loading your order…</p>
      </div>
    );
  }
  if (cartItems.length === 0) return <CartView />;

  if (!user) {
    return (
      <div className="container auth">
        <div className="auth__head">
          <h1 className="display-2">Sign in to check out</h1>
          <p className="body">Your saved delivery addresses live in your account.</p>
        </div>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link href="/login" className="btn btn--lg">Sign in</Link>
        </div>
      </div>
    );
  }

  const subtotal = cartItems.reduce((s, i) => s + net(i.product) * i.qty, 0);
  const deliveryCost = DELIVERY[delivery].cost;
  const chosen = addresses.find(a => a.id === selectedId);

  const onConfirm = () => {
    if (!chosen) return;
    placeOrder({ address: chosen, addressId: chosen.id, delivery });
  };

  return (
    <div className="container page">
      <h1 className="display-2 page__title">Review your order</h1>

      <div className="split split--content">
        <div className="stack stack--lg">
          <section className="panel" aria-labelledby="addr-head">
            <AddressBook
              heading="Delivery address"
              headingId="addr-head"
              selectable
              selectedId={selectedId}
              onSelect={setSelectedId}
              onLoaded={onLoaded}
              flash={flash}
              emptyHint="No saved addresses yet — add the one you'd like this order delivered to."
            />
          </section>

          <section className="panel" aria-labelledby="ship-head">
            <h2 className="pdp__fact-label" id="ship-head" style={{ marginBottom: 'var(--space-4)' }}>Delivery method</h2>
            <div className="stack stack--sm">
              {Object.entries(DELIVERY).map(([key, d]) => (
                <RadioCard
                  key={key}
                  name="delivery"
                  label={d.label}
                  sublabel={`${d.detail} · ${money(d.cost)}`}
                  checked={delivery === key}
                  onChange={() => setDelivery(key)}
                />
              ))}
            </div>
          </section>
        </div>

        <aside className="panel summary" aria-labelledby="sum-head">
          {/* The one thing you cannot do from this page is change your mind
              about what is in the order. Reaching the cart meant the nav or
              the back button; the quantities are listed right here, so the way
              back to them belongs right here too. */}
          <div className="row row--between summary__head">
            <h2 className="display-3" id="sum-head">Summary</h2>
            <Link href="/cart" className="link-btn">Edit cart</Link>
          </div>

          <ul className="stack stack--sm list-reset">
            {cartItems.map(i => (
              <li key={i.product.id} className="summary__row" style={{ fontSize: 'var(--text-sm)' }}>
                <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {i.product.name} ×{i.qty}
                </span>
                <span className="summary__value">{money((net(i.product) * i.qty))}</span>
              </li>
            ))}
          </ul>

          <div className="stack stack--sm" style={{ marginTop: 'var(--space-5)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--border)' }}>
            <div className="summary__row"><span>Subtotal</span><span className="summary__value">{money(subtotal)}</span></div>
            <div className="summary__row"><span>{DELIVERY[delivery].label}</span><span className="summary__value">{money(deliveryCost)}</span></div>
          </div>

          <div className="summary__row summary__row--total">
            <span>Total</span><span className="summary__value">{money((subtotal + deliveryCost))}</span>
          </div>

          {/* Repeating the destination here means the last thing you read
              before committing is where it is actually going. */}
          {chosen && (
            <p className="meta" style={{ marginTop: 'var(--space-4)' }}>
              Delivering to <span style={{ color: 'var(--ink-body)' }}>{chosen.title} — {chosen.line}</span>
            </p>
          )}

          <div style={{ marginTop: 'var(--space-6)' }}>
            <Button variant="dark" fullWidth size="lg" disabled={!selectedId || placing} onClick={onConfirm}>
              {placing ? 'Placing order…' : 'Place order'}
            </Button>
          </div>

          {/* The button used to read "Confirm & Pay". Nothing in the order path
              takes a payment, so it promised something that does not happen. */}
          <p className="meta" style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
            No card is charged at this step. We&apos;ll email you a confirmation.
          </p>

          {!selectedId && ready && (
            <p className="meta" style={{ marginTop: 'var(--space-3)', textAlign: 'center' }}>
              {addresses.length ? 'Select a delivery address to continue.' : 'Add a delivery address to continue.'}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
