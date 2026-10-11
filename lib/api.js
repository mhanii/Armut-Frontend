// Armut API client. Every screen talks ONLY to `api` — never to fixtures directly.
// mode 'mock'  → served from the imported fixtures with realistic latency + validation.
// mode 'live'  → fetch() against the REST endpoints in the API contract.
// Each console (store | vendor | admin) keeps its own scoped session.
import { ArmutConfig } from './config.js';

// The demo fixtures are development-only: ~16 KB of fake products, vendors and
// customer emails that used to ship to every production browser even though
// the mock branches can never run there (the mock/live switch is compiled out
// of a production build). Loading them on demand lets the bundler split them
// into a chunk production never requests.
//
// Every mock branch starts with `await wait()` and every live branch returns
// before it, so that line is the one reliable place to load them.
let FIXTURES = null;
async function fixtures() {
  if (!FIXTURES) {
    const [MockData, VendorData, AdminData] = await Promise.all([
      import('./mockData.js'), import('./vendorData.js'), import('./adminData.js'),
    ]);
    FIXTURES = { MockData, VendorData, AdminData };
  }
  return FIXTURES;
}

const cfg = ArmutConfig;

// A shopper does not need the API's hostname, and a production error page is
// not the place to print it. The URL still shows where the mock/live switch
// exists, which is exactly where someone would want it.
function netMessage() {
  return cfg.canOverride
    ? 'Network error — could not reach ' + cfg.baseUrl + '.'
    : 'We could not reach the server. Check your connection and try again.';
}

export class ApiError extends Error {
  constructor(message, status, code) { super(message); this.name = 'ApiError'; this.status = status || 0; this.code = code || 'error'; }
}

function makeSession(scope) {
  const SKEY = 'armut.session.' + scope;
  const readS = () => { try { return JSON.parse(localStorage.getItem(SKEY)) || null; } catch (e) { return null; } };
  return {
    user() { const s = readS(); return (s && s.user) || null; },
    token() { const s = readS(); return (s && s.token) || null; },
    set(s) { try { localStorage.setItem(SKEY, JSON.stringify(s)); } catch (e) {} },
    clear() { try { localStorage.removeItem(SKEY); } catch (e) {} },
  };
}
const storeSession = makeSession('store');
const vendorSession = makeSession('vendor');
const adminSession = makeSession('admin');

async function http(path, opt, sess) {
  opt = opt || {};
  if (!cfg.baseUrl) throw new ApiError('No API base URL configured — open the API switch (bottom-left) and set one.', 0, 'config');
  const headers = { Accept: 'application/json' };
  if (opt.body) headers['Content-Type'] = 'application/json';
  const t = sess && sess.token();
  if (opt.auth !== false && t) headers.Authorization = 'Bearer ' + t;
  let res;
  try { res = await fetch(cfg.baseUrl + path, { method: opt.method || 'GET', headers, body: opt.body ? JSON.stringify(opt.body) : undefined }); }
  catch (e) { throw new ApiError(netMessage(), 0, 'network'); }
  if (res.status === 401) {
    // A blanket "your session has expired" was wrong on the one request where
    // 401 is most common: signing in. The server already says "Incorrect email
    // or password" — prefer it, and only claim expiry when a session really
    // was there and is now being cleared.
    const hadSession = Boolean(sess && sess.token());
    if (sess) sess.clear();
    let body = null;
    try { body = await res.json(); } catch (e) {}
    const message = (body && (body.message || body.error))
      || (hadSession ? 'Your session has expired. Please sign in again.' : 'Please sign in to continue.');
    throw new ApiError(message, 401, (body && body.code) || 'unauthorized');
  }
  let data = null;
  try { data = res.status === 204 ? null : await res.json(); } catch (e) {}
  // A suspension ends the session the same way expiry does: the console goes
  // back to its sign-in screen, which then shows why.
  if (res.status === 403 && data && data.code === 'suspended' && sess && sess.token()) {
    sess.clear();
    throw new ApiError(data.message || 'This account has been suspended.', 401, 'suspended');
  }
  if (!res.ok) throw new ApiError((data && (data.message || data.error)) || 'Request failed (' + res.status + ')', res.status, data && data.code);
  return data;
}

