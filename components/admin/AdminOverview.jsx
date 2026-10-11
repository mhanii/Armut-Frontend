'use client';
import { money } from '@/lib/money.js';
import React from 'react';
import { DataTable, StatTile, ThingCell } from '@/components/ui/DataTable.jsx';
import { PageTitle, AdminCard, StatusPill } from './shell.jsx';

export function AdminOverview({ data, onGoTo }) {
  const gmv = data.orders.reduce((s, o) => s + o.total, 0);
  const pending = data.vendors.filter(v => v.status === 'Pending');
  const needsReview = data.products.filter(p => p.status === 'Pending review' || p.status === 'Flagged');
  const activeVendors = data.vendors.filter(v => v.status === 'Active');
  // Same rule as the storefront: on sale, from an approved vendor.
  const approved = new Set(activeVendors.map(v => v.store));
  const liveProducts = data.products.filter(p => (p.status === 'Active' || p.status === 'Out of stock') && approved.has(p.vendor));

  return (
    <div className="stack stack--lg">
      <PageTitle eyebrow="Marketplace" title="Overview" />

      <div className="grid grid--stats">
        <StatTile
          label="Awaiting approval"
          value={pending.length}
          note={pending.length ? 'Vendors cannot trade yet' : 'No one waiting'}
          onClick={pending.length ? () => onGoTo?.('vendors') : undefined}
        />
        <StatTile
          label="Listings to review"
          value={needsReview.length}
          note={needsReview.length ? 'Flagged or pending' : 'All clear'}
          onClick={needsReview.length ? () => onGoTo?.('products') : undefined}
        />
        <StatTile label="Active vendors" value={activeVendors.length} note={`${data.vendors.length} total`} />
        <StatTile label="Marketplace GMV" value={`${money(gmv)}`} note={`${liveProducts.length} live listings`} />
      </div>

      {/* The table named what needed doing and offered no way to do it: the
          admin read two product names, then navigated to Products and found
          them again by hand. */}
      <AdminCard
        title="Needs your review"
        className="panel--flush"
        action={needsReview.length
          ? <button type="button" className="link-btn" onClick={() => onGoTo?.('products')}>Review listings</button>
          : undefined}
      >
        {needsReview.length === 0 ? (
          <p className="empty">Nothing pending — the marketplace is all caught up.</p>
        ) : (
          <DataTable
            caption="Listings that are flagged or awaiting review"
            columns={[{ label: 'Product' }, { label: 'Vendor' }, { label: 'Category' }, { label: 'Status', align: 'right' }]}
          >
            {needsReview.map(p => (
              <tr key={p.id}>
                <td><ThingCell image={p.photo} name={p.name} /></td>
                <td>{p.vendor}</td>
                <td>{p.category}</td>
                <td className="num"><StatusPill status={p.status} /></td>
              </tr>
            ))}
          </DataTable>
        )}
      </AdminCard>
    </div>
  );
}
