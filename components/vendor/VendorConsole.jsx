'use client';
import React from 'react';
import { api } from '@/lib/api.js';
import { useFlash } from '@/lib/useFlash.js';
import { Toast } from '@/components/ui/Toast.jsx';
import { LoadScreen, ErrorScreen } from '@/components/ui/AppStates.jsx';
import { VendorSidebar } from './shell.jsx';
import { VendorLogin } from './VendorLogin.jsx';
import { VendorDashboard } from './VendorDashboard.jsx';
import { VendorProducts } from './VendorProducts.jsx';
import { VendorProductForm } from './VendorProductForm.jsx';
import { VendorOrders } from './VendorOrders.jsx';
import { VendorStore } from './VendorStore.jsx';

export function VendorConsole() {
  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState(null);
  const [tab, setTab] = React.useState('dashboard');
  const [categories, setCategories] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [store, setStore] = React.useState({});
  const [editing, setEditing] = React.useState(null);
  const [orderFilter, setOrderFilter] = React.useState('all');
  const [toast, flash] = useFlash();

  const load = React.useCallback(async () => {
    setStatus('loading');
    try {
      const d = await api.vendor.getDashboard();
      setCategories(d.categories); setProducts(d.products); setOrders(d.orders); setStore(d.store);
      setStatus('ready');
    } catch (e) { setError(e); setStatus('error'); if (e.status === 401) { setEndedWith(e.message); setUser(null); } }
  }, []);

  React.useEffect(() => { setMounted(true); setUser(api.vendorSession.user()); }, []);
  React.useEffect(() => { if (user) load(); }, [user, load]);

  const handleLogin = async (email, password) => { const s = await api.vendor.login(email, password); setEndedWith(null); setUser(s.user); };
  // A 401 mid-session means the session is gone (expired, suspended, or the
  // account removed); the client already cleared it, so return to sign-in
  // rather than leave a console where every action fails.
  const [endedWith, setEndedWith] = React.useState(null);
  const fail = (e) => { if (e.status === 401) { setEndedWith(e.message); setUser(null); } else flash(e.message, 'error'); };
  const signOut = () => { api.vendor.logout(); setUser(null); setStatus('idle'); };

  const saveProduct = async (p) => {
    try {
      if (p.id) { const up = await api.vendor.updateProduct(p.id, p); setProducts(list => list.map(x => x.id === up.id ? up : x)); flash(`${up.name} updated`); }
      else { const np = await api.vendor.createProduct(p); setProducts(list => [np, ...list]); flash(np.status === 'Draft' ? `${np.name} saved as a draft` : `${np.name} published`); }
      setTab('products'); setEditing(null);
    } catch (e) { fail(e); }
  };
  const deleteProduct = async (id) => {
    try { await api.vendor.deleteProduct(id); setProducts(list => list.filter(x => x.id !== id)); flash('Product deleted'); }
    catch (e) { fail(e); }
  };
  const advanceOrder = async (id, statusV) => {
    try { const o = await api.vendor.updateOrderStatus(id, statusV); setOrders(list => list.map(x => x.id === o.id ? o : x)); flash('Order marked ' + statusV); }
    catch (e) { fail(e); }
  };
  const saveStore = async (s) => {
    try { const up = await api.vendor.updateStore(s); setStore(up); flash('Store profile saved'); }
    catch (e) { fail(e); }
  };

  if (!mounted) return <main id="main" tabIndex={-1}><LoadScreen label="Loading your store…" /></main>;
  if (!user) return <VendorLogin onLogin={handleLogin} notice={endedWith} />;
  if (status === 'loading' || status === 'idle') return <main id="main" tabIndex={-1}><LoadScreen label="Loading your store…" /></main>;
  if (status === 'error') return <main id="main" tabIndex={-1}><ErrorScreen error={error} onRetry={load} /></main>;

  let view;
  if (tab === 'dashboard') view = <VendorDashboard products={products} orders={orders} storeStatus={store.status} onGoTo={(t, f) => { setTab(t); if (f) setOrderFilter(f); }} />;
  else if (tab === 'products') view = <VendorProducts products={products} onAdd={() => { setEditing(null); setTab('product-form'); }} onEdit={p => { setEditing(p); setTab('product-form'); }} onDelete={deleteProduct} />;
  else if (tab === 'product-form') view = <VendorProductForm product={editing} categories={categories} onSave={saveProduct} onCancel={() => { setTab('products'); setEditing(null); }} />;
  else if (tab === 'orders') view = <VendorOrders orders={orders} onAdvance={advanceOrder} initialFilter={orderFilter} key={orderFilter} />;
  else if (tab === 'store') view = <VendorStore store={store} onSave={saveStore} />;

  return (
    <div className="console">
      <a className="skip-link" href="#main">Skip to content</a>
      <VendorSidebar tab={tab} setTab={setTab} store={store} onSignOut={signOut} />
      <main className="console__main" id="main" tabIndex={-1}>
        {view}
      </main>
      <Toast show={!!toast} type={toast?.type || 'success'} message={toast?.message || ''} />
    </div>
  );
}