// Multipart upload (images). Sends FormData with the session bearer token.
async function httpUpload(path, file, sess) {
  if (!cfg.baseUrl) throw new ApiError('No API base URL configured — open the API switch (bottom-left) and set one.', 0, 'config');
  const fd = new FormData();
  fd.append('file', file);
  const headers = {};
  const t = sess && sess.token();
  if (t) headers.Authorization = 'Bearer ' + t;
  let res;
  try { res = await fetch(cfg.baseUrl + path, { method: 'POST', headers, body: fd }); }
  catch (e) { throw new ApiError(netMessage(), 0, 'network'); }
  if (res.status === 401) {
    // A blanket "your session has expired" was wrong on the one request where
    // 401 is most common: signing in. The server already says "Incorrect email
    // or password" — prefer it, and only claim expiry when a session really
    // was there and is now being cleared.
    const hadSession = Boolean(sess && sess.token());
    if (sess) sess.clear();
    let body = null;
    try { body = await res.json(); } catch (e) {}
    const message = (body && (body.message || body.error))
      || (hadSession ? 'Your session has expired. Please sign in again.' : 'Please sign in to continue.');
    throw new ApiError(message, 401, (body && body.code) || 'unauthorized');
  }
  let data = null;
  try { data = await res.json(); } catch (e) {}
  if (!res.ok) throw new ApiError((data && (data.message || data.error)) || 'Upload failed (' + res.status + ')', res.status, data && data.code);
  return data;
}

// Mock-mode upload: read the file into a data URL so previews still work offline.
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(new ApiError('Could not read the selected file.', 0, 'read'));
    r.readAsDataURL(file);
  });
}

// ---- mock engine (page-lifetime persistence of mutations) ----
const clone = o => JSON.parse(JSON.stringify(o));
const db = {};
const table = (k, src) => db[k] || (db[k] = clone(src || []));
const wait = () => new Promise(r => setTimeout(r, 250 + Math.random() * 300));
const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
function creds(email, password) {
  if (!EMAIL.test(email || '')) throw new ApiError('Enter a valid email address.', 422, 'validation');
  if (!password || password.length < 6) throw new ApiError('Password must be at least 6 characters.', 422, 'validation');
}
const nameFrom = e => { const n = e.split('@')[0].replace(/[._-]+/g, ' ').trim(); return n ? n[0].toUpperCase() + n.slice(1) : 'Guest'; };
const mkSession = (sess, user) => { const s = { token: 'mock.' + Math.random().toString(36).slice(2) + '.' + Date.now(), user }; sess.set(s); return s; };
let nextOrderId = 1043;

// Mock reviews: synthesized deterministically so a product's listed reviews are
// consistent with its rating/count (mirrors the backend, which stores real rows).
const REVIEW_AUTHORS = ['Ada Y.', 'Mert D.', 'Elif K.', 'Can Ö.', 'Zeynep A.', 'Deniz Ş.', 'Burak T.', 'Selin M.', 'Kaan R.', 'Ece B.', 'Ozan V.', 'Lale N.'];
const REVIEW_COMMENTS = [
  'Beautiful craftsmanship — even better in person.', 'Solid and well made. Delivery was smooth.',
  'Exactly as pictured. Very happy with it.', 'Great quality for the price. Would buy again.',
  'The finish is gorgeous and it feels really sturdy.', 'Comfortable and stylish. Fits our space perfectly.',
  'Arrived on time and packaged carefully.', 'Lovely piece, a little smaller than I expected.',
  'Warm, natural materials. You can tell it is handmade.', 'Looks elegant and the colour is spot on.', '', '',
];
function synthReviews(p) {
  const count = p.reviewCount || 0, target = p.rating || 0;
  const base = Math.max(3, Math.min(5, Math.floor(target)));
  const highs = base >= 5 ? 0 : Math.round((target - base) * count);
  const out = [];
  for (let i = 0; i < count; i++) {
    const rating = Math.min(5, i < highs ? base + 1 : base);
    const date = new Date(Date.now() - ((i * 9 + 7) % 240 + 1) * 86400000).toISOString().slice(0, 10);
    out.push({ id: 'seed-' + p.id + '-' + i, author: REVIEW_AUTHORS[i % REVIEW_AUTHORS.length], rating, comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length], date });
  }
  return out;
}
const aggregate = (reviews) => reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;

