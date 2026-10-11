'use client';
import React from 'react';
import { RadioCard } from '@/components/ui/RadioCard.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { api } from '@/lib/api.js';

const EMPTY = { title: '', street: '', district: '', isDefault: false };

// The customer's saved delivery addresses, with add / edit / remove / set-default.
// Used on its own in the account page, and in `selectable` mode at checkout where
// one address has to be picked for the order.
//
// `onLoaded(list)` fires after every successful load or mutation so the parent
// can track the current addresses (checkout needs the selected one).
export function AddressBook({ heading, headingId, selectable = false, selectedId, onSelect, onLoaded, flash, emptyHint }) {
  const [addresses, setAddresses] = React.useState(null); // null = still loading
  const [loadError, setLoadError] = React.useState(null);
  const [editingId, setEditingId] = React.useState(null); // id | 'new' | null
  const [form, setForm] = React.useState(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState(null);
  const [busyId, setBusyId] = React.useState(null);

  const publish = React.useCallback((list) => {
    setAddresses(list);
    if (onLoaded) onLoaded(list);
  }, [onLoaded]);

  const load = React.useCallback(() => {
    setLoadError(null);
    api.store.getAddresses()
      .then(({ addresses: list }) => publish(list))
      .catch(err => { setAddresses([]); setLoadError(err); });
  }, [publish]);

  React.useEffect(() => { load(); }, [load]);

  const list = addresses || [];

  // The save button used to disable itself until all three fields had
  // something in them, which meant someone who filled two of three got a grey
  // button and no explanation of what was missing. A control that refuses to
  // work and will not say why is worse than one that accepts the press and
  // tells you. The button is always live; the form says what it needs.
  const [fieldErrors, setFieldErrors] = React.useState({});
  const titleRef = React.useRef(null);
  const districtRef = React.useRef(null);
  const streetRef = React.useRef(null);

  const openNew = () => { setEditingId('new'); setForm({ ...EMPTY, isDefault: list.length === 0 }); setFormError(null); setFieldErrors({}); };
  const openEdit = (a) => { setEditingId(a.id); setForm({ title: a.title, street: a.street, district: a.district, isDefault: !!a.isDefault }); setFormError(null); setFieldErrors({}); };
  const closeForm = () => { setEditingId(null); setForm(EMPTY); setFormError(null); setFieldErrors({}); };

  const save = async () => {
    if (saving) return;
    const problems = {};
    if (!form.title.trim()) problems.title = 'Give this address a label.';  // the placeholder already suggests some
    if (!form.district.trim()) problems.district = 'Enter the district and city.';
    if (!form.street.trim()) problems.street = 'Enter the street and number.';
    setFieldErrors(problems);
    if (Object.keys(problems).length) {
      setFormError(null);
      // In the order they appear on the form.
      const first = problems.title ? titleRef : (problems.district ? districtRef : streetRef);
      first.current?.focus();
      return;
    }
    setSaving(true); setFormError(null);
    const creating = editingId === 'new';
    try {
      const res = creating ? await api.store.createAddress(form) : await api.store.updateAddress(editingId, form);
      publish(res.addresses);
      if (onSelect) onSelect(res.address.id);
      closeForm();
      if (flash) flash(creating ? 'Address saved' : 'Address updated');
    } catch (err) { setFormError(err); }
    setSaving(false);
  };

  const remove = async (a) => {
    if (busyId) return;
    setBusyId(a.id);
    try {
      const res = await api.store.deleteAddress(a.id);
      publish(res.addresses);
      if (editingId === a.id) closeForm();
      if (flash) flash('Address removed');
    } catch (err) { if (flash) flash(err.message || 'Could not remove that address.', 'error'); }
    setBusyId(null);
  };

  const makeDefault = async (a) => {
    if (busyId || a.isDefault) return;
    setBusyId(a.id);
    try {
      const res = await api.store.updateAddress(a.id, { title: a.title, street: a.street, district: a.district, isDefault: true });
      publish(res.addresses);
      if (flash) flash('Default address updated');
    } catch (err) { if (flash) flash(err.message || 'Could not update the default.', 'error'); }
    setBusyId(null);
  };

  const addressForm = (
    <form className="address-form stack" onSubmit={(e) => { e.preventDefault(); save(); }}>
      <div className="address-form__pair">
        <Input label="Label" placeholder="Home, Office…" autoComplete="off" maxLength={60}
          ref={titleRef} error={fieldErrors.title}
          value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
        <Input label="District / City" placeholder="Kadıköy, İstanbul" autoComplete="address-level2" maxLength={120}
          ref={districtRef} error={fieldErrors.district}
          value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))} />
      </div>
      <Input label="Street & number" placeholder="Bağdat Cd. 120" autoComplete="street-address" maxLength={200}
        ref={streetRef} error={fieldErrors.street}
        value={form.street} onChange={e => setForm(f => ({ ...f, street: e.target.value }))} />
      <label className="row" style={{ gap: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--ink-600)', cursor: 'pointer' }}>
        <input type="checkbox" checked={!!form.isDefault} disabled={list.length === 0}
          onChange={e => setForm(f => ({ ...f, isDefault: e.target.checked }))} />
        Use as my default delivery address
      </label>
      {formError && <p className="field__error" role="alert">{formError.message}</p>}
      <div className="row" style={{ gap: 'var(--space-3)' }}>
        <Button type="submit" variant="dark" size="sm" disabled={saving}>
          {saving ? 'Saving…' : (editingId === 'new' ? 'Save address' : 'Save changes')}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={closeForm}>Cancel</Button>
      </div>
    </form>
  );

  const row = (a) => (
    <div key={a.id}>
      {selectable ? (
        <RadioCard
          name="addr"
          label={`${a.title} — ${a.line}`}
          sublabel={a.isDefault ? 'Default address' : undefined}
          checked={selectedId === a.id}
          onChange={() => onSelect && onSelect(a.id)}
        />
      ) : (
        <div className="choice" style={{ cursor: 'default' }}>
          <span style={{ minWidth: 0 }}>
            <span className="choice__title" style={{ display: 'block' }}>{a.title}</span>
            <span className="choice__sub" style={{ display: 'block' }}>
              {a.line}{a.isDefault && <span style={{ color: 'var(--brand-700)' }}> · Default</span>}
            </span>
          </span>
        </div>
      )}
      <div className="row" style={{ gap: 'var(--space-4)', padding: 'var(--space-2) var(--space-5) 0' }}>
        <button type="button" className="action" onClick={() => openEdit(a)}>
          Edit<span className="visually-hidden"> {a.title}</span>
        </button>
        {!a.isDefault && list.length > 1 && (
          <button type="button" className="action action--quiet" onClick={() => makeDefault(a)} disabled={busyId === a.id}>
            Make default<span className="visually-hidden"> — {a.title}</span>
          </button>
        )}
        <button type="button" className="action action--quiet" onClick={() => remove(a)} disabled={busyId === a.id}>
          {busyId === a.id ? 'Working…' : <>Remove<span className="visually-hidden"> {a.title}</span></>}
        </button>
      </div>
      {editingId === a.id && addressForm}
    </div>
  );

  return (
    <div>
      <div className="row row--between" style={{ marginBottom: 'var(--space-2)' }}>
        {heading
          ? <h2 className="pdp__fact-label" id={headingId} style={{ margin: 0 }}>{heading}</h2>
          : <span />}
        {editingId === null && addresses !== null && (
          <button type="button" className="action" onClick={openNew}>+ Add address</button>
        )}
      </div>

      {addresses === null && <p className="meta" style={{ marginTop: 'var(--space-4)' }}>Loading your addresses…</p>}

      {loadError && (
        <div className="note" style={{ marginTop: 'var(--space-4)' }}>
          <p className="field__error" role="alert" style={{ marginBottom: 'var(--space-3)' }}>{loadError.message}</p>
          <Button variant="ghost" size="sm" onClick={load}>Try again</Button>
        </div>
      )}

      {addresses !== null && !loadError && list.length === 0 && editingId === null && (
        <p className="meta" style={{ marginTop: 'var(--space-4)' }}>{emptyHint || 'No saved addresses yet.'}</p>
      )}

      <div className="stack stack--sm" style={{ marginTop: 'var(--space-4)' }}>{list.map(row)}</div>

      {editingId === 'new' && addressForm}
    </div>
  );
}
