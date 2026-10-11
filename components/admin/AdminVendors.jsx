'use client';
import { fmtDate } from '@/lib/date.js';
import { money } from '@/lib/money.js';
import React from 'react';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Icon } from '@/components/ui/Icon.jsx';
import { Modal } from '@/components/ui/Modal.jsx';
import { DataTable, ThingCell } from '@/components/ui/DataTable.jsx';
import { PageTitle, AdminCard, StatusPill } from './shell.jsx';

function InviteVendorDialog({ onClose, onInvite }) {
  const [form, setForm] = React.useState({ store: '', manager: '', email: '', city: '', password: '', status: 'Pending' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const statusId = React.useId();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.store.trim()) { setError('Store name is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setBusy(true);
    try { await onInvite(form); onClose(); }
    catch (err) { setError(err.message || 'Could not add vendor.'); setBusy(false); }
  };

  return (
    <Modal show title="Add a vendor" onClose={onClose}>
      <form className="stack stack--lg" onSubmit={submit} noValidate>
        {error && <div className="alert alert--error" role="alert">{error}</div>}
        <Input label="Store name" required placeholder="Armut Modern Designs"
          value={form.store} onChange={e => set('store', e.target.value)} />
        <Input label="Manager" placeholder="Selin Aydın"
          value={form.manager} onChange={e => set('manager', e.target.value)} />
        <div className="address-form__pair">
          <Input label="Email" type="email" required placeholder="studio@example.com"
            hint="This is their sign-in address."
            value={form.email} onChange={e => set('email', e.target.value)} />
          <Input label="City" placeholder="İstanbul"
            value={form.city} onChange={e => set('city', e.target.value)} />
        </div>
        <div className="address-form__pair">
          <Input label="Temporary password" type="text" required minLength={6}
            hint="At least 6 characters. Ask them to change it after signing in."
            value={form.password} onChange={e => set('password', e.target.value)} />
          <div className="field">
            <label className="field__label" htmlFor={statusId}>Status</label>
            <select id={statusId} className="field__select" value={form.status} onChange={e => set('status', e.target.value)}>
              <option>Pending</option><option>Active</option><option>Suspended</option>
            </select>
            <p className="meta">Pending vendors cannot sign in yet.</p>
          </div>
        </div>
        <div className="row row--end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" variant="dark" disabled={busy}>{busy ? 'Adding…' : 'Add vendor'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export function AdminVendors({ vendors, products = [], onSetStatus, onInvite, onRemove }) {
  const [detail, setDetail] = React.useState(null);
  const [inviting, setInviting] = React.useState(false);
  const [confirmRemove, setConfirmRemove] = React.useState(null);

  const vendorProducts = detail ? products.filter(p => p.vendor === detail.store) : [];

  return (
    <div className="stack stack--lg">
      <PageTitle eyebrow="Marketplace" title="Vendors">
        <Button variant="dark" icon="plus" onClick={() => setInviting(true)}>Add vendor</Button>
      </PageTitle>

      <AdminCard className="panel--flush">
        {vendors.length === 0 ? (
          <p className="empty">No vendors yet.</p>
        ) : (
          <DataTable
            caption="Marketplace vendors, with listing counts, sales and status"
            columns={[
              { label: 'Store' }, { label: 'Manager' }, { label: 'City' },
              { label: 'Listings', align: 'right' }, { label: 'Sales', align: 'right' },
              { label: 'Status', align: 'right' }, { label: 'Actions', align: 'right' },
            ]}
          >
            {vendors.map(v => (
              <tr key={v.id}>
                <td className="strong">{v.store}</td>
                <td>
                  {v.manager}
                  {v.email && <span className="meta" style={{ display: 'block' }}>{v.email}</span>}
                </td>
                <td>{v.city}</td>
                <td className="num">{v.products}</td>
                <td className="num strong">{money(v.sales)}</td>
                <td className="num"><StatusPill status={v.status} /></td>
                <td className="num nowrap">
                  <button type="button" className="icon-action" onClick={() => setDetail(v)}
                    aria-label={`Manage ${v.store}`} title="Manage">
                    <Icon name="eye" size={16} />
                  </button>
                  <button type="button" className="icon-action" onClick={() => setConfirmRemove(v)}
                    aria-label={`Remove ${v.store}`} title="Remove">
                    <Icon name="trash" size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </DataTable>
        )}
      </AdminCard>

      {inviting && <InviteVendorDialog onClose={() => setInviting(false)} onInvite={onInvite} />}

      {detail && (
        <Modal show title={detail.store} onClose={() => setDetail(null)}>
          <p className="eyebrow" style={{ marginTop: 'calc(var(--space-3) * -1)', marginBottom: 'var(--space-5)' }}>
            Vendor since {fmtDate(detail.joined)}
          </p>

          <dl className="facts">
            {[['Manager', detail.manager], ['Email', detail.email], ['City', detail.city], ['Total sales', `${money(detail.sales)}`]]
              .filter(([, val]) => val)
              .map(([k, val]) => (
                <div className="facts__row" key={k}>
                  <dt className="meta">{k}</dt>
                  <dd className="summary__value" style={{ margin: 0 }}>{val}</dd>
                </div>
              ))}
          </dl>

          <p className="pdp__fact-label" style={{ margin: 'var(--space-6) 0 var(--space-3)' }}>
            Listings ({vendorProducts.length})
          </p>
          {vendorProducts.length === 0 ? (
            <p className="meta">No products published yet.</p>
          ) : (
            <ul className="stack stack--sm list-reset" style={{ maxHeight: '14rem', overflowY: 'auto' }}>
              {vendorProducts.map(p => (
                <li key={p.id} className="row" style={{ gap: 'var(--space-3)', background: 'var(--surface-muted)', borderRadius: 'var(--radius-sm)', padding: 'var(--space-2)', flexWrap: 'nowrap' }}>
                  <ThingCell image={p.photo} name={p.name} />
                  <span className="spacer" />
                  <span className="meta nowrap">{p.status}</span>
                  <span className="summary__value nowrap">{money(p.price)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="row row--between" style={{ marginTop: 'var(--space-6)' }}>
            <StatusPill status={detail.status} />
            <div className="row" style={{ gap: 'var(--space-2)' }}>
              {detail.status !== 'Suspended' && (
                <Button variant="outline" size="sm"
                  onClick={() => { onSetStatus(detail.id, 'Suspended'); setDetail({ ...detail, status: 'Suspended' }); }}>
                  Suspend
                </Button>
              )}
              {detail.status !== 'Active' && (
                <Button variant="dark" size="sm"
                  onClick={() => { onSetStatus(detail.id, 'Active'); setDetail({ ...detail, status: 'Active' }); }}>
                  {detail.status === 'Pending' ? 'Approve' : 'Reinstate'}
                </Button>
              )}
              <Button variant="danger" size="sm" onClick={() => { setConfirmRemove(detail); setDetail(null); }}>
                Remove
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {confirmRemove && (
        <Modal show title="Remove this vendor?" onClose={() => setConfirmRemove(null)}>
          <p className="body">
            Removing <strong style={{ color: 'var(--ink-body)' }}>{confirmRemove.store}</strong>
            {confirmRemove.products === 0 ? ' — they have no listings.'
              : confirmRemove.products === 1 ? ' also deletes their one listing.'
              : ` also deletes all ${confirmRemove.products} of their listings.`} Past orders are kept.
            This can&apos;t be undone.
          </p>
          <div className="row row--end" style={{ marginTop: 'var(--space-6)' }}>
            <Button variant="ghost" onClick={() => setConfirmRemove(null)}>Cancel</Button>
            <Button variant="danger" onClick={() => { onRemove(confirmRemove); setConfirmRemove(null); }}>
              Remove vendor
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
