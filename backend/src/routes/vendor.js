// Vendor console API — mounted at /api/v1/vendor. Scoped to the signed-in store.
const express = require('express');
const mailer = require('../mailer.js');
const { db } = require('../db.js');
const { hash, compare, sign, requireRole } = require('../auth.js');
const { upload, fileUrl } = require('../upload.js');
const { ApiError, EMAIL, assertCreds, num, int, today, toVendorProduct } = require('../helpers.js');

const { rateLimit } = require('../ratelimit.js');

const router = express.Router();
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// The token proves who signed in, not that they still may. Checked on every
// request so a suspension or removal takes effect now, not when a 30-day
// token runs out — and a removed vendor's token gets a clean 401 instead of
// a foreign-key error from whatever it tried to write.
const tokenIsVendor = requireRole('vendor');
const requireVendor = (req, res, next) => tokenIsVendor(req, res, () => {
  const v = db.prepare(`SELECT status FROM vendors WHERE id = ?`).get(req.auth.id);
  if (!v) return res.status(401).json({ message: 'Your session has expired. Please sign in again.', code: 'unauthorized' });
  if (v.status === 'Suspended') return res.status(403).json({ message: 'This vendor account has been suspended.', code: 'suspended' });
  next();
});

function vendorRow(id) { return db.prepare(`SELECT * FROM vendors WHERE id = ?`).get(id); }
function storeShape(v) {
  return { name: v.store, handle: v.handle, description: v.description, address: v.address, email: v.email, phone: v.phone, since: v.since, status: v.status };
}
function orderShape(o) {
  const items = db.prepare(`SELECT name, qty, price FROM order_items WHERE order_id = ?`).all(o.id)
    .map(i => ({ name: i.name, qty: i.qty, price: i.price }));
  // address + deliveryMethod are what the vendor actually ships against.
  return {
    id: o.id, customer: o.customer, date: o.date, status: o.status, total: o.total,
    address: o.address, deliveryMethod: o.delivery_method, items,
  };
}
const STATUSES = ['Active', 'Draft', 'Out of stock'];
const MODERATED = ['Flagged', 'Pending review'];
const ORDER_STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
const NEXT_ORDER_STATUS = { Processing: ['Shipped', 'Cancelled'], Shipped: ['Delivered'] };

// POST /auth/login
router.post('/auth/login', rateLimit({ max: 10, windowMs: 15 * 60 * 1000 }), h((req, res) => {
  const { email, password } = req.body || {};
  assertCreds(email, password);
  const v = db.prepare(`SELECT * FROM vendors WHERE email = ?`).get(String(email).toLowerCase());
  if (!v || !compare(password, v.password_hash)) throw new ApiError('Incorrect email or password.', 401, 'unauthorized');
  if (v.status === 'Suspended') throw new ApiError('This vendor account has been suspended.', 403, 'suspended');
  const user = { name: v.manager || v.store, email: v.email, role: 'vendor' };
  res.json({ token: sign({ id: v.id, role: 'vendor', email: v.email, name: user.name }), user });
}));

// PUT /auth/password  { current, password }
router.put('/auth/password', requireVendor, rateLimit({ max: 10, windowMs: 15 * 60 * 1000 }), h((req, res) => {
  const { current, password } = req.body || {};
  if (!password || String(password).length < 6) throw new ApiError('Password must be at least 6 characters.', 422, 'validation');
  const row = db.prepare(`SELECT * FROM vendors WHERE id = ?`).get(req.auth.id);
  if (!row || !compare(current, row.password_hash)) throw new ApiError('Your current password is not right.', 403, 'wrong_password');
  db.prepare(`UPDATE vendors SET password_hash = ? WHERE id = ?`).run(hash(password), row.id);
  res.json({ ok: true });
}));

// POST /auth/logout
router.post('/auth/logout', (req, res) => res.status(204).end());

