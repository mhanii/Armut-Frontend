// Exercise the mock engine directly. It is the development data source and the
// build cannot tell you whether its branches still run — this restructure
// moved the fixtures behind a dynamic import in 15 methods.
import assert from 'node:assert';

const store = new Map();
globalThis.window = { location: { reload() {} } };
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};
globalThis.location = globalThis.window.location;
// Force mock mode: no API base URL configured.
store.set('armut.apiMode', 'mock');
store.set('armut.apiBaseUrl', '');

const { api } = await import('../lib/api.js');

let pass = 0, fail = 0;
const ok = (label, cond) => { cond ? (pass++, console.log('  ok  ', label)) : (fail++, console.log('  FAIL', label)); };

const cat = await api.store.getCatalog();
ok('catalog returns products', Array.isArray(cat.products) && cat.products.length > 0);
ok('catalog returns categories', cat.categories.length > 0);
ok('catalog returns banners', cat.banners.length > 0);

const p = await api.store.getProduct(cat.products[0].id);
ok('product detail resolves', p && p.name === cat.products[0].name);
ok('product detail carries reviews', Array.isArray(p.reviews));

const s = await api.store.signup({ name: 'Mock Tester', email: 'mock@example.com', password: 'secret123' });
ok('signup returns a session', !!s.token && s.user.name === 'Mock');

const a = await api.store.createAddress({ title: 'Home', street: 'A St 1', district: 'Kadıköy' });
ok('address created and defaulted', a.address.isDefault === true);
const upd = await api.store.updateAddress(a.address.id, { title: 'Home 2', street: 'A St 2', district: 'Kadıköy' });
ok('address updated', upd.address.street === 'A St 2');

const order = await api.store.createOrder({ items: [{ productId: cat.products[0].id, qty: 1 }], addressId: a.address.id, deliveryMethod: 'standard' });
ok('order placed', order.status === 'Processing');
ok('order records the address', /Home 2/.test(order.address));
const hist = await api.store.getOrders();
ok('order history', hist.orders.length === 1);
ok('address delete', (await api.store.deleteAddress(a.address.id)).addresses.length === 0);

const v = await api.vendor.login('vendor@example.com', 'secret123');
ok('vendor login', !!v.token);
const vd = await api.vendor.getDashboard();
ok('vendor dashboard products', vd.products.length > 0);
ok('vendor dashboard orders', vd.orders.length > 0);
const np = await api.vendor.createProduct({ name: 'Mock Bench', category: 'Storage', price: 10, stock: 1, status: 'Active', photos: [], colors: [] });
ok('vendor product created', np.name === 'Mock Bench');
ok('vendor product updated', (await api.vendor.updateProduct(np.id, { ...np, price: 20 })).price === 20);
ok('vendor order status', (await api.vendor.updateOrderStatus(vd.orders[0].id, 'Shipped')).status === 'Shipped');
ok('vendor product deleted', (await api.vendor.deleteProduct(np.id)) === null);

const ad = await api.admin.login('admin@example.com', 'secret123');
ok('admin login', !!ad.token);
const ov = await api.admin.getOverview();
ok('admin overview vendors', ov.vendors.length > 0);
ok('admin overview products', ov.products.length > 0);
const nv = await api.admin.createVendor({ store: 'Mock Store', email: 'mockstore@example.com', password: 'secret123' });
ok('admin vendor created', nv.store === 'Mock Store');
ok('admin vendor status', (await api.admin.setVendorStatus(nv.id, 'Active')).status === 'Active');
ok('admin product status', (await api.admin.setProductStatus(ov.products[0].id, 'Flagged')).status === 'Flagged');
ok('admin vendor removed', (await api.admin.removeVendor(nv.id)) === null);
const content = await api.admin.getContent();
ok('admin content', content.categories.length > 0);
ok('admin content saved', (await api.admin.saveContent({ categories: content.categories })).categories.length > 0);

console.log(`\npassed: ${pass}  failed: ${fail}`);
process.exit(fail ? 1 : 0);
