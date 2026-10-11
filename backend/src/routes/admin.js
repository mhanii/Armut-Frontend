// Admin console API — mounted at /api/v1/admin. Full marketplace oversight
// plus site-content (home slider + rooms) management.
const express = require('express');
const { db } = require('../db.js');
const { hash, compare, sign, requireRole } = require('../auth.js');
const { upload, fileUrl } = require('../upload.js');
const { ApiError, assertCreds, toAdminProduct, toBanner, toCategory } = require('../helpers.js');

const { rateLimit } = require('../ratelimit.js');

const router = express.Router();
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const requireAdmin = requireRole('admin');

const VENDOR_STATUSES = ['Active', 'Pending', 'Suspended'];
const PRODUCT_STATUSES = ['Active', 'Draft', 'Out of stock', 'Flagged', 'Pending review'];

function adminVendor(v) {
  return { id: v.id, store: v.store, manager: v.manager, email: v.email, city: v.city, joined: v.joined, products: v.products, sales: v.sales, status: v.status };
}
function vendorWithStats(id) {
  return db.prepare(`
    SELECT v.*,
      (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id) AS products,
      (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.vendor_id = v.id) AS sales
    FROM vendors v WHERE v.id = ?`).get(id);
}
function adminProductRow(id) {
  return db.prepare(`SELECT p.*, v.store AS vendor_store FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.id = ?`).get(id);
}

// POST /auth/login
router.post('/auth/login', rateLimit({ max: 10, windowMs: 15 * 60 * 1000 }), h((req, res) => {
  const { email, password } = req.body || {};
  assertCreds(email, password);
  const a = db.prepare(`SELECT * FROM admins WHERE email = ?`).get(String(email).toLowerCase());
  if (!a || !compare(password, a.password_hash)) throw new ApiError('Incorrect email or password.', 401, 'unauthorized');
  const user = { name: a.name, email: a.email, role: 'admin' };
  res.json({ token: sign({ id: a.id, role: 'admin', email: a.email, name: a.name }), user });
}));

// PUT /auth/password  { current, password }
router.put('/auth/password', requireAdmin, rateLimit({ max: 10, windowMs: 15 * 60 * 1000 }), h((req, res) => {
  const { current, password } = req.body || {};
  if (!password || String(password).length < 6) throw new ApiError('Password must be at least 6 characters.', 422, 'validation');
  const row = db.prepare(`SELECT * FROM admins WHERE id = ?`).get(req.auth.id);
  if (!row || !compare(current, row.password_hash)) throw new ApiError('Your current password is not right.', 403, 'wrong_password');
  db.prepare(`UPDATE admins SET password_hash = ? WHERE id = ?`).run(hash(password), row.id);
  res.json({ ok: true });
}));

// POST /auth/logout
router.post('/auth/logout', (req, res) => res.status(204).end());

// GET /overview
router.get('/overview', requireAdmin, h((req, res) => {
  const vendors = db.prepare(`
    SELECT v.*,
      (SELECT COUNT(*) FROM products p WHERE p.vendor_id = v.id) AS products,
      (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.vendor_id = v.id) AS sales
    FROM vendors v ORDER BY v.id`).all().map(adminVendor);

  const products = db.prepare(`SELECT p.*, v.store AS vendor_store FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id ORDER BY p.id`).all().map(toAdminProduct);

  const orders = db.prepare(`
    SELECT o.id, o.customer, o.date, o.status, o.total, o.address, o.delivery_method, v.store AS vendor,
      (SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id) AS items
    FROM orders o LEFT JOIN vendors v ON v.id = o.vendor_id ORDER BY o.id DESC`).all()
    .map(o => ({
      id: o.id, customer: o.customer, date: o.date, status: o.status, total: o.total,
      address: o.address, deliveryMethod: o.delivery_method, vendor: o.vendor, items: o.items,
    }));

  const clients = db.prepare(`
    SELECT u.id, u.name, u.email, u.created_at AS joined,
      (SELECT COUNT(*) FROM orders o WHERE o.user_id = u.id) AS orders,
      (SELECT COALESCE(SUM(o.total), 0) FROM orders o WHERE o.user_id = u.id) AS spent
    FROM users u ORDER BY u.id`).all()
    .map(c => ({ ...c, spent: Math.round(c.spent * 100) / 100, status: c.spent >= 2000 ? 'VIP' : 'Active' }));

  res.json({ vendors, products, orders, clients });
}));

// POST /vendors  — create (invite) a new vendor account
router.post('/vendors', requireAdmin, h((req, res) => {
  const b = req.body || {};
  const store = (b.store || '').trim();
  if (!store) throw new ApiError('Store name is required.', 422, 'validation');
  assertCreds(b.email, b.password); // valid email + password ≥ 6 chars
  const email = String(b.email).toLowerCase();
  if (db.prepare(`SELECT id FROM vendors WHERE email = ?`).get(email)) throw new ApiError('A vendor with that email already exists.', 409, 'conflict');
  const status = VENDOR_STATUSES.includes(b.status) ? b.status : 'Pending';
  const handle = store.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'vendor';
  const joined = new Date().toISOString().slice(0, 10);
  const since = String(new Date().getFullYear());
  const info = db.prepare(`
    INSERT INTO vendors (store, handle, manager, email, password_hash, city, description, address, phone, since, joined, status)
    VALUES (?, ?, ?, ?, ?, ?, '', '', '', ?, ?, ?)`)
    .run(store, handle, (b.manager || '').trim(), email, hash(b.password), (b.city || '').trim(), since, joined, status);
  res.status(201).json(adminVendor(vendorWithStats(info.lastInsertRowid)));
}));