// GET /dashboard
router.get('/dashboard', requireVendor, h((req, res) => {
  const v = vendorRow(req.auth.id);
  if (!v) throw new ApiError('Vendor not found.', 404, 'not_found');
  const products = db.prepare(`SELECT * FROM products WHERE vendor_id = ? ORDER BY id DESC`).all(v.id).map(toVendorProduct);
  const orders = db.prepare(`SELECT * FROM orders WHERE vendor_id = ? ORDER BY id DESC`).all(v.id).map(orderShape);
  // Category options: the marketplace rooms plus a couple vendor-friendly extras.
  const base = db.prepare(`SELECT name FROM categories ORDER BY sort_order, id`).all().map(r => r.name);
  const extra = ['Office'];
  const categories = [...new Set([...base, ...extra])];
  res.json({ store: storeShape(v), categories, products, orders });
}));

// Shared insert/update payload from the product form.
function readProduct(body) {
  const name = (body.name || '').trim();
  if (!name) throw new ApiError('Product name is required.', 422, 'validation');
  const price = num(body.price);
  if (price <= 0) throw new ApiError('Enter a valid price.', 422, 'validation');
  const stock = int(body.stock);
  if (stock < 0) throw new ApiError('Stock cannot be negative.', 422, 'validation');
  const discount = num(body.discount);
  // Over 100% is a negative price; the form never meant to allow it.
  if (discount < 0 || discount > 100) throw new ApiError('Use a discount between 0 and 100%.', 422, 'validation');
  let status = STATUSES.includes(body.status) ? body.status : 'Draft';
  if (stock <= 0 && status === 'Active') status = 'Out of stock';
  const photos = Array.isArray(body.photos) ? body.photos.filter(Boolean) : [];
  const colors = Array.isArray(body.colors) ? body.colors : [];
  return {
    name, category: body.category || null, price, discount, stock, status,
    description: body.description || '', colors: JSON.stringify(colors), photos: JSON.stringify(photos),
    image: photos[0] || null,
  };
}

// POST /products
router.post('/products', requireVendor, h((req, res) => {
  const p = readProduct(req.body || {});
  const now = new Date().toISOString();
  const info = db.prepare(`INSERT INTO products (vendor_id, name, category, price, discount, stock, rating, review_count, status, description, image, colors, photos, created_at, updated_at)
                           VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, ?, ?, ?, ?, ?)`)
    .run(req.auth.id, p.name, p.category, p.price, p.discount, p.stock, p.status, p.description, p.image, p.colors, p.photos, now, now);
  const row = db.prepare(`SELECT * FROM products WHERE id = ?`).get(info.lastInsertRowid);
  res.json(toVendorProduct(row));
}));

// PUT /products/:id
router.put('/products/:id', requireVendor, h((req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare(`SELECT * FROM products WHERE id = ? AND vendor_id = ?`).get(id, req.auth.id);
  if (!existing) throw new ApiError('Product not found.', 404, 'not_found');
  const p = readProduct(req.body || {});
  // Flagged and pending-review are an admin's decision. A vendor may keep
  // editing the listing, but saving it used to set the status straight back
  // to Active (lifting the flag) — or, sent unchanged, to Draft (losing it).
  if (MODERATED.includes(existing.status)) p.status = existing.status;
  // Stamped on every edit, so the sitemap can tell crawlers when a listing
  // actually changed instead of claiming they all changed an hour ago.
  db.prepare(`UPDATE products SET name=?, category=?, price=?, discount=?, stock=?, status=?, description=?, image=?, colors=?, photos=?, updated_at=? WHERE id = ?`)
    .run(p.name, p.category, p.price, p.discount, p.stock, p.status, p.description, p.image, p.colors, p.photos, new Date().toISOString(), id);
  res.json(toVendorProduct(db.prepare(`SELECT * FROM products WHERE id = ?`).get(id)));
}));

// DELETE /products/:id
router.delete('/products/:id', requireVendor, h((req, res) => {
  const info = db.prepare(`DELETE FROM products WHERE id = ? AND vendor_id = ?`).run(Number(req.params.id), req.auth.id);
  if (info.changes === 0) throw new ApiError('Product not found.', 404, 'not_found');
  res.status(204).end();
}));

