// Storefront (customer) API — mounted at /api/v1.
const crypto = require('crypto');
const express = require('express');
const { db } = require('../db.js');
const { hash, compare, sign, requireRole } = require('../auth.js');
const { ApiError, assertCreds, today, round2, toStoreProduct, toBanner, toCategory } = require('../helpers.js');
const mailer = require('../mailer.js');
const { rateLimit } = require('../ratelimit.js');

// Credential endpoints: throttle guessing attempts per IP + email.
const authLimit = rateLimit({ max: 10, windowMs: 15 * 60 * 1000 });

const router = express.Router();
const h = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const requireCustomer = requireRole('store');

// Products that shoppers may see: published (not draft / flagged / pending
// review), from a vendor an admin has approved and not suspended. The admin
// overview has always told admins a pending vendor "cannot trade yet"; this
// is the rule that makes that true, and it keeps a suspended vendor — who can
// no longer sign in to fulfil anything — from taking new orders.
const VISIBLE = `('Active','Out of stock')`;
const ON_SALE = `p.status IN ${VISIBLE} AND v.status = 'Active'`;

// A product's reviews, newest first.
function productReviews(productId) {
  return db.prepare(`SELECT id, author, rating, comment, created_at FROM reviews WHERE product_id = ? ORDER BY created_at DESC, id DESC`)
    .all(productId)
    .map(r => ({ id: r.id, author: r.author, rating: r.rating, comment: r.comment, date: r.created_at }));
}

// Recompute a product's aggregate rating + count from its reviews.
function recomputeRating(productId) {
  const agg = db.prepare(`SELECT COUNT(*) AS n, COALESCE(AVG(rating), 0) AS avg FROM reviews WHERE product_id = ?`).get(productId);
  const rating = agg.n ? Math.round(agg.avg * 10) / 10 : 0;
  db.prepare(`UPDATE products SET rating = ?, review_count = ? WHERE id = ?`).run(rating, agg.n, productId);
  return { rating, reviewCount: agg.n };
}

// GET /catalog
router.get('/catalog', h((req, res) => {
  const banners = db.prepare(`SELECT * FROM banners ORDER BY sort_order, id`).all().map(toBanner);
  const categories = db.prepare(`SELECT * FROM categories ORDER BY sort_order, id`).all().map(toCategory);
  const products = db.prepare(`
    SELECT p.*, v.store AS vendor_store FROM products p
    LEFT JOIN vendors v ON v.id = p.vendor_id
    WHERE ${ON_SALE} ORDER BY p.id`).all().map(toStoreProduct);
  res.json({ banners, categories, products });
}));

// GET /products/:id  — product detail, including its reviews.
router.get('/products/:id', h((req, res) => {
  const p = db.prepare(`
    SELECT p.*, v.store AS vendor_store FROM products p
    LEFT JOIN vendors v ON v.id = p.vendor_id
    WHERE p.id = ? AND ${ON_SALE}`).get(Number(req.params.id));
  if (!p) throw new ApiError('Product not found.', 404, 'not_found');
  res.json({ ...toStoreProduct(p), reviews: productReviews(p.id) });
}));

