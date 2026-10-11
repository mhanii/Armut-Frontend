'use client';
import { money } from '@/lib/money.js';
import React from 'react';
import { Button } from '@/components/ui/Button.jsx';
import { Input } from '@/components/ui/Input.jsx';
import { Icon } from '@/components/ui/Icon.jsx';
import { VendorPageTitle, VendorCard, VendorField } from './shell.jsx';
import { api } from '@/lib/api.js';

export function VendorProductForm({ product, categories, onSave, onCancel }) {
  const isEdit = !!product;

  const [form, setForm] = React.useState(() => product ? { ...product } : {
    name: '', category: categories[0], price: '', discount: '', stock: 0, description: '', status: 'Draft',
    colors: [], photos: [],
  });
  // Flagged / pending-review listings keep their status until an admin acts.
  const moderated = form.status === 'Flagged' || form.status === 'Pending review';
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const [colorName, setColorName] = React.useState('');
  const [colorHex, setColorHex] = React.useState('#bd7a50');
  const addColor = () => {
    if (!colorName.trim()) return;
    set('colors', [...form.colors, { name: colorName.trim(), hex: colorHex }]);
    setColorName(''); setColorHex('#bd7a50');
  };
  const removeColor = (name) => set('colors', form.colors.filter(c => c.name !== name));

  const fileRef = React.useRef(null);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState('');
  const onPickPhoto = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true); setUploadError('');
    try { const { url } = await api.vendor.upload(file); set('photos', [...form.photos, url]); }
    catch (err) { setUploadError(err.message || 'Upload failed.'); }
    setUploading(false);
  };
  const removePhoto = (i) => set('photos', form.photos.filter((_, idx) => idx !== i));

  // Shown next to the save button instead of silently doing nothing.
  const [formError, setFormError] = React.useState('');

  // A banner reading "Enter a price above zero" names the field in prose and
  // marks nothing: no aria-invalid, no aria-describedby, and focus left
  // wherever it was, so a reader hears the message once and then has to go
  // looking. <Input> has taken an `error` prop since it was written and no
  // form in the app was passing one. Client-side checks own the field errors;
  // the server's message stays in the banner, because the API deliberately
  // does not say which field "Incorrect email or password" is about.
  const [fieldErrors, setFieldErrors] = React.useState({});
  const nameRef = React.useRef(null);
  const priceRef = React.useRef(null);
  const stockRef = React.useRef(null);
  const discountRef = React.useRef(null);

  const submit = () => {
    const price = parseFloat(form.price) || 0;
    const stock = parseInt(form.stock, 10) || 0;
    // Draft used to become Active as soon as stock was above zero, on the
    // theory that stock meant the listing was finished. It does not — stock is
    // inventory, not readiness — and the effect was that a vendor who chose
    // Draft, typed a quantity and pressed save had a half-written listing go
    // public. The status the vendor picked is the status that is sent. The API
    // already applies the one coercion that is actually right, in the other
    // direction: Active with no stock is saved as Out of stock.
    const status = form.status;
    const problems = {};
    if (!form.name.trim()) problems.name = 'Give the product a name.';
    if (price <= 0) problems.price = 'Enter a price above zero.';
    if (stock < 0) problems.stock = 'Stock cannot be negative.';
    // The preview below clamped the discount while the raw number was sent —
    // 150% previewed as free and saved as a negative price.
    const discount = parseFloat(form.discount) || 0;
    if (discount < 0 || discount > 100) problems.discount = 'Use a discount between 0 and 100%.';
    setFieldErrors(problems);

    if (Object.keys(problems).length) {
      setFormError('');
      // Focus the first field that needs attention, in the order they appear.
      (problems.name ? nameRef : problems.stock ? stockRef : problems.price ? priceRef : discountRef).current?.focus();
      return;
    }
    // No field owns this one — it is about the images panel.
    if (status !== 'Draft' && form.photos.length === 0) {
      return setFormError('Add at least one image before publishing — save it as a Draft to finish later.');
    }
    setFormError('');
    onSave({ ...form, id: product?.id, price, discount, stock, status, photos: form.photos });
  };

  const priceNum = parseFloat(form.price) || 0;
  const discountNum = parseFloat(form.discount) || 0;
  const payable = priceNum * (1 - Math.min(Math.max(discountNum, 0), 100) / 100);

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} noValidate>
      <VendorPageTitle eyebrow={isEdit ? 'Edit listing' : 'New listing'} title={isEdit ? 'Edit product' : 'Add new product'}>
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          {/* The button says what pressing it does. It read "Publish product"
              while the status field sat on Draft — true only because the form
              was quietly overriding the vendor's choice. */}
          <Button type="submit" variant="dark">
            {isEdit ? 'Save changes' : (form.status === 'Draft' ? 'Save draft' : 'Publish product')}
          </Button>
        </div>
      </VendorPageTitle>

      {formError && <div className="alert alert--error" role="alert" style={{ marginBottom: 'var(--space-5)' }}>{formError}</div>}

      <div className="split split--content">
        <div className="stack stack--lg">
          <VendorCard title="Core details">
            <div className="address-form__pair">
              <Input label="Name" value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="e.g. Minimalist Sofa" ref={nameRef} error={fieldErrors.name} />
              <VendorField label="Category">
                <select value={form.category} onChange={e => set('category', e.target.value)} className="field__select">
                  {categories.map(c => <option key={c}>{c}</option>)}
                </select>
              </VendorField>
              <Input label="Stock" type="number" min="0" ref={stockRef} error={fieldErrors.stock} value={String(form.stock)} onChange={e => set('stock', e.target.value)} />
              <VendorField label="Status" hint={moderated ? 'Set by an admin.' : undefined}>
                {moderated ? (
                  <select value={form.status} disabled className="field__select">
                    <option>{form.status}</option>
                  </select>
                ) : (
                  <select value={form.status} onChange={e => set('status', e.target.value)} className="field__select">
                    <option>Active</option><option>Draft</option><option>Out of stock</option>
                  </select>
                )}
              </VendorField>
            </div>
            <div style={{ marginTop: 'var(--space-5)' }}>
              <VendorField label="Description">
                <textarea value={form.description} onChange={e => set('description', e.target.value)} rows={4} placeholder="Describe how the piece looks and feels in a room." className="field__textarea" />
              </VendorField>
            </div>
          </VendorCard>

          <VendorCard title="Pricing">
            <div className="address-form__pair">
              <Input label="Price ($)" type="number" min="0" step="0.01" value={String(form.price)}
                onChange={e => set('price', e.target.value)} placeholder="0.00"
                ref={priceRef} error={fieldErrors.price} />
              <Input label="Discount (%)" type="number" min="0" max="100" step="1" ref={discountRef} error={fieldErrors.discount} value={String(form.discount)} onChange={e => set('discount', e.target.value)} placeholder="0" />
            </div>
            {/* A vendor sets a price and a discount but could not see the
                result. This is what the shopper is actually charged. */}
            {priceNum > 0 && (
              <p className="meta" style={{ marginTop: 'var(--space-4)' }} role="status">
                Shoppers pay <strong style={{ color: 'var(--ink-body)' }}>{money(payable)}</strong>
                {discountNum > 0 && <> — {discountNum}% off {money(priceNum)}</>}
              </p>
            )}
            <p className="meta" style={{ marginTop: 'var(--space-3)' }}>
              Delivery is charged at checkout at the marketplace rate ($50 standard / $90 express).
            </p>
          </VendorCard>
        </div>

        <div className="stack stack--lg">
          <VendorCard title="Colours">
            <div className="colour-add">
              <div className="colour-add__name">
                {/* "Name" twice on one screen — the product's and the
                    colour's — is two identical announcements to a screen
                    reader for two unrelated fields. */}
                <VendorField label="Colour name">
                  <input className="field__input" value={colorName} placeholder="Navy Blue"
                    onChange={e => setColorName(e.target.value)} />
                </VendorField>
              </div>
              <input type="color" className="colour-add__swatch" value={colorHex}
                onChange={e => setColorHex(e.target.value)} aria-label="Colour swatch" />
              <Button type="button" variant="brand" size="sm" onClick={addColor}>Add</Button>
            </div>
            <div className="chip-list">
              {form.colors.length === 0 && <span className="meta">No colours added yet.</span>}
              {form.colors.map(c => (
                <span key={c.name} className="chip">
                  <span className="chip__dot" style={{ background: c.hex }} aria-hidden="true" />
                  {c.name}
                  <button type="button" className="chip__remove" onClick={() => removeColor(c.name)}
                    aria-label={`Remove colour ${c.name}`}>
                    <Icon name="x" size={11} />
                  </button>
                </span>
              ))}
            </div>
            {/* Shoppers see these listed on the product page. They are not a
                selector: the order payload carries no variant. */}
            <p className="meta" style={{ marginTop: 'var(--space-4)' }}>
              Listed on the product page as the colours this piece comes in.
            </p>
          </VendorCard>

          <VendorCard title="Product images">
            <div className="dropzone">
              <p className="meta" style={{ marginBottom: 'var(--space-4)' }} role="status">
                {uploading ? 'Uploading…' : 'The first image is used as the listing thumbnail.'}
              </p>
              <input ref={fileRef} type="file" accept="image/*" onChange={onPickPhoto} className="visually-hidden" tabIndex={-1} />
              <Button type="button" variant="outline" size="sm" disabled={uploading}
                onClick={() => fileRef.current && fileRef.current.click()}>Upload image</Button>
              {uploadError && <p className="field__error" role="alert" style={{ marginTop: 'var(--space-3)' }}>{uploadError}</p>}
            </div>
            {form.photos.length > 0 && (
              <ul className="stack stack--sm list-reset" style={{ marginTop: 'var(--space-4)' }}>
                {form.photos.map((src, i) => (
                  <li key={i} className="photo-row">
                    <img src={src} alt="" />
                    <span className="meta spacer">{i === 0 ? 'Thumbnail' : `Image ${i + 1}`}</span>
                    <button type="button" className="icon-action" onClick={() => removePhoto(i)}
                      aria-label={`Remove image ${i + 1}`}>
                      <Icon name="trash" size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </VendorCard>
        </div>
      </div>
    </form>
  );
}