let nextAddressId = 1;
// Mock addresses live for the page lifetime, mirroring the backend's rules:
// one default per customer, the first saved address becomes it.
const mockAddresses = () => table('store.addresses', []);
const addrLine = a => `${a.street}, ${a.district}`;
function readAddress(a) {
  const title = String((a && a.title) || '').trim();
  const street = String((a && a.street) || '').trim();
  const district = String((a && a.district) || '').trim();
  if (!title) throw new ApiError('Give this address a label (Home, Office\u2026).', 422, 'validation');
  if (!street) throw new ApiError('Enter the street and number.', 422, 'validation');
  if (!district) throw new ApiError('Enter the district and city.', 422, 'validation');
  return { title, street, district, isDefault: !!(a && a.isDefault) };
}
const sortAddresses = list => list.slice().sort((x, y) => (y.isDefault ? 1 : 0) - (x.isDefault ? 1 : 0) || x.id - y.id);

const store = {
  async getCatalog() {
    if (cfg.isLive()) return http('/api/v1/catalog', {}, storeSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    return { banners: clone(table('admin.banners', MockData.banners)), categories: clone(table('admin.categories', MockData.categories)), products: clone(table('store.products', MockData.products)) };
  },
  async getProduct(id) {
    if (cfg.isLive()) return http('/api/v1/products/' + id, {}, storeSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); const p = table('store.products', MockData.products).find(x => x.id === Number(id));
    if (!p) throw new ApiError('Product not found.', 404, 'not_found');
    const reviews = table('store.reviews.' + p.id, synthReviews(p));
    p.reviewCount = reviews.length; p.rating = aggregate(reviews);
    return Object.assign(clone(p), { reviews: clone(reviews) });
  },
  async addReview(productId, { rating, comment }) {
    if (cfg.isLive()) return http('/api/v1/products/' + productId + '/reviews', { method: 'POST', body: { rating, comment } }, storeSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (!storeSession.token()) throw new ApiError('Please sign in to leave a review.', 401, 'unauthorized');
    const r = parseInt(rating, 10);
    if (!(r >= 1 && r <= 5)) throw new ApiError('Please choose a rating from 1 to 5 stars.', 422, 'validation');
    const prod = table('store.products', MockData.products).find(x => x.id === Number(productId));
    if (!prod) throw new ApiError('Product not found.', 404, 'not_found');
    const reviews = table('store.reviews.' + productId, synthReviews(prod));
    const author = (storeSession.user() || {}).name || 'You';
    const entry = { id: 'me-' + Date.now(), author, rating: r, comment: String(comment || '').trim(), date: new Date().toISOString().slice(0, 10), mine: true };
    const mine = reviews.find(x => x.mine);
    if (mine) Object.assign(mine, entry); else reviews.unshift(entry);
    prod.reviewCount = reviews.length; prod.rating = aggregate(reviews);
    return { rating: prod.rating, reviewCount: prod.reviewCount, reviews: clone(reviews) };
  },
  async login(email, password) {
    if (cfg.isLive()) { const s = await http('/api/v1/auth/login', { method: 'POST', body: { email, password }, auth: false }, storeSession); storeSession.set(s); return s; }
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); creds(email, password); return mkSession(storeSession, { name: nameFrom(email), email });
  },
  async signup({ name, email, password }) {
    if (cfg.isLive()) {
      const r = await http('/api/v1/auth/signup', { method: 'POST', body: { name, email, password }, auth: false }, storeSession);
      // With email verification on, the server answers with a pending result
      // and no session: the account exists but must enter its emailed code.
      if (r && r.verify) return r;
      storeSession.set(r); return r;
    }
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (!name || !name.trim()) throw new ApiError('Enter your full name.', 422, 'validation');
    creds(email, password); return mkSession(storeSession, { name: name.trim().split(' ')[0], email });
  },
  async verifyEmail(email, code) {
    if (cfg.isLive()) { const s = await http('/api/v1/auth/verify', { method: 'POST', body: { email, code }, auth: false }, storeSession); storeSession.set(s); return s; }
    await wait();
    throw new ApiError('Email verification needs the live API — mock mode sends no email.', 400, 'invalid_code');
  },
  async resendCode(email) {
    if (cfg.isLive()) return http('/api/v1/auth/resend', { method: 'POST', body: { email }, auth: false }, storeSession);
    await wait();
    return { ok: true };
  },
  async changePassword(current, password) {
    if (cfg.isLive()) return http('/api/v1/auth/password', { method: 'PUT', body: { current, password } }, storeSession);
    await wait(); return { ok: true };
  },
  async forgotPassword(email) {
    if (cfg.isLive()) return http('/api/v1/auth/forgot', { method: 'POST', body: { email }, auth: false }, storeSession);
    await wait();
    return { ok: true, message: 'If that address has an account, a reset link is on its way.' };
  },
  async resetPassword(token, password) {
    if (cfg.isLive()) { const s = await http('/api/v1/auth/reset', { method: 'POST', body: { token, password }, auth: false }, storeSession); storeSession.set(s); return s; }
    await wait();
    throw new ApiError('Password reset needs the live API — mock mode sends no email.', 400, 'invalid_token');
  },
  logout() { if (cfg.isLive() && storeSession.token()) http('/api/v1/auth/logout', { method: 'POST' }, storeSession).catch(() => {}); storeSession.clear(); },
  async createOrder({ items, address, addressId, deliveryMethod }) {
    const id = addressId || (address && address.id);
    if (cfg.isLive()) return http('/api/v1/orders', { method: 'POST', body: { items, addressId: id, address, deliveryMethod } }, storeSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (!storeSession.token()) throw new ApiError('Please sign in to place an order.', 401, 'unauthorized');
    if (!items || !items.length) throw new ApiError('Your cart is empty.', 422, 'validation');
    const saved = mockAddresses().find(a => a.id === id);
    const chosen = saved || address;
    if (!chosen) throw new ApiError('Choose a delivery address.', 422, 'validation');
    const prods = table('store.products', MockData.products);
    let subtotal = 0;
    for (const i of items) {
      const p = prods.find(x => x.id === i.productId);
      if (!p) throw new ApiError('A product in your cart is no longer available.', 422, 'validation');
      if ((p.stock || 0) < i.qty) throw new ApiError(`Only ${p.stock || 0} left of "${p.name}".`, 422, 'validation');
      subtotal += p.price * (1 - (p.discount || 0) / 100) * i.qty;
    }
    for (const i of items) { const p = prods.find(x => x.id === i.productId); p.stock = Math.max(0, (p.stock || 0) - i.qty); }
    const method = deliveryMethod === 'express' ? 'express' : 'standard';
    const line = [chosen.title, chosen.line || addrLine(chosen)].filter(Boolean).join(' \u2014 ');
    const order = {
      id: nextOrderId++, status: 'Processing', date: new Date().toISOString().slice(0, 10),
      total: +(subtotal + (method === 'express' ? 90 : 50)).toFixed(2),
      address: line, deliveryMethod: method,
      items: items.map(i => { const p = prods.find(x => x.id === i.productId); return { name: p.name, qty: i.qty, price: +(p.price * (1 - (p.discount || 0) / 100)).toFixed(2) }; }),
    };
    table('store.orders', []).unshift(order);
    // `orders` is what the live endpoint calls this. The mock used to call it
    // `ids`, so any caller reading it would have worked in one mode only.
    return Object.assign({}, order, { orders: [order.id] });
  },

  // ---- order history ----
  async getOrders() {
    if (cfg.isLive()) return http('/api/v1/orders', {}, storeSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (!storeSession.token()) throw new ApiError('Please sign in to view your orders.', 401, 'unauthorized');
    return { orders: clone(table('store.orders', [])) };
  },

  // ---- delivery addresses ----
  async getAddresses() {
    if (cfg.isLive()) return http('/api/v1/addresses', {}, storeSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (!storeSession.token()) throw new ApiError('Please sign in to manage your addresses.', 401, 'unauthorized');
    return { addresses: clone(sortAddresses(mockAddresses())) };
  },
  async createAddress(payload) {
    if (cfg.isLive()) return http('/api/v1/addresses', { method: 'POST', body: payload }, storeSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (!storeSession.token()) throw new ApiError('Please sign in to manage your addresses.', 401, 'unauthorized');
    const a = readAddress(payload);
    const list = mockAddresses();
    if (list.length >= 20) throw new ApiError('You have reached the maximum of 20 saved addresses.', 422, 'validation');
    const isDefault = a.isDefault || list.length === 0;
    const entry = { id: nextAddressId++, title: a.title, street: a.street, district: a.district, line: addrLine(a), isDefault };
    if (isDefault) list.forEach(x => { x.isDefault = false; });
    list.push(entry);
    return { address: clone(entry), addresses: clone(sortAddresses(list)) };
  },
  async updateAddress(id, payload) {
    if (cfg.isLive()) return http('/api/v1/addresses/' + id, { method: 'PUT', body: payload }, storeSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (!storeSession.token()) throw new ApiError('Please sign in to manage your addresses.', 401, 'unauthorized');
    const list = mockAddresses();
    const entry = list.find(x => x.id === id);
    if (!entry) throw new ApiError('Address not found.', 404, 'not_found');
    const a = readAddress(payload);
    const isDefault = a.isDefault || entry.isDefault;
    if (isDefault) list.forEach(x => { x.isDefault = false; });
    Object.assign(entry, { title: a.title, street: a.street, district: a.district, line: addrLine(a), isDefault });
    return { address: clone(entry), addresses: clone(sortAddresses(list)) };
  },
  async deleteAddress(id) {
    if (cfg.isLive()) return http('/api/v1/addresses/' + id, { method: 'DELETE' }, storeSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (!storeSession.token()) throw new ApiError('Please sign in to manage your addresses.', 401, 'unauthorized');
    const list = mockAddresses();
    const i = list.findIndex(x => x.id === id);
    if (i < 0) throw new ApiError('Address not found.', 404, 'not_found');
    const wasDefault = list[i].isDefault;
    list.splice(i, 1);
    if (wasDefault && list.length) list[0].isDefault = true;
    return { addresses: clone(sortAddresses(list)) };
  },
};

// Takes the fixtures rather than closing over a module-scope import, so it
// works with the on-demand loading above.
const vStore = (VendorData) => { if (!db['vendor.store']) db['vendor.store'] = clone(VendorData.store || {}); return db['vendor.store']; };
const vendor = {
  async login(email, password) {
    if (cfg.isLive()) { const s = await http('/api/v1/vendor/auth/login', { method: 'POST', body: { email, password }, auth: false }, vendorSession); vendorSession.set(s); return s; }
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); creds(email, password); return mkSession(vendorSession, { name: nameFrom(email), email, role: 'vendor' });
  },
  async changePassword(current, password) {
    if (cfg.isLive()) return http('/api/v1/vendor/auth/password', { method: 'PUT', body: { current, password } }, vendorSession);
    await wait(); return { ok: true };
  },
  logout() { if (cfg.isLive() && vendorSession.token()) http('/api/v1/vendor/auth/logout', { method: 'POST' }, vendorSession).catch(() => {}); vendorSession.clear(); },
  async getDashboard() {
    if (cfg.isLive()) return http('/api/v1/vendor/dashboard', {}, vendorSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    return { store: clone(vStore(VendorData)), categories: clone(VendorData.categories || []), products: clone(table('vendor.products', VendorData.products)), orders: clone(table('vendor.orders', VendorData.orders)) };
  },
  async createProduct(p) {
    if (cfg.isLive()) return http('/api/v1/vendor/products', { method: 'POST', body: p }, vendorSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); const list = table('vendor.products', VendorData.products);
    const np = Object.assign(clone(p), { id: Math.max(0, ...list.map(x => x.id)) + 1, rating: 0 });
    list.unshift(np); return clone(np);
  },
  async updateProduct(id, p) {
    if (cfg.isLive()) return http('/api/v1/vendor/products/' + id, { method: 'PUT', body: p }, vendorSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); const list = table('vendor.products', VendorData.products);
    const i = list.findIndex(x => x.id === id); if (i < 0) throw new ApiError('Product not found.', 404, 'not_found');
    list[i] = Object.assign({}, list[i], clone(p), { id, rating: list[i].rating }); return clone(list[i]);
  },
  async deleteProduct(id) {
    if (cfg.isLive()) return http('/api/v1/vendor/products/' + id, { method: 'DELETE' }, vendorSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); const list = table('vendor.products', VendorData.products);
    const i = list.findIndex(x => x.id === id); if (i < 0) throw new ApiError('Product not found.', 404, 'not_found');
    list.splice(i, 1); return null;
  },
  async updateOrderStatus(id, status) {
    if (cfg.isLive()) return http('/api/v1/vendor/orders/' + id, { method: 'PATCH', body: { status } }, vendorSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); const list = table('vendor.orders', VendorData.orders);
    const o = list.find(x => x.id === id); if (!o) throw new ApiError('Order not found.', 404, 'not_found');
    o.status = status; return clone(o);
  },
  async updateStore(s) {
    if (cfg.isLive()) return http('/api/v1/vendor/store', { method: 'PUT', body: s }, vendorSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); db['vendor.store'] = clone(s); return clone(s);
  },
  async upload(file) {
    if (cfg.isLive()) return httpUpload('/api/v1/vendor/uploads', file, vendorSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); return { url: await fileToDataUrl(file) };
  },
};

const admin = {
  async login(email, password) {
    if (cfg.isLive()) { const s = await http('/api/v1/admin/auth/login', { method: 'POST', body: { email, password }, auth: false }, adminSession); adminSession.set(s); return s; }
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); creds(email, password); return mkSession(adminSession, { name: nameFrom(email), email, role: 'admin' });
  },
  async changePassword(current, password) {
    if (cfg.isLive()) return http('/api/v1/admin/auth/password', { method: 'PUT', body: { current, password } }, adminSession);
    await wait(); return { ok: true };
  },
  logout() { if (cfg.isLive() && adminSession.token()) http('/api/v1/admin/auth/logout', { method: 'POST' }, adminSession).catch(() => {}); adminSession.clear(); },
  async getOverview() {
    if (cfg.isLive()) return http('/api/v1/admin/overview', {}, adminSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    return { vendors: clone(table('admin.vendors', AdminData.vendors)), products: clone(table('admin.products', AdminData.products)), orders: clone(AdminData.orders || []), clients: clone(AdminData.clients || []) };
  },
  async createVendor(payload) {
    if (cfg.isLive()) return http('/api/v1/admin/vendors', { method: 'POST', body: payload }, adminSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (!(payload.store || '').trim()) throw new ApiError('Store name is required.', 422, 'validation');
    creds(payload.email, payload.password);
    const list = table('admin.vendors', AdminData.vendors);
    const email = String(payload.email).toLowerCase();
    if (list.some(v => (v.email || '').toLowerCase() === email)) throw new ApiError('A vendor with that email already exists.', 409, 'conflict');
    const statuses = ['Active', 'Pending', 'Suspended'];
    const v = {
      id: Math.max(0, ...list.map(x => x.id || 0)) + 1,
      store: payload.store.trim(), manager: (payload.manager || '').trim(), email, city: (payload.city || '').trim(),
      joined: new Date().toISOString().slice(0, 10), products: 0, sales: 0,
      status: statuses.includes(payload.status) ? payload.status : 'Pending',
    };
    list.push(v); return clone(v);
  },
  async setVendorStatus(id, status) {
    if (cfg.isLive()) return http('/api/v1/admin/vendors/' + id, { method: 'PATCH', body: { status } }, adminSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); const v = table('admin.vendors', AdminData.vendors).find(x => x.id === id);
    if (!v) throw new ApiError('Vendor not found.', 404, 'not_found');
    v.status = status; return clone(v);
  },
  async removeVendor(id) {
    if (cfg.isLive()) return http('/api/v1/admin/vendors/' + id, { method: 'DELETE' }, adminSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); const list = table('admin.vendors', AdminData.vendors);
    const i = list.findIndex(x => x.id === id); if (i < 0) throw new ApiError('Vendor not found.', 404, 'not_found');
    const store = list[i].store; list.splice(i, 1);
    const products = table('admin.products', AdminData.products);
    for (let j = products.length - 1; j >= 0; j--) if (products[j].vendor === store) products.splice(j, 1);
    return null;
  },
  async setProductStatus(id, status) {
    if (cfg.isLive()) return http('/api/v1/admin/products/' + id, { method: 'PATCH', body: { status } }, adminSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); const p = table('admin.products', AdminData.products).find(x => x.id === id);
    if (!p) throw new ApiError('Listing not found.', 404, 'not_found');
    p.status = status; return clone(p);
  },
  async removeProduct(id) {
    if (cfg.isLive()) return http('/api/v1/admin/products/' + id, { method: 'DELETE' }, adminSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); const list = table('admin.products', AdminData.products);
    const i = list.findIndex(x => x.id === id); if (i < 0) throw new ApiError('Listing not found.', 404, 'not_found');
    list.splice(i, 1); return null;
  },
  // Site content — home slider + shop-by-room tiles.
  async getContent() {
    if (cfg.isLive()) return http('/api/v1/admin/content', {}, adminSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    return { banners: clone(table('admin.banners', MockData.banners)), categories: clone(table('admin.categories', MockData.categories)) };
  },
  async saveContent(content) {
    if (cfg.isLive()) return http('/api/v1/admin/content', { method: 'PUT', body: content }, adminSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures();
    if (content.banners) db['admin.banners'] = clone(content.banners);
    if (content.categories) db['admin.categories'] = clone(content.categories);
    return { banners: clone(table('admin.banners', MockData.banners)), categories: clone(table('admin.categories', MockData.categories)) };
  },
  async upload(file) {
    if (cfg.isLive()) return httpUpload('/api/v1/admin/uploads', file, adminSession);
    await wait();
    const { MockData, VendorData, AdminData } = await fixtures(); return { url: await fileToDataUrl(file) };
  },
};

export const api = { store, vendor, admin, session: storeSession, vendorSession, adminSession, ApiError };
export default api;
