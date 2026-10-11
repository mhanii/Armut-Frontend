'use client';
import React from 'react';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { VendorPageTitle, VendorCard, VendorField } from './shell.jsx';

export function VendorStore({ store, onSave }) {
  const [form, setForm] = React.useState({ ...store });
  const [saving, setSaving] = React.useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Keep the form in step if the store reloads underneath it.
  React.useEffect(() => { setForm({ ...store }); }, [store]);

  // Compare every key present on either side, treating undefined and "" alike
  // so an untouched empty field does not read as an edit.
  const dirty = React.useMemo(() => {
    const keys = new Set([...Object.keys(form || {}), ...Object.keys(store || {})]);
    return [...keys].some(k => ((form || {})[k] ?? '') !== ((store || {})[k] ?? ''));
  }, [form, store]);

  // Warn before losing edits to a browser navigation.
  React.useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const submit = async (e) => {
    e.preventDefault();
    if (!dirty || saving) return;
    setSaving(true);
    try { await onSave(form); } finally { setSaving(false); }
  };

  return (
    <form className="stack stack--lg" onSubmit={submit}>
      <VendorPageTitle eyebrow="Storefront" title="My store">
        <div className="row" style={{ gap: 'var(--space-4)' }}>
          {dirty && <span className="meta" role="status">Unsaved changes</span>}
          <Button type="submit" variant="dark" disabled={!dirty || saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </VendorPageTitle>

      <div className="split split--content">
        <div className="stack stack--lg">
          <VendorCard title="Store profile">
            <div className="stack stack--lg">
              <Input label="Store name" value={form.name || ''} onChange={e => set('name', e.target.value)} />
              <VendorField label="Description" hint="Shown on your storefront header.">
                <textarea className="field__textarea" rows={4}
                  value={form.description || ''} onChange={e => set('description', e.target.value)} />
              </VendorField>
              <Input label="Address" autoComplete="street-address"
                value={form.address || ''} onChange={e => set('address', e.target.value)} />
            </div>
          </VendorCard>

          <VendorCard title="Contact">
            <div className="address-form__pair">
              <Input label="Email" type="email" autoComplete="email"
                hint="This is also your sign-in address."
                value={form.email || ''} onChange={e => set('email', e.target.value)} />
              <Input label="Phone" type="tel" autoComplete="tel"
                value={form.phone || ''} onChange={e => set('phone', e.target.value)} />
            </div>
          </VendorCard>
        </div>

        <VendorCard title="Preview">
          <div className="preview">
            <div className="preview__band" />
            <div className="preview__body">
              <h3 className="display-3" style={{ fontSize: 'var(--text-xl)' }}>{form.name || 'Your store'}</h3>
              <p className="eyebrow" style={{ margin: 'var(--space-2) 0 var(--space-3)' }}>
                {/* The city came from a hardcoded "İstanbul"; it now reflects
                    whatever the vendor actually entered. */}
                {[form.since && `Since ${form.since}`, form.city].filter(Boolean).join(' · ') || 'Your storefront'}
              </p>
              <p className="body" style={{ fontSize: 'var(--text-sm)' }}>
                {form.description || 'Add a description to introduce your workshop to shoppers.'}
              </p>
            </div>
          </div>
          <p className="meta" style={{ marginTop: 'var(--space-4)' }}>
            Your store name appears on every listing you publish. The rest is how Armut reads your store.
          </p>
        </VendorCard>
      </div>
    </form>
  );
}
