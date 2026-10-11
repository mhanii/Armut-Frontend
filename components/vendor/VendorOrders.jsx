'use client';
import { fmtDate } from '@/lib/date.js';
import { money } from '@/lib/money.js';
import React from 'react';
import { Button } from '@/components/ui/Button.jsx';
import { Icon } from '@/components/ui/Icon.jsx';
import { DataTable } from '@/components/ui/DataTable.jsx';
import { VendorPageTitle, VendorCard, VendorStatusPill } from './shell.jsx';

const NEXT_STATUS = { Processing: 'Shipped', Shipped: 'Delivered' };

// "To fulfil" leads because it is the only group that needs the vendor to do
// something; the dashboard tile deep-links straight into it.
const FILTERS = [
  { id: 'todo', label: 'To fulfil', match: o => o.status === 'Processing' },
  { id: 'shipped', label: 'Shipped', match: o => o.status === 'Shipped' },
  { id: 'delivered', label: 'Delivered', match: o => o.status === 'Delivered' },
  { id: 'cancelled', label: 'Cancelled', match: o => o.status === 'Cancelled' },
  { id: 'all', label: 'All orders', match: () => true },
];

export function VendorOrders({ orders, onAdvance, initialFilter = 'all' }) {
  const [expanded, setExpanded] = React.useState(null);
  const [filter, setFilter] = React.useState(initialFilter);

  const counts = React.useMemo(() => {
    const c = {};
    for (const f of FILTERS) c[f.id] = orders.filter(f.match).length;
    return c;
  }, [orders]);

  const active = FILTERS.find(f => f.id === filter) || FILTERS[FILTERS.length - 1];
  const shown = React.useMemo(() => orders.filter(active.match), [orders, active]);

  return (
    <div className="stack stack--lg">
      <VendorPageTitle eyebrow="Fulfilment" title="Orders" />

      {orders.length > 0 && (
        <div className="filters" role="group" aria-label="Filter orders by status">
          {FILTERS.map(f => (
            <button
              key={f.id}
              type="button"
              className="filter"
              aria-pressed={filter === f.id}
              onClick={() => { setFilter(f.id); setExpanded(null); }}
            >
              {f.label}
              <span className="filter__count">{counts[f.id]}</span>
            </button>
          ))}
        </div>
      )}

      {orders.length === 0 ? (
        <VendorCard><p className="empty">No orders yet. They&apos;ll appear here as they come in.</p></VendorCard>
      ) : shown.length === 0 ? (
        <VendorCard>
          <p className="empty">
            {filter === 'todo'
              ? 'Nothing waiting to be shipped — you are all caught up.'
              : `No ${active.label.toLowerCase()} orders.`}
          </p>
        </VendorCard>
      ) : (
        <VendorCard className="panel--flush">
          <DataTable
            caption={`${active.label}. Expand a row for the delivery address and items.`}
            columns={[
              { label: 'Order' }, { label: 'Customer' }, { label: 'Date' },
              { label: 'Total', align: 'right' }, { label: 'Status', align: 'right' },
              { label: 'Details', align: 'right' },
            ]}
          >
            {shown.map(o => {
              const isOpen = expanded === o.id;
              const next = NEXT_STATUS[o.status];
              return (
                <React.Fragment key={o.id}>
                  <tr>
                    <td className="strong">#{o.id}</td>
                    <td>{o.customer}</td>
                    <td className="nowrap">{fmtDate(o.date)}</td>
                    <td className="num strong">{money(o.total)}</td>
                    <td className="num"><VendorStatusPill status={o.status} /></td>
                    <td className="num">
                      {/* One disclosure, not a row that expands AND a dialog
                          showing the same thing. The expanded row is keyboard
                          reachable; the old <tr onClick> was not. */}
                      <button
                        type="button"
                        className="icon-action"
                        aria-expanded={isOpen}
                        aria-controls={`order-${o.id}`}
                        aria-label={`${isOpen ? 'Hide' : 'Show'} details for order ${o.id}`}
                        onClick={() => setExpanded(isOpen ? null : o.id)}
                      >
                        <Icon name={isOpen ? 'chevron-up' : 'chevron-down'} size={16} />
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr id={`order-${o.id}`}>
                      <td colSpan={6} style={{ background: 'var(--bg-page)' }}>
                        <div className="stack">
                          <div>
                            <p className="pdp__fact-label">Deliver to</p>
                            <p className="pdp__fact-value">
                              {o.address || '—'}
                              {o.deliveryMethod && <span className="muted"> · {o.deliveryMethod === 'express' ? 'Express' : 'Standard'} delivery</span>}
                            </p>
                          </div>

                          <ul className="list-reset">
                            {o.items.map((it, i) => (
                              <li key={i} className="summary__row" style={{ padding: 'var(--space-2) 0', fontSize: 'var(--text-sm)' }}>
                                <span>{it.name} × {it.qty}</span>
                                <span className="summary__value">{money((it.price * it.qty))}</span>
                              </li>
                            ))}
                          </ul>

                          {next && (
                            <div className="row row--end">
                              <Button variant="dark" size="sm" onClick={() => onAdvance(o.id, next)}>
                                Mark as {next}
                              </Button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </DataTable>
        </VendorCard>
      )}
    </div>
  );
}