// POST /products/:id/reviews  — a signed-in customer rates a product.
// One review per customer per product (re-submitting updates the earlier one).
router.post('/products/:id/reviews', requireCustomer, h((req, res) => {
  const productId = Number(req.params.id);
  // Only what shoppers can see can be reviewed — not a draft, a flagged
  // listing or a suspended vendor's stock reached by guessing its id.
  const p = db.prepare(`SELECT p.id FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.id = ? AND ${ON_SALE}`).get(productId);
  if (!p) throw new ApiError('Product not found.', 404, 'not_found');
  const rating = parseInt((req.body || {}).rating, 10);
  if (!(rating >= 1 && rating <= 5)) throw new ApiError('Please choose a rating from 1 to 5 stars.', 422, 'validation');
  const comment = String((req.body || {}).comment || '').trim().slice(0, 1000);

  const existing = db.prepare(`SELECT id FROM reviews WHERE product_id = ? AND user_id = ?`).get(productId, req.auth.id);
  if (existing) {
    db.prepare(`UPDATE reviews SET rating = ?, comment = ?, author = ?, created_at = ? WHERE id = ?`)
      .run(rating, comment, req.auth.name || 'Customer', today(), existing.id);
  } else {
    db.prepare(`INSERT INTO reviews (product_id, user_id, author, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(productId, req.auth.id, req.auth.name || 'Customer', rating, comment, today());
  }
  const agg = recomputeRating(productId);
  res.status(201).json({ ...agg, reviews: productReviews(productId) });
}));

// POST /auth/signup
router.post('/auth/signup', authLimit, h((req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !name.trim()) throw new ApiError('Enter your full name.', 422, 'validation');
  assertCreds(email, password);
  const exists = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email.toLowerCase());
  if (exists) throw new ApiError('An account with that email already exists.', 409, 'conflict');
  const first = name.trim().split(' ')[0];
  const info = db.prepare(`INSERT INTO users (name, email, password_hash, status, created_at) VALUES (?, ?, ?, 'Active', ?)`)
    .run(name.trim(), email.toLowerCase(), hash(password), today());
  const user = { name: first, email: email.toLowerCase() };
  mailer.welcome({ name: first, email: user.email });
  res.json({ token: sign({ id: info.lastInsertRowid, role: 'store', ...user }), user });
}));

// POST /auth/login
router.post('/auth/login', authLimit, h((req, res) => {
  const { email, password } = req.body || {};
  assertCreds(email, password);
  const row = db.prepare(`SELECT * FROM users WHERE email = ?`).get(String(email).toLowerCase());
  if (!row || !compare(password, row.password_hash)) throw new ApiError('Incorrect email or password.', 401, 'unauthorized');
  const user = { name: row.name.split(' ')[0], email: row.email };
  res.json({ token: sign({ id: row.id, role: 'store', ...user }), user });
}));

// ---- password reset ---------------------------------------------------------
const RESET_MINUTES = 60;
const sha256 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex');
// The link must point at the storefront we control. Deriving it from the
// request's Origin would let anyone mail a real user a reset link to a lookalike
// site, so production uses STORE_URL only; development falls back to the origin.
function storeUrl(req) {
  const configured = (process.env.STORE_URL || '').replace(/\/+$/, '');
  if (configured) return configured;
  if (process.env.NODE_ENV === 'production') return '';
  return String(req.headers.origin || 'http://localhost:3000').replace(/\/+$/, '');
}

// POST /auth/forgot  { email }
// Same answer whether or not the address has an account — otherwise this is a
// free way to find out who shops here.
router.post('/auth/forgot', authLimit, h(async (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError('Enter a valid email address.', 422, 'validation');
  const row = db.prepare(`SELECT id, name, email FROM users WHERE email = ?`).get(email);
  const base = storeUrl(req);
  if (row && base) {
    const token = crypto.randomBytes(32).toString('base64url');
    const now = Date.now();
    db.prepare(`DELETE FROM password_resets WHERE user_id = ? OR expires_at < ?`).run(row.id, now);
    db.prepare(`INSERT INTO password_resets (token_hash, user_id, expires_at) VALUES (?, ?, ?)`)
      .run(sha256(token), row.id, now + RESET_MINUTES * 60 * 1000);
    mailer.passwordReset({ name: row.name.split(' ')[0], email: row.email, link: `${base}/reset-password?token=${token}`, minutes: RESET_MINUTES });
  } else if (row) {
    console.error('[auth] password reset requested but STORE_URL is not set — no link can be emailed.');
  }
  res.json({ ok: true, message: 'If that address has an account, a reset link is on its way.' });
}));

// POST /auth/reset  { token, password }  → signs the customer in
router.post('/auth/reset', authLimit, h((req, res) => {
  const { token, password } = req.body || {};
  if (!password || String(password).length < 6) throw new ApiError('Password must be at least 6 characters.', 422, 'validation');
  const invalid = () => new ApiError('This reset link is invalid or has expired. Request a new one.', 400, 'invalid_token');
  if (!token || typeof token !== 'string') throw invalid();
  const reset = db.prepare(`SELECT * FROM password_resets WHERE token_hash = ?`).get(sha256(token));
  if (!reset || reset.used_at || reset.expires_at < Date.now()) throw invalid();
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(reset.user_id);
  if (!row) throw invalid();
  db.transaction(() => {
    db.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).run(hash(password), row.id);
    db.prepare(`DELETE FROM password_resets WHERE user_id = ?`).run(row.id);
  })();
  const user = { name: row.name.split(' ')[0], email: row.email };
  mailer.passwordChanged(user);
  res.json({ token: sign({ id: row.id, role: 'store', ...user }), user });
}));

// POST /auth/logout  (stateless JWT — client just drops the token)
router.post('/auth/logout', (req, res) => res.status(204).end());

// ---- delivery addresses (customer account) ---------------------------------

function toAddress(r) {
  return { id: r.id, title: r.title, street: r.street, district: r.district, line: `${r.street}, ${r.district}`, isDefault: !!r.is_default };
}

// Validate + normalise an address payload from the client.
function readAddress(body) {
  const b = body || {};
  const title = String(b.title || '').trim().slice(0, 60);
  const street = String(b.street || '').trim().slice(0, 200);
  const district = String(b.district || '').trim().slice(0, 120);
  if (!title) throw new ApiError('Give this address a label (Home, Office…).', 422, 'validation');
  if (!street) throw new ApiError('Enter the street and number.', 422, 'validation');
  if (!district) throw new ApiError('Enter the district and city.', 422, 'validation');
  return { title, street, district, isDefault: !!b.isDefault };
}

function listAddresses(userId) {
  return db.prepare(`SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id`).all(userId).map(toAddress);
}

// Keep at most one default per customer.
function clearDefaults(userId, exceptId) {
  db.prepare(`UPDATE addresses SET is_default = 0 WHERE user_id = ? AND id != ?`).run(userId, exceptId || 0);
}

// GET /addresses
router.get('/addresses', requireCustomer, h((req, res) => res.json({ addresses: listAddresses(req.auth.id) })));

// POST /addresses
router.post('/addresses', requireCustomer, h((req, res) => {
  const a = readAddress(req.body);
  const count = db.prepare(`SELECT COUNT(*) AS n FROM addresses WHERE user_id = ?`).get(req.auth.id).n;
  if (count >= 20) throw new ApiError('You have reached the maximum of 20 saved addresses.', 422, 'validation');
  const isDefault = a.isDefault || count === 0 ? 1 : 0; // first address is the default
  const info = db.prepare(`INSERT INTO addresses (user_id, title, street, district, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .run(req.auth.id, a.title, a.street, a.district, isDefault, today());
  if (isDefault) clearDefaults(req.auth.id, info.lastInsertRowid);
  res.status(201).json({ address: toAddress(db.prepare(`SELECT * FROM addresses WHERE id = ?`).get(info.lastInsertRowid)), addresses: listAddresses(req.auth.id) });
}));

// PUT /addresses/:id
router.put('/addresses/:id', requireCustomer, h((req, res) => {
  const id = Number(req.params.id);
  const own = db.prepare(`SELECT * FROM addresses WHERE id = ? AND user_id = ?`).get(id, req.auth.id);
  if (!own) throw new ApiError('Address not found.', 404, 'not_found');
  const a = readAddress(req.body);
  const isDefault = a.isDefault ? 1 : own.is_default;
  db.prepare(`UPDATE addresses SET title = ?, street = ?, district = ?, is_default = ? WHERE id = ?`)
    .run(a.title, a.street, a.district, isDefault, id);
  if (isDefault) clearDefaults(req.auth.id, id);
  res.json({ address: toAddress(db.prepare(`SELECT * FROM addresses WHERE id = ?`).get(id)), addresses: listAddresses(req.auth.id) });
}));

// DELETE /addresses/:id — if the default goes, the next address inherits it.
router.delete('/addresses/:id', requireCustomer, h((req, res) => {
  const id = Number(req.params.id);
  const own = db.prepare(`SELECT * FROM addresses WHERE id = ? AND user_id = ?`).get(id, req.auth.id);
  if (!own) throw new ApiError('Address not found.', 404, 'not_found');
  db.prepare(`DELETE FROM addresses WHERE id = ?`).run(id);
  if (own.is_default) {
    const next = db.prepare(`SELECT id FROM addresses WHERE user_id = ? ORDER BY id LIMIT 1`).get(req.auth.id);
    if (next) db.prepare(`UPDATE addresses SET is_default = 1 WHERE id = ?`).run(next.id);
  }
  res.json({ addresses: listAddresses(req.auth.id) });
}));

// ---- orders ----------------------------------------------------------------

// Resolve the delivery address for an order: a saved address id wins; otherwise
// accept an inline object/string so guest-style payloads still record something.
function resolveOrderAddress(body, userId) {
  const b = body || {};
  const id = Number(b.addressId || (b.address && b.address.id));
  if (id) {
    const row = db.prepare(`SELECT * FROM addresses WHERE id = ? AND user_id = ?`).get(id, userId);
    if (row) return `${row.title} — ${row.street}, ${row.district}`;
  }
  const a = b.address;
  if (typeof a === 'string' && a.trim()) return a.trim().slice(0, 300);
  if (a && typeof a === 'object') {
    const line = a.line || [a.street, a.district].filter(Boolean).join(', ');
    const text = [a.title, line].filter(Boolean).join(' — ').trim();
    if (text) return text.slice(0, 300);
  }
  throw new ApiError('Choose a delivery address.', 422, 'validation');
}

// GET /orders — the signed-in customer's order history, newest first.
router.get('/orders', requireCustomer, h((req, res) => {
  const rows = db.prepare(`
    SELECT o.id, o.date, o.status, o.total, o.address, o.delivery_method, v.store AS vendor
    FROM orders o LEFT JOIN vendors v ON v.id = o.vendor_id
    WHERE o.user_id = ? ORDER BY o.id DESC`).all(req.auth.id);
  const itemsOf = db.prepare(`SELECT name, qty, price FROM order_items WHERE order_id = ?`);
  res.json({
    orders: rows.map(o => ({
      id: o.id, date: o.date, status: o.status, total: o.total,
      address: o.address, deliveryMethod: o.delivery_method, vendor: o.vendor,
      items: itemsOf.all(o.id),
    })),
  });
}));

// POST /orders  — split into one order per vendor; returns a combined summary.
router.post('/orders', requireCustomer, h((req, res) => {
  const { items, deliveryMethod } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) throw new ApiError('Your cart is empty.', 422, 'validation');
  const address = resolveOrderAddress(req.body, req.auth.id);

  const byVendor = new Map();
  let overall = 0;
  for (const it of items) {
    const qty = Math.max(1, parseInt(it.qty, 10) || 1);
    const p = db.prepare(`SELECT p.*, v.status AS vendor_status FROM products p LEFT JOIN vendors v ON v.id = p.vendor_id WHERE p.id = ?`).get(Number(it.productId));
    if (!p) throw new ApiError(`A product in your cart is no longer available.`, 422, 'validation');
    if (!['Active', 'Out of stock'].includes(p.status) || p.vendor_status !== 'Active') throw new ApiError(`"${p.name}" is no longer available.`, 422, 'validation');
    if (p.stock < qty) throw new ApiError(`Only ${p.stock} left of "${p.name}".`, 422, 'validation');
    const line = round2(p.price * (1 - (p.discount || 0) / 100) * qty);
    overall += line;
    if (!byVendor.has(p.vendor_id)) byVendor.set(p.vendor_id, []);
    byVendor.get(p.vendor_id).push({ product: p, qty, line });
  }

  const method = deliveryMethod === 'express' ? 'express' : 'standard';
  const delivery = method === 'express' ? 90 : 50;
  const date = today();
  const customer = req.auth.name || 'Customer';

  const oIns = db.prepare(`INSERT INTO orders (user_id, vendor_id, customer, date, status, total, address, delivery_method) VALUES (?, ?, ?, ?, 'Processing', ?, ?, ?)`);
  const oiIns = db.prepare(`INSERT INTO order_items (order_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)`);
  const stockUpd = db.prepare(`UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?`);
  const soldOut = db.prepare(`UPDATE products SET status = 'Out of stock', updated_at = ? WHERE id = ? AND stock <= 0 AND status = 'Active'`);

  let firstId = null;
  const placed = [];
  const tx = db.transaction(() => {
    for (const [vendorId, lines] of byVendor) {
      const subtotal = round2(lines.reduce((s, l) => s + l.line, 0));
      const info = oIns.run(req.auth.id, vendorId, customer, date, subtotal, address, method);
      if (firstId === null) firstId = info.lastInsertRowid;
      for (const l of lines) {
        oiIns.run(info.lastInsertRowid, l.product.id, l.product.name, l.qty, round2(l.line / l.qty));
        stockUpd.run(l.qty, l.product.id);
        soldOut.run(new Date().toISOString(), l.product.id);
      }
      placed.push({ id: info.lastInsertRowid, total: subtotal, items: lines.map(l => ({ name: l.product.name, qty: l.qty, price: round2(l.line / l.qty) })) });
    }
  });
  tx();

  const total = round2(overall + delivery);

  // Notify admins (and the customer) — best-effort, never blocks the response.
  const summary = {
    id: firstId, ids: placed.map(o => o.id), date, total, deliveryMethod: method, address,
    items: placed.flatMap(o => o.items),
    customer: { name: customer, email: req.auth.email },
  };
  // The order is already committed — nothing below here may fail the response.
  try {
    mailer.orderPlacedAdmin(summary);
    mailer.orderConfirmationCustomer(summary);
  } catch (err) {
    console.error('[orders] order', firstId, 'was placed but notification failed:', err.message);
  }

  res.json({ id: firstId, status: 'Processing', date, total, address, deliveryMethod: method, orders: placed.map(o => o.id) });
}));

module.exports = router;