// PATCH /orders/:id
router.patch('/orders/:id', requireVendor, h((req, res) => {
  const id = Number(req.params.id);
  const status = (req.body || {}).status;
  if (!ORDER_STATUSES.includes(status)) throw new ApiError('Invalid order status.', 422, 'validation');
  const o = db.prepare(`SELECT * FROM orders WHERE id = ? AND vendor_id = ?`).get(id, req.auth.id);
  if (!o) throw new ApiError('Order not found.', 404, 'not_found');
  // Orders move forward only — the console offers nothing else, and the API
  // used to accept anything, so a delivered order could be "un-shipped" and a
  // cancelled one revived without its stock. Re-saving the current status is
  // a harmless no-op.
  if (o.status !== status && !(NEXT_ORDER_STATUS[o.status] || []).includes(status)) {
    throw new ApiError(`An order that is ${o.status} cannot be marked ${status}.`, 409, 'conflict');
  }
  db.transaction(() => {
    db.prepare(`UPDATE orders SET status = ? WHERE id = ?`).run(status, id);
    // A cancelled order gives its pieces back, and a listing this order had
    // sold out goes back on sale.
    if (status === 'Cancelled' && o.status !== 'Cancelled') {
      const now = new Date().toISOString();
      for (const it of db.prepare(`SELECT product_id, qty FROM order_items WHERE order_id = ?`).all(id)) {
        if (!it.product_id) continue;
        db.prepare(`UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ?`).run(it.qty, now, it.product_id);
        db.prepare(`UPDATE products SET status = 'Active' WHERE id = ? AND status = 'Out of stock' AND stock > 0`).run(it.product_id);
      }
    }
  })();
  const shaped = orderShape(db.prepare(`SELECT * FROM orders WHERE id = ?`).get(id));
  // Only on a real change — re-saving "Shipped" must not re-send the email.
  if (o.status !== status) {
    try {
      const customer = o.user_id ? db.prepare(`SELECT name, email FROM users WHERE id = ?`).get(o.user_id) : null;
      const vendor = db.prepare(`SELECT store FROM vendors WHERE id = ?`).get(req.auth.id);
      if (customer) mailer.orderStatusCustomer({ order: shaped, status, customer: { name: customer.name.split(' ')[0], email: customer.email }, vendor: vendor && vendor.store });
    } catch (err) { console.error('[orders] status email for', id, 'failed:', err.message); }
  }
  res.json(shaped);
}));

// PUT /store
router.put('/store', requireVendor, h((req, res) => {
  const s = req.body || {};
  const v = vendorRow(req.auth.id);
  if (!v) throw new ApiError('Vendor not found.', 404, 'not_found');
  // The email is the vendor's login, so it has to stay unique and valid.
  if (s.email && String(s.email).toLowerCase() !== v.email) {
    const email = String(s.email).toLowerCase();
    if (!EMAIL.test(email)) throw new ApiError('Enter a valid email address.', 422, 'validation');
    if (db.prepare(`SELECT id FROM vendors WHERE email = ? AND id != ?`).get(email, v.id)) {
      throw new ApiError('Another vendor already uses that email address.', 409, 'conflict');
    }
    s.email = email;
  }
  db.prepare(`UPDATE vendors SET store=?, description=?, address=?, email=?, phone=?, since=?, handle=? WHERE id = ?`)
    .run(
      (s.name || v.store), (s.description ?? v.description), (s.address ?? v.address),
      (s.email || v.email), (s.phone ?? v.phone), (s.since ?? v.since), (s.handle ?? v.handle), v.id,
    );
  res.json(storeShape(vendorRow(v.id)));
}));

// POST /uploads  (multipart/form-data, field name "file")
router.post('/uploads', requireVendor, upload.single('file'), h((req, res) => {
  if (!req.file) throw new ApiError('No file was uploaded.', 422, 'validation');
  res.json({ url: fileUrl(req, req.file.filename) });
}));

module.exports = router;
