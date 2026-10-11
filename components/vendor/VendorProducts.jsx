'use client';
import { money } from '@/lib/money.js';
import React from 'react';
import { Modal } from '@/components/ui/Modal.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Icon } from '@/components/ui/Icon.jsx';
import { DataTable, ThingCell } from '@/components/ui/DataTable.jsx';
import { VendorPageTitle, VendorCard, VendorStatusPill } from './shell.jsx';

const LOW_STOCK = 5;

export function VendorProducts({ products, onAdd, onEdit, onDelete }) {
  const [confirm, setConfirm] = React.useState(null);

  return (
    <div className="stack stack--lg">
      <VendorPageTitle eyebrow="Catalogue" title="Your products">
        <Button variant="dark" icon="plus" onClick={onAdd}>Add product</Button>
      </VendorPageTitle>

      {products.length === 0 ? (
        <VendorCard>
          <div className="empty">
            <p className="body" style={{ marginBottom: 'var(--space-6)' }}>
              You haven&apos;t published any products yet.
            </p>
            <Button variant="dark" icon="plus" onClick={onAdd}>Add your first product</Button>
          </div>
        </VendorCard>
      ) : (
        <VendorCard className="panel--flush">
          <DataTable
            caption="Your listings, with price, stock and status"
            columns={[
              { label: 'Product' }, { label: 'Category' },
              { label: 'Price', align: 'right' }, { label: 'Stock', align: 'right' },
              { label: 'Status', align: 'right' }, { label: 'Actions', align: 'right' },
            ]}
          >
            {products.map(p => {
              const low = p.stock <= LOW_STOCK;
              return (
                <tr key={p.id}>
                  <td>
                    <ThingCell
                      image={(p.photos && p.photos[0]) || null}
                      name={p.name}
                      sub={p.discount > 0 ? `${p.discount}% off` : undefined}
                    />
                  </td>
                  <td>{p.category}</td>
                  <td className="num strong">{money(p.price)}</td>
                  <td className="num" style={low ? { color: 'var(--danger-dark)', fontWeight: 'var(--weight-semibold)' } : undefined}>
                    {p.stock}{low && <span className="visually-hidden"> — low stock</span>}
                  </td>
                  <td className="num"><VendorStatusPill status={p.status} /></td>
                  <td className="num nowrap">
                    <button type="button" className="icon-action" onClick={() => onEdit(p)}
                      aria-label={`Edit ${p.name}`} title="Edit">
                      <Icon name="pencil" size={16} />
                    </button>
                    <button type="button" className="icon-action" onClick={() => setConfirm(p)}
                      aria-label={`Delete ${p.name}`} title="Delete">
                      <Icon name="trash" size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </DataTable>
        </VendorCard>
      )}

      {/* Was hand-rolled overlay markup that declared role="dialog"
          aria-modal="true" and implemented none of it: focus stayed on the
          body, Tab walked the page behind the overlay, and Escape did
          nothing. <Modal> has done all of that since it was written — it was
          simply not being used here. */}
      {confirm && (
        <Modal show title="Delete this product?" onClose={() => setConfirm(null)}>
          <p className="body">
            <strong>{confirm.name}</strong> will be removed from your storefront.
            This can&apos;t be undone.
          </p>
          <div className="row row--end" style={{ marginTop: 'var(--space-6)' }}>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
            {/* The destructive choice is styled as destructive. It used to be
                the same dark button as Cancel's neighbour. */}
            <Button variant="danger" onClick={() => { onDelete(confirm.id); setConfirm(null); }}>Delete product</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
