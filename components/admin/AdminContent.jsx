'use client';
import React from 'react';
import { Button } from '@/components/ui/Button.jsx';
import { Icon } from '@/components/ui/Icon.jsx';
import { PageTitle, AdminCard } from './shell.jsx';

// A labelled control. The old version rendered a <label> with no htmlFor, so
// clicking it did nothing and screen readers never paired the two.
function Labeled({ label, children, hint }) {
  const id = React.useId();
  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>{label}</label>
      {React.isValidElement(children) ? React.cloneElement(children, { id }) : children}
      {hint && <p className="meta">{hint}</p>}
    </div>
  );
}

function ImageUploader({ value, onChange, onUpload, flash, ratio = '3 / 2', label, id }) {
  const inputRef = React.useRef(null);
  const [busy, setBusy] = React.useState(false);
  const urlId = React.useId();

  const pick = () => inputRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    try { const url = await onUpload(file); onChange(url); }
    catch (err) { flash(err.message || 'Upload failed', 'error'); }
    setBusy(false);
  };

  return (
    <div className="uploader">
      {/* A button, not a clickable div — reachable by keyboard and announced. */}
      <button
        type="button"
        className="uploader__drop"
        style={{ aspectRatio: ratio }}
        onClick={pick}
        disabled={busy}
        aria-label={value ? `Replace ${label} image` : `Upload ${label} image`}
      >
        {value ? <img src={value} alt="" /> : <Icon name="image" size={20} />}
        {busy && <span className="uploader__busy">Uploading…</span>}
      </button>
      <div className="uploader__side">
        <input ref={inputRef} type="file" accept="image/*" onChange={onFile} className="visually-hidden" tabIndex={-1} />
        <Button variant="outline" size="sm" onClick={pick} disabled={busy}>
          {value ? 'Replace image' : 'Upload image'}
        </Button>
        <label className="visually-hidden" htmlFor={id || urlId}>{label} image URL</label>
        <input
          id={id || urlId}
          className="field__input"
          style={{ fontSize: 'var(--text-xs)' }}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="…or paste an image URL"
        />
      </div>
    </div>
  );
}

