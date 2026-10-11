'use client';
import { money } from '@/lib/money.js';
import React from 'react';
import { Icon } from '@/components/ui/Icon.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { DataTable, ThingCell } from '@/components/ui/DataTable.jsx';
import { PageTitle, AdminCard, StatusPill } from './shell.jsx';

export function AdminProducts({ products, vendors, onModerate }) {
  const [filter, setFilter] = React.useState('All vendors');
  const [confirm, setConfirm] = React.useState(null);
  const selectId = React.useId();
  const options = ['All vendors', ...vendors.map(v => v.store)];

  // This screen exists to handle exceptions, so the exceptions come first.
  // A pending listing is a vendor waiting on the marketplace; a flagged one is
  // the marketplace waiting on a vendor. Everything else is fine and can sit
  // below. Array#sort is stable, so within each band the original order holds.
  const RANK = { 'Pending review': 0, Flagged: 1 };
  const needsAction = (p) => p.status === 'Pending review' || p.status === 'Flagged';
  const base = filter === 'All vendors' ? products : products.filter(p => p.vendor === filter);
  const shown = [...base].sort((a, b) => (RANK[a.status] ?? 2) - (RANK[b.status] ?? 2));
  const waiting = base.filter(needsAction).length;

  return (
    <div className="stack stack--lg">
      <PageTitle eyebrow="Oversight" title="Products">
        <div className="field" style={{ minWidth: '13rem' }}>
          <label className="field__label" htmlFor={selectId}>Filter by vendor</label>
          <select id={selectId} className="field__select" value={filter} onChange={e => setFilter(e.target.value)}>
            {options.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
      </PageTitle>

      <div className="stack stack--sm" style={{ maxWidth: '44rem', marginTop: 'calc(var(--space-6) * -1)' }}>
        <p className="body">
          Admins don&apos;t create listings — vendors publish their own. This view is for
          moderation: approve pending items, flag or remove anything that violates policy.
        </p>
        {waiting > 0 && (
          <p className="meta" role="status">
            <strong style={{ color: 'var(--brand-700)' }}>
              {waiting} listing{waiting === 1 ? '' : 's'} waiting on you
            </strong>{' '}
            — they are at the top of the table.
          </p>
        )}
      </div>

      <AdminCard className="panel--flush">
        {shown.length === 0 ? (
          <p className="empty">No listings for this vendor.</p>
        ) : (
          <DataTable
            caption="All marketplace listings, with moderation actions"
            columns={[
              { label: 'Product' }, { label: 'Vendor' }, { label: 'Category' },
              { label: 'Price', align: 'right' }, { label: 'Stock', align: 'right' },
              { label: 'Status', align: 'right' }, { label: 'Actions', align: 'right' },
            ]}
          >
            {shown.map(p => (
              <tr key={p.id}>
                <td><ThingCell image={p.photo} name={p.name} /></td>
                <td>{p.vendor}</td>
                <td>{p.category}</td>
                <td className="num strong">{money(p.price)}</td>
                <td className="num">{p.stock}</td>
                <td className="num"><StatusPill status={p.status} /></td>
                <td className="num nowrap">
                  {/* Each action names the listing it affects, so a screen
                      reader hears "Approve Oak Bench" rather than one of many
                      identical "button"s. Icons match the action: a tick for
                      approve and a warning for flag, not a plus and a minus.

                      A flagged listing used to have no way back. It was not
                      "Pending review", so it got no tick; it was already
                      "Flagged", so it got no flag — which left permanent
                      deletion as the only exit from a flag the vendor may
                      since have addressed. The tick now clears a flag as well
                      as approving a pending listing. "Out of stock" is left
                      alone: that is a fact about inventory, not a moderation
                      decision, and the API restores it itself when stock
                      comes back. */}
                  {needsAction(p) && (
                    <button type="button" className="icon-action" style={{ color: 'var(--success-dark)' }}
                      onClick={() => onModerate(p.id, 'Active')}
                      aria-label={p.status === 'Flagged' ? `Clear the flag on ${p.name}` : `Approve ${p.name}`}
                      title={p.status === 'Flagged' ? 'Clear flag' : 'Approve'}>
                      <Icon name="check" size={16} />
                    </button>
                  )}
                  {p.status !== 'Flagged' && p.status !== 'Draft' && (
                    <button type="button" className="icon-action" style={{ color: 'var(--brand-700)' }}
                      onClick={() => onModerate(p.id, 'Flagged')} aria-label={`Flag ${p.name}`} title="Flag">
                      <Icon name="alert" size={16} />
                    </button>
                  )}
                  <button type="button" className="icon-action"
                    onClick={() => setConfirm(p)} aria-label={`Remove ${p.name}`} title="Remove">
                    <Icon name="trash" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </AdminCard>

      {/* Removal is permanent and affects someone else's business, so it asks
          first. The vendor console already confirmed deletes; this one did not. */}
      {/* Was hand-rolled overlay markup that declared role="dialog"
          aria-modal="true" and implemented none of it: focus stayed on the
          body, Tab walked the page behind the overlay, and Escape did
          nothing. <Modal> has done all of that since it was written — it was
          simply not being used here. */}
      {confirm && (
        <Modal show title="Remove this listing?" onClose={() => setConfirm(null)}>
          <p className="body">
            <strong>{confirm.name}</strong> by {confirm.vendor} will be deleted from the
            marketplace. This cannot be undone.
          </p>
          <div className="row row--end" style={{ marginTop: 'var(--space-6)' }}>
            <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { onModerate(confirm.id, 'removed'); setConfirm(null); }}>
              Remove listing
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
