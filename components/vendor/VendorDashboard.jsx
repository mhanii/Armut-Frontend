'use client';
import { money } from '@/lib/money.js';
import React from 'react';
import { Icon } from '@/components/ui/Icon.jsx';
import { DataTable, StatTile, ThingCell } from '@/components/ui/DataTable.jsx';
import { VendorPageTitle, VendorCard, VendorStatusPill } from './shell.jsx';

const LOW_STOCK = 5;

export function VendorDashboard({ products, orders, storeStatus, onGoTo }) {
  const totalSales = orders.reduce((s, o) => s + o.total, 0);
  const toFulfil = orders.filter(o => o.status === 'Processing');
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= LOW_STOCK);
  const outOfStock = products.filter(p => p.stock <= 0);
  // Live means a shopper can find it: published, not held for review or
  // flagged, from a store an admin has approved. Counting everything but
  // drafts called flagged listings live.
  const pendingApproval = storeStatus === 'Pending';
  const live = pendingApproval ? [] : products.filter(p => p.status === 'Active' || p.status === 'Out of stock');

  return (
    <div className="stack stack--lg">
      <VendorPageTitle eyebrow="Store overview" title="Dashboard" />

      {pendingApproval && (
        <div className="alert alert--warn" role="status">
          Your store is awaiting approval. Your listings go on sale once an admin approves it.
        </div>
      )}

      {/* The two tiles that represent work are clickable and say what the
          number means. A count you cannot act on is decoration. */}
      <div className="grid grid--stats">
        <StatTile
          label="Orders to fulfil"
          value={toFulfil.length}
          note={toFulfil.length ? 'Waiting to be shipped' : 'Nothing waiting'}
          onClick={toFulfil.length ? () => onGoTo?.('orders', 'todo') : undefined}
        />
        <StatTile
          label="Needs restocking"
          value={lowStock.length + outOfStock.length}
          note={outOfStock.length ? `${outOfStock.length} out of stock` : (lowStock.length ? `${LOW_STOCK} or fewer left` : 'All healthy')}
          onClick={(lowStock.length + outOfStock.length) ? () => onGoTo?.('products') : undefined}
        />
        <StatTile label="Live listings" value={live.length} note={`${products.length} total`} />
        <StatTile label="Total sales" value={`${money(totalSales)}`} note={`${orders.length} order${orders.length === 1 ? '' : 's'}`} />
      </div>

      <VendorCard className="panel--flush">
        <div className="panel__head"><h2 className="display-3">Product performance</h2></div>
        {products.length === 0 ? (
          <p className="empty">No listings yet. Add your first product to see it here.</p>
        ) : (
          <DataTable
            caption="Your products, with stock, rating and status"
            columns={[
              { label: 'Product' }, { label: 'Category' },
              { label: 'Stock', align: 'right' }, { label: 'Rating', align: 'right' },
              { label: 'Price', align: 'right' }, { label: 'Status', align: 'right' },
            ]}
          >
            {products.map(p => {
              const low = p.stock <= LOW_STOCK;
              return (
                <tr key={p.id}>
                  <td><ThingCell image={(p.photos && p.photos[0]) || null} name={p.name} /></td>
                  <td>{p.category}</td>
                  {/* Low stock is called out in words as well as colour, so it
                      still reads for anyone who cannot distinguish the red. */}
                  <td className="num" style={low ? { color: 'var(--danger-dark)', fontWeight: 'var(--weight-semibold)' } : undefined}>
                    {p.stock}{low && <span className="visually-hidden"> — low stock</span>}
                  </td>
                  <td className="num">
                    <span className="row" style={{ justifyContent: 'flex-end', gap: 'var(--space-1)', flexWrap: 'nowrap' }}>
                      <Icon name="star" size={13} style={{ color: 'var(--star)' }} />{p.rating || '—'}
                    </span>
                  </td>
                  <td className="num strong">{money(p.price)}</td>
                  <td className="num"><VendorStatusPill status={p.status} /></td>
                </tr>
              );
            })}
          </DataTable>
        )}
      </VendorCard>
    </div>
  );
}
