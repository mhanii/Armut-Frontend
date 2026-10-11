'use client';
import React from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api.js';
import { useFlash } from '@/lib/useFlash.js';
import { Header } from '@/components/ui/Header.jsx';
import { Footer } from '@/components/ui/Footer.jsx';
import { Toast } from '@/components/ui/Toast.jsx';

const CART_KEY = 'armut.cart';
const StoreContext = React.createContext(null);
export const useStore = () => React.useContext(StoreContext);

export function StoreProvider({ children }) {
  const router = useRouter();
  const [cart, setCart] = React.useState([]);
  const [catalog, setCatalog] = React.useState(null);
  const [catalogError, setCatalogError] = React.useState(null);
  const [user, setUser] = React.useState(null);
  const [placing, setPlacing] = React.useState(false);
  const [toast, flash] = useFlash();
  // Until the cart has been read from storage, "no items" and "not loaded yet"
  // are different states and must not look the same.
  const [hydrated, setHydrated] = React.useState(false);

  const products = catalog?.products;

  // The failure used to go into an empty catch. `catalog` then stayed null
  // forever, so `products` stayed undefined, so the cart's "not loaded yet"
  // gate never opened and it sat on "Loading your cart…" with no error and no
  // way out. A swallowed error is a spinner that never stops.
  const loadCatalog = React.useCallback(() => {
    setCatalogError(null);
    return api.store.getCatalog()
      .then(d => { setCatalog(d); setCatalogError(null); })
      .catch(e => setCatalogError(e));
  }, []);

  React.useEffect(() => {
    try { setCart(JSON.parse(localStorage.getItem(CART_KEY)) || []); } catch (e) {}
    setUser(api.session.user());
    setHydrated(true);
    loadCatalog();
  }, [loadCatalog]);

  // Only write once the stored cart has been read, or the first render would
  // overwrite a saved cart with the empty initial state.
  React.useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {}
  }, [cart, hydrated]);

  // One pass over the catalogue instead of a find() per cart line on every
  // render — the previous version was O(cart x catalogue) and re-ran whenever
  // any unrelated state (a toast, a spinner) changed.
  const byId = React.useMemo(() => {
    const m = new Map();
    for (const p of products || []) m.set(p.id, p);
    return m;
  }, [products]);

  // Lines whose product has gone are kept and marked, not dropped. Silently
  // removing them changed the total with no explanation.
  const cartLines = React.useMemo(
    () => cart.map(c => ({ id: c.id, qty: c.qty, product: byId.get(c.id) || null })),
    [cart, byId],
  );
  const cartItems = React.useMemo(() => cartLines.filter(l => l.product), [cartLines]);
  const unavailable = React.useMemo(() => cartLines.filter(l => !l.product), [cartLines]);
  // The badge counts what the cart page counts. Until the catalogue arrives
  // every line looks unavailable, so the raw count stands in rather than
  // flashing zero.
  const cartCount = React.useMemo(
    () => (products ? cartItems : cart).reduce((s, i) => s + i.qty, 0),
    [products, cartItems, cart],
  );
  // Ready means "we have tried", not "we succeeded" — otherwise a failed
  // catalogue keeps every consumer in a loading state indefinitely.
  const cartReady = hydrated && (products !== undefined || !!catalogError);


  // The API refuses an order line that exceeds stock — `Only 2 left of "X"` —
  // so a cart that lets you build one is a cart that promises something
  // checkout will take back. The ceiling is enforced here, at the only place
  // quantity changes, rather than in each caller. A product with no stock
  // figure (an older payload, or fixtures) is left uncapped.
  const ceiling = React.useCallback((id) => {
    const p = byId.get(id);
    return p && typeof p.stock === 'number' ? p.stock : Infinity;
  }, [byId]);

  const addToCart = React.useCallback((product) => {
    const max = typeof product.stock === 'number' ? product.stock : Infinity;
    let capped = false;
    setCart(prev => {
      const e = prev.find(i => i.id === product.id);
      if (!e) return max < 1 ? prev : [...prev, { id: product.id, qty: 1 }];
      if (e.qty >= max) { capped = true; return prev; }
      return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
    });
    if (max < 1) flash(`${product.name} is out of stock`, 'error');
    else if (capped) flash(`Only ${max} of ${product.name} in stock`, 'error');
    else flash(`${product.name} added to your cart`);
  }, [flash]);

  const updateQty = React.useCallback((id, qty) => {
    const max = ceiling(id);
    setCart(prev => {
      if (qty <= 0) return prev.filter(i => i.id !== id);
      const next = Math.min(qty, max);
      return prev.map(i => i.id === id ? { ...i, qty: next } : i);
    });
  }, [ceiling]);

  // A cart persists in localStorage; stock does not. Someone can come back to
  // four of something the workshop now has two of. Silently trimming it would
  // change the total with no explanation — the same objection that keeps
  // unavailable lines visible above — so it is surfaced and the shopper
  // presses the button.
  const overStock = React.useMemo(
    () => cartItems.filter(l => typeof l.product.stock === 'number' && l.qty > l.product.stock),
    [cartItems],
  );

  const capQuantities = React.useCallback(() => {
    setCart(prev => prev.map(i => {
      const p = byId.get(i.id);
      if (!p || typeof p.stock !== 'number') return i;
      return i.qty > p.stock ? { ...i, qty: Math.max(p.stock, 0) } : i;
    }).filter(i => i.qty > 0));
    flash('Quantities updated to what is in stock');
  }, [byId, flash]);

  const removeUnavailable = React.useCallback(() => {
    setCart(prev => prev.filter(i => byId.has(i.id)));
    flash('Removed items that are no longer available');
  }, [byId, flash]);

  const goCheckout = React.useCallback(() => {
    router.push(user ? '/checkout' : '/login');
  }, [router, user]);

  const placeOrder = React.useCallback(async ({ delivery, address, addressId }) => {
    if (placing) return;
    setPlacing(true);
    try {
      const order = await api.store.createOrder({
        items: cart.filter(i => byId.has(i.id)).map(i => ({ productId: i.id, qty: i.qty })),
        address,
        addressId: addressId || (address && address.id),
        deliveryMethod: delivery,
      });
      setCart([]);
      // Confirmation is a page now, not a modal: it has a URL, it survives a
      // reload, and it can name every order the basket was split into instead
      // of only the first. The ids ride in the query string so the page can be
      // re-opened later; the API only ever returns this customer's own orders,
      // so a tampered id simply is not found.
      const ids = (order.orders && order.orders.length ? order.orders : [order.id]).join(',');
      router.push(`/order/confirmed?ids=${ids}`);
    } catch (e) {
      flash(e.message || 'Could not place the order.', 'error');
    }
    setPlacing(false);
  }, [placing, cart, byId, flash, router]);

  const login = React.useCallback(async (email, password) => {
    const s = await api.store.login(email, password);
    setUser(s.user);
    router.push(cart.length ? '/checkout' : '/');
    flash('Welcome back, ' + s.user.name);
  }, [cart.length, router, flash]);

  const signup = React.useCallback(async (form) => {
    const s = await api.store.signup(form);
    if (s.verify) { router.push('/verify-email?email=' + encodeURIComponent(s.email)); return; }
    setUser(s.user);
    router.push(cart.length ? '/checkout' : '/');
    flash('Welcome to Armut, ' + s.user.name);
  }, [cart.length, router, flash]);

  const verifyEmail = React.useCallback(async (email, code) => {
    const s = await api.store.verifyEmail(email, code);
    setUser(s.user);
    router.push(cart.length ? '/checkout' : '/');
    flash('Welcome to Armut, ' + s.user.name);
  }, [cart.length, router, flash]);

  const resetPassword = React.useCallback(async (token, password) => {
    const s = await api.store.resetPassword(token, password);
    setUser(s.user);
    router.push(cart.length ? '/checkout' : '/account');
    flash('Password updated — you are signed in');
  }, [cart.length, router, flash]);

  const signOut = React.useCallback(() => {
    api.store.logout();
    setUser(null);
    flash('Signed out');
  }, [flash]);

  // Memoised, or every consumer of this context re-rendered whenever any
  // unrelated piece of state changed — a toast re-rendered the whole tree.
  const value = React.useMemo(() => ({
    cart, cartCount, cartItems, unavailable, cartReady, catalogError, loadCatalog,
    catalog, products: products || [],
    addToCart, updateQty, removeUnavailable, overStock, capQuantities,
    placing, placeOrder, user, hydrated, login, signup, verifyEmail, resetPassword, signOut, goCheckout, flash,
  }), [cart, cartCount, cartItems, unavailable, cartReady, catalogError, loadCatalog, catalog, products,
       addToCart, updateQty, removeUnavailable, overStock, capQuantities,
       placing, placeOrder, user, hydrated, login, signup, verifyEmail, resetPassword, signOut, goCheckout, flash]);

  const rooms = React.useMemo(() => (catalog?.categories || []).map(c => c.name), [catalog]);

  return (
    <StoreContext.Provider value={value}>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <a className="skip-link" href="#main">Skip to content</a>
        <Header rooms={rooms} cartCount={cartCount} userName={user?.name}
          onSearch={(q) => {
            // Untrimmed, "  dining  " became ?q=%20%20dining%20%20 and a
            // heading with visible padding — two URLs for one search, neither
            // of them shareable-looking. An empty search went to ?q= , which
            // is the all-furniture page wearing a pointless parameter.
            const term = (q || '').trim();
            router.push(term ? '/category?q=' + encodeURIComponent(term) : '/category');
          }} />
        <main id="main" tabIndex={-1} style={{ flex: 1 }}>{children}</main>
        <Footer />
        <Toast show={!!toast} type={toast?.type || 'success'} message={toast?.message || ''} />
      </div>
    </StoreContext.Provider>
  );
}