// PATCH /vendors/:id
router.patch('/vendors/:id', requireAdmin, h((req, res) => {
  const id = Number(req.params.id);
  const status = (req.body || {}).status;
  if (!VENDOR_STATUSES.includes(status)) throw new ApiError('Invalid vendor status.', 422, 'validation');
  const info = db.prepare(`UPDATE vendors SET status = ? WHERE id = ?`).run(status, id);
  if (info.changes === 0) throw new ApiError('Vendor not found.', 404, 'not_found');
  res.json(adminVendor(vendorWithStats(id)));
}));

// DELETE /vendors/:id  — removes the vendor and cascades to their products
router.delete('/vendors/:id', requireAdmin, h((req, res) => {
  const info = db.prepare(`DELETE FROM vendors WHERE id = ?`).run(Number(req.params.id));
  if (info.changes === 0) throw new ApiError('Vendor not found.', 404, 'not_found');
  res.status(204).end();
}));

// PATCH /products/:id
router.patch('/products/:id', requireAdmin, h((req, res) => {
  const id = Number(req.params.id);
  const status = (req.body || {}).status;
  if (!PRODUCT_STATUSES.includes(status)) throw new ApiError('Invalid product status.', 422, 'validation');
  const current = db.prepare(`SELECT status, stock FROM products WHERE id = ?`).get(id);
  if (!current) throw new ApiError('Listing not found.', 404, 'not_found');
  // A draft is not on sale, so there is nothing to flag — and flagging one
  // used to be a back door: clearing the flag set it Active and published a
  // listing its vendor had not chosen to publish.
  if (current.status === 'Draft' && status !== 'Draft') {
    throw new ApiError('Drafts are not on sale, so they cannot be moderated. The vendor publishes them.', 409, 'conflict');
  }
  // Reinstating an empty listing puts it back as sold out, not as buyable.
  const next = status === 'Active' && current.stock <= 0 ? 'Out of stock' : status;
  db.prepare(`UPDATE products SET status = ?, updated_at = ? WHERE id = ?`)
    .run(next, new Date().toISOString(), id);
  res.json(toAdminProduct(adminProductRow(id)));
}));

// DELETE /products/:id
router.delete('/products/:id', requireAdmin, h((req, res) => {
  const info = db.prepare(`DELETE FROM products WHERE id = ?`).run(Number(req.params.id));
  if (info.changes === 0) throw new ApiError('Listing not found.', 404, 'not_found');
  res.status(204).end();
}));

// ---- site content: home slider + rooms ------------------------------------

// GET /content
router.get('/content', requireAdmin, h((req, res) => {
  const banners = db.prepare(`SELECT * FROM banners ORDER BY sort_order, id`).all().map(toBanner);
  const categories = db.prepare(`SELECT * FROM categories ORDER BY sort_order, id`).all().map(toCategory);
  res.json({ banners, categories });
}));

// PUT /content  — replaces the slider and rooms wholesale from the editor.
router.put('/content', requireAdmin, h((req, res) => {
  const body = req.body || {};
  const banners = Array.isArray(body.banners) ? body.banners : null;
  const categories = Array.isArray(body.categories) ? body.categories : null;

  const tx = db.transaction(() => {
    if (banners) {
      db.prepare(`DELETE FROM banners`).run();
      const ins = db.prepare(`INSERT INTO banners (title, subtitle, image, sort_order) VALUES (?, ?, ?, ?)`);
      banners.forEach((b, i) => {
        const title = (b.title || '').trim();
        if (!title) throw new ApiError('Every slide needs a title.', 422, 'validation');
        ins.run(title, b.subtitle || '', b.image || '', i);
      });
    }
    if (categories) {
      db.prepare(`DELETE FROM categories`).run();
      const ins = db.prepare(`INSERT INTO categories (name, image, sort_order) VALUES (?, ?, ?)`);
      categories.forEach((c, i) => {
        const name = (c.name || '').trim();
        if (!name) throw new ApiError('Every room needs a name.', 422, 'validation');
        ins.run(name, c.image || '', i);
      });
    }
  });
  tx();

  res.json({
    banners: db.prepare(`SELECT * FROM banners ORDER BY sort_order, id`).all().map(toBanner),
    categories: db.prepare(`SELECT * FROM categories ORDER BY sort_order, id`).all().map(toCategory),
  });
}));

// POST /uploads  (multipart/form-data, field name "file")
router.post('/uploads', requireAdmin, upload.single('file'), h((req, res) => {
  if (!req.file) throw new ApiError('No file was uploaded.', 422, 'validation');
  res.json({ url: fileUrl(req, req.file.filename) });
}));

module.exports = router;
