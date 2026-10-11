'use client';
import React from 'react';
import { api } from '@/lib/api.js';
import { useFlash } from '@/lib/useFlash.js';
import { Toast } from '@/components/ui/Toast.jsx';
import { LoadScreen, ErrorScreen } from '@/components/ui/AppStates.jsx';
import { AdminSidebar } from './shell.jsx';
import { AdminLogin } from './AdminLogin.jsx';
import { AdminOverview } from './AdminOverview.jsx';
import { AdminVendors } from './AdminVendors.jsx';
import { AdminProducts } from './AdminProducts.jsx';
import { AdminOrders, AdminClients } from './AdminOrders.jsx';
import { AdminContent } from './AdminContent.jsx';

export function AdminConsole() {
  const [mounted, setMounted] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [status, setStatus] = React.useState('idle');
  const [error, setError] = React.useState(null);
  const [tab, setTab] = React.useState('overview');
  const [vendors, setVendors] = React.useState([]);
  const [products, setProducts] = React.useState([]);
  const [orders, setOrders] = React.useState([]);
  const [clients, setClients] = React.useState([]);
  const [content, setContent] = React.useState({ banners: [], categories: [] });
  const [toast, flash] = useFlash();

  const load = React.useCallback(async () => {
    setStatus('loading');
    try {
      const [d, c] = await Promise.all([api.admin.getOverview(), api.admin.getContent()]);
      setVendors(d.vendors); setProducts(d.products); setOrders(d.orders); setClients(d.clients);
      setContent(c);
      setStatus('ready');
    } catch (e) { setError(e); setStatus('error'); if (e.status === 401) { setEndedWith(e.message); setUser(null); } }
  }, []);

  React.useEffect(() => { setMounted(true); setUser(api.adminSession.user()); }, []);
  React.useEffect(() => { if (user) load(); }, [user, load]);

  const handleLogin = async (email, password) => { const s = await api.admin.login(email, password); setEndedWith(null); setUser(s.user); };
  // A 401 mid-session means the session is gone (expired, suspended, or the
  // account removed); the client already cleared it, so return to sign-in
  // rather than leave a console where every action fails.
  const [endedWith, setEndedWith] = React.useState(null);
  const fail = (e) => { if (e.status === 401) { setEndedWith(e.message); setUser(null); } else flash(e.message, 'error'); };
  const signOut = () => { api.admin.logout(); setUser(null); setStatus('idle'); };

  const setVendorStatus = async (id, statusV) => {
    try { const v = await api.admin.setVendorStatus(id, statusV); setVendors(list => list.map(x => x.id === v.id ? v : x)); flash(`Vendor ${statusV.toLowerCase()}`); }
    catch (e) { fail(e); }
  };
  const inviteVendor = async (payload) => {
    const v = await api.admin.createVendor(payload);
    setVendors(list => [...list, v]);
    flash('Vendor added');
    return v;
  };
  const removeVendor = async (vendor) => {
    try {
      await api.admin.removeVendor(vendor.id);
      setVendors(list => list.filter(x => x.id !== vendor.id));
      setProducts(list => list.filter(p => p.vendor !== vendor.store));
      flash(`${vendor.store} removed`);
    } catch (e) { fail(e); }
  };
  const moderate = async (id, action) => {
    try {
      if (action === 'removed') { await api.admin.removeProduct(id); setProducts(list => list.filter(p => p.id !== id)); flash('Listing removed'); }
      else { const p = await api.admin.setProductStatus(id, action); setProducts(list => list.map(x => x.id === p.id ? p : x)); flash(action === 'Active' ? 'Listing approved' : 'Listing flagged'); }
    } catch (e) { fail(e); }
  };
  const saveContent = async (payload) => {
    try { const c = await api.admin.saveContent(payload); setContent(c); flash('Site content saved'); }
    catch (e) { fail(e); throw e; }
  };
  const uploadImage = async (file) => { const r = await api.admin.upload(file); return r.url; };

  if (!mounted) return <main id="main" tabIndex={-1}><LoadScreen label="Loading marketplace…" /></main>;
  if (!user) return <AdminLogin onLogin={handleLogin} notice={endedWith} />;
  if (status === 'loading' || status === 'idle') return <main id="main" tabIndex={-1}><LoadScreen label="Loading marketplace…" /></main>;
  if (status === 'error') return <main id="main" tabIndex={-1}><ErrorScreen error={error} onRetry={load} /></main>;

  const live = { vendors, products, orders, clients };
  let view;
  if (tab === 'overview') view = <AdminOverview data={live} onGoTo={setTab} />;
  else if (tab === 'vendors') view = <AdminVendors vendors={vendors} products={products} onSetStatus={setVendorStatus} onInvite={inviteVendor} onRemove={removeVendor} />;
  else if (tab === 'products') view = <AdminProducts products={products} vendors={vendors} onModerate={moderate} />;
  else if (tab === 'orders') view = <AdminOrders orders={orders} />;
  else if (tab === 'clients') view = <AdminClients clients={clients} />;
  else if (tab === 'content') view = <AdminContent content={content} onSave={saveContent} onUpload={uploadImage} flash={flash} />;

  return (
    <div className="console">
      <a className="skip-link" href="#main">Skip to content</a>
      <AdminSidebar tab={tab} setTab={setTab} onSignOut={signOut} />
      <main className="console__main" id="main" tabIndex={-1}>
        {view}
      </main>
      <Toast show={!!toast} type={toast?.type || 'success'} message={toast?.message || ''} />
    </div>
  );
}
