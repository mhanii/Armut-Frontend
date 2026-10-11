'use client';
import { money } from '@/lib/money.js';
import React from 'react';
import Link from 'next/link';
import { Icon } from '@/components/ui/Icon.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { useStore } from './StoreProvider.jsx';

const net = (p) => p.price * (1 - (p.discount || 0) / 100);

export function CartView() {
  const { cartItems, unavailable, overStock, cartReady, catalogError, loadCatalog, updateQty, removeUnavailable, capQuantities, goCheckout } = useStore();
  const subtotal = cartItems.reduce((s, i) => s + net(i.product) * i.qty, 0);
  const count = cartItems.reduce((s, i) => s + i.qty, 0);

  // "Empty" and "still loading the catalogue" used to look identical, so a
  // reload on this page flashed "your cart is empty" before the items arrived.
  if (!cartReady) {
    return (
      <div className="container page">
        <h1 className="display-2 page__title">Your cart</h1>
        <p className="meta" role="status">Loading your cart…</p>
      </div>
    );
  }

  // A cart whose catalogue never arrived cannot say what is in it, and must
  // not pretend the cart is empty.
  if (catalogError && cartItems.length === 0) {
    return (
      <div className="container page">
        <h1 className="display-2 page__title">Your cart</h1>
        <div className="panel" style={{ textAlign: 'center', padding: 'clamp(3rem, 8vw, 4.5rem)' }}>
          <p className="lede" style={{ margin: '0 auto var(--space-4)' }} role="alert">
            We couldn&apos;t load your cart just now.
          </p>
          <p className="meta" style={{ marginBottom: 'var(--space-6)' }}>
            Nothing has been lost — your items are still saved on this device.
          </p>
          <Button variant="dark" onClick={() => loadCatalog?.()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (cartItems.length === 0 && unavailable.length === 0) {
    return (
      <div className="container page">
        <h1 className="display-2 page__title">Your cart</h1>
        <div className="panel" style={{ textAlign: 'center', padding: 'clamp(3rem, 8vw, 4.5rem)' }}>
          <p className="lede" style={{ margin: '0 auto var(--space-6)' }}>Your cart is empty.</p>
          <Link href="/category" className="btn">Continue shopping</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <h1 className="display-2 page__title">Your cart</h1>

      {/* Lines whose product has gone are shown and explained. They used to be
          filtered out silently, so the total changed for no visible reason. */}
      {unavailable.length > 0 && (
        <div className="alert alert--error" role="status" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="row row--between">
            <span>
              {unavailable.length === 1
                ? 'One item in your cart is no longer available and has not been counted in the total.'
                : `${unavailable.length} items in your cart are no longer available and have not been counted in the total.`}
            </span>
            <button type="button" className="action" onClick={removeUnavailable}>Remove them</button>
          </div>
        </div>
      )}

      {overStock.length > 0 && (
        <div className="alert alert--warn" role="status" style={{ marginBottom: 'var(--space-5)' }}>
          <div className="row row--between">
            <span>
              {overStock.length === 1
                ? `We have fewer of “${overStock[0].product.name}” than your cart asks for.`
                : `${overStock.length} items in your cart ask for more than we have in stock.`}
            </span>
            <button type="button" className="action" onClick={capQuantities}>Update quantities</button>
          </div>
        </div>
      )}

      <div className="split split--content">
        <div className="panel">
          <ul className="list-reset">
            {cartItems.map(({ product, qty }) => {
              const unit = net(product);
              // The provider caps quantity at stock; the control has to say so,
              // or the plus button just stops responding for no stated reason.
              const max = typeof product.stock === 'number' ? product.stock : Infinity;
              const atMax = qty >= max;
              return (
                <li key={product.id} className="line">
                  {/* The picture is how people recognise the line; it should
                      go where the name goes. aria-hidden + tabIndex -1 keeps it
                      out of the tab order as a duplicate of the name link. */}
                  {product.image
                    ? (
                      <Link href={`/product/${product.id}`} className="line__media-link" aria-hidden="true" tabIndex={-1}>
                        <img className="line__media" src={product.image} alt="" loading="lazy" />
                      </Link>
                    )
                    : <span className="line__media" aria-hidden="true" />}
                  <div className="line__info">
                    <p className="line__name">
                      <Link href={`/product/${product.id}`}>{product.name}</Link>
                    </p>
                    <p className="meta">{money(unit)} each</p>
                    {atMax && Number.isFinite(max) && (
                      <p className="line__note">{max === 1 ? 'Last one in stock' : `Only ${max} in stock`}</p>
                    )}
                  </div>
                  <div className="line__controls">
                    <div className="stepper">
                      {/* Decrementing from 1 used to delete the line silently.
                          Removal is now only ever the explicit remove button. */}
                      <button
                        type="button" className="stepper__btn"
                        onClick={() => updateQty(product.id, qty - 1)}
                        disabled={qty <= 1}
                        aria-label={`Decrease quantity of ${product.name}`}
                      >
                        <Icon name="minus" size={13} aria-hidden="true" />
                      </button>
                      <span className="stepper__value" aria-live="polite" aria-label={`Quantity: ${qty}`}>{qty}</span>
                      <button
                        type="button" className="stepper__btn"
                        onClick={() => updateQty(product.id, qty + 1)}
                        disabled={atMax}
                        aria-label={`Increase quantity of ${product.name}`}
                      >
                        <Icon name="plus" size={13} aria-hidden="true" />
                      </button>
                    </div>
                    <span className="line__total">{money((unit * qty))}</span>
                    <button
                      type="button" className="icon-action"
                      onClick={() => updateQty(product.id, 0)}
                      aria-label={`Remove ${product.name} from your cart`}
                    >
                      <Icon name="trash" size={16} aria-hidden="true" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="panel summary" aria-label="Order summary">
          <h2 className="display-3" style={{ marginBottom: 'var(--space-5)' }}>Summary</h2>
          <div className="stack stack--sm">
            <div className="summary__row">
              <span>Subtotal ({count} {count === 1 ? 'item' : 'items'})</span>
              <span className="summary__value">{money(subtotal)}</span>
            </div>
          </div>
          <p className="meta" style={{ margin: 'var(--space-4) 0 var(--space-6)' }}>
            Delivery is calculated at checkout. Assembly is included.
          </p>
          <Button variant="dark" fullWidth size="lg" onClick={goCheckout}>Proceed to checkout</Button>
          <p style={{ textAlign: 'center', marginTop: 'var(--space-4)' }}>
            <Link href="/category" className="link-btn">Continue shopping</Link>
          </p>
        </aside>
      </div>
    </div>
  );
}