export function AdminContent({ content, onSave, onUpload, flash }) {
  const [banners, setBanners] = React.useState(() => (content.banners || []).map(b => ({ ...b })));
  const [categories, setCategories] = React.useState(() => (content.categories || []).map(c => ({ ...c })));
  const [saving, setSaving] = React.useState(false);
  const [dirty, setDirty] = React.useState(false);

  // Content edits are lost on a browser navigation; say so before it happens.
  React.useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const touch = () => setDirty(true);
  const setB = (i, k, v) => { setBanners(list => list.map((b, idx) => idx === i ? { ...b, [k]: v } : b)); touch(); };
  const setC = (i, k, v) => { setCategories(list => list.map((c, idx) => idx === i ? { ...c, [k]: v } : c)); touch(); };

  const move = (list, setList, i, dir) => {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const copy = list.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    setList(copy); touch();
  };
  const remove = (list, setList, i) => { setList(list.filter((_, idx) => idx !== i)); touch(); };

  const addBanner = () => { setBanners(list => [...list, { title: '', subtitle: '', image: '' }]); touch(); };
  const addCategory = () => { setCategories(list => [...list, { name: '', image: '' }]); touch(); };

  const save = async () => {
    setSaving(true);
    try { await onSave({ banners, categories }); setDirty(false); }
    // Already shown by the console; staying dirty is the point of the rethrow,
    // letting it escape as well only made an unhandled rejection.
    catch (e) { /* keep the unsaved state */ }
    finally { setSaving(false); }
  };

  const orderControls = (list, setList, i, kindLabel, name) => (
    <div className="row-card__order">
      <button type="button" className="move-btn" disabled={i === 0}
        onClick={() => move(list, setList, i, -1)}
        aria-label={`Move ${kindLabel} ${name} up`}>
        <Icon name="chevron-up" size={14} />
      </button>
      <span className="row-card__index" aria-hidden="true">{i + 1}</span>
      <button type="button" className="move-btn" disabled={i === list.length - 1}
        onClick={() => move(list, setList, i, 1)}
        aria-label={`Move ${kindLabel} ${name} down`}>
        <Icon name="chevron-down" size={14} />
      </button>
    </div>
  );

  return (
    <div className="stack stack--lg">
      <PageTitle eyebrow="Storefront" title="Site content">
        <div className="row" style={{ gap: 'var(--space-4)' }}>
          {dirty && <span className="meta" role="status">Unsaved changes</span>}
          <Button variant="dark" icon="check" disabled={saving || !dirty} onClick={save}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      </PageTitle>

      <p className="body" style={{ maxWidth: '44rem', marginTop: 'calc(var(--space-6) * -1)' }}>
        Control what shoppers see on the home page — the hero slider and the
        &ldquo;Shop by room&rdquo; tiles. Changes go live as soon as you save.
      </p>

      <AdminCard
        title="Home slider"
        action={<Button variant="outline" size="sm" icon="plus" onClick={addBanner}>Add slide</Button>}
      >
        <div className="stack stack--lg">
          {banners.length === 0 && <p className="meta">No slides yet — add one to fill the hero.</p>}
          {banners.map((b, i) => (
            <div key={i} className="row-card">
              {orderControls(banners, setBanners, i, 'slide', b.title || `${i + 1}`)}
              <div className="row-card__fields row-card__fields--pair">
                <Labeled label="Headline">
                  <input className="field__input" value={b.title || ''} placeholder="Design your comfort zone"
                    onChange={e => setB(i, 'title', e.target.value)} />
                </Labeled>
                <Labeled label="Subtitle">
                  <input className="field__input" value={b.subtitle || ''} placeholder="Furniture handcrafted in Türkiye…"
                    onChange={e => setB(i, 'subtitle', e.target.value)} />
                </Labeled>
                <div className="row-card__span">
                  <p className="field__label" style={{ marginBottom: 'var(--space-2)' }}>Background image</p>
                  <ImageUploader label={`slide ${i + 1}`} value={b.image} onChange={v => setB(i, 'image', v)}
                    onUpload={onUpload} flash={flash} ratio="16 / 9" />
                </div>
              </div>
              <button type="button" className="icon-action" onClick={() => remove(banners, setBanners, i)}
                aria-label={`Remove slide ${b.title || i + 1}`} title="Remove slide">
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      <AdminCard
        title="Shop by room"
        action={<Button variant="outline" size="sm" icon="plus" onClick={addCategory}>Add room</Button>}
      >
        <div className="stack stack--lg">
          {categories.length === 0 && <p className="meta">No rooms yet.</p>}
          {categories.map((c, i) => (
            <div key={i} className="row-card">
              {orderControls(categories, setCategories, i, 'room', c.name || `${i + 1}`)}
              <div className="row-card__fields row-card__fields--wide">
                <Labeled label="Room name" hint="Must match the category on listings.">
                  <input className="field__input" value={c.name || ''} placeholder="Living Room"
                    onChange={e => setC(i, 'name', e.target.value)} />
                </Labeled>
                <div>
                  <p className="field__label" style={{ marginBottom: 'var(--space-2)' }}>Tile image</p>
                  <ImageUploader label={`room ${c.name || i + 1}`} value={c.image} onChange={v => setC(i, 'image', v)}
                    onUpload={onUpload} flash={flash} ratio="3 / 2" />
                </div>
              </div>
              <button type="button" className="icon-action" onClick={() => remove(categories, setCategories, i)}
                aria-label={`Remove room ${c.name || i + 1}`} title="Remove room">
                <Icon name="trash" size={16} />
              </button>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* The editor is 2000px tall in a 900px viewport, and the only way to
          save sat in the page title — so after editing a room tile the button
          was a thousand pixels above the fold, with nothing on screen to say
          there was anything to save. The bar appears only when there is. */}
      {dirty && (
        <div className="savebar" role="status">
          <span className="savebar__text">Unsaved changes</span>
          <Button variant="dark" icon="check" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </div>
      )}
    </div>
  );
}
