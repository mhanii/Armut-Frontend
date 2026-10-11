// Server-side catalog access for the pages that render on the server (home,
// category, product detail) so crawlers and the initial HTML get real data.
//
// With NEXT_PUBLIC_API_URL set this reads the live API; without it — or if the
// API is unreachable — it falls back to the bundled fixtures so a build never
// breaks on a cold backend. Client components re-fetch on mount either way.
import { API_SERVER_URL } from './site.js';
import { banners as mockBanners, categories as mockCategories, products as mockProducts } from './mockData.js';

// Seconds between background refreshes of server-rendered catalog data.
export const CATALOG_REVALIDATE = 300;

const fixtures = () => ({ banners: mockBanners, categories: mockCategories, products: mockProducts });

// Serving fixtures when the API is unreachable is right in two situations and
// wrong in a third.
//
// Right: in development, and during a production *build* — `generateStaticParams`
// asks for the catalogue, and a deploy should not fail because the API happened
// to be restarting.
//
// Wrong: in production, at request time. This is a shop. Sixteen invented
// products with invented prices, rendered as though they were the real
// catalogue, is worse than an error page — someone can put one in a basket and
// read a price that is not ours. Next's revalidate cache already serves the
// last good response through a brief outage; the only case that reaches here
// is a cold server during one, and then the honest answer is that the page is
// unavailable.
const BUILDING = process.env.NEXT_PHASE === 'phase-production-build';
const CAN_FAKE = process.env.NODE_ENV !== 'production' || BUILDING;

export async function getCatalog() {
  if (!API_SERVER_URL) return fixtures();
  try {
    const res = await fetch(API_SERVER_URL + '/api/v1/catalog', { next: { revalidate: CATALOG_REVALIDATE } });
    if (!res.ok) throw new Error('catalog ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data.products)) throw new Error('catalog: unexpected payload');
    return { banners: data.banners || [], categories: data.categories || [], products: data.products };
  } catch (e) {
    if (!CAN_FAKE) {
      console.error('[catalog] API unreachable in production:', e.message);
      throw e;
    }
    console.warn('[catalog] API unreachable, serving fixtures:', e.message);
    return fixtures();
  }
}

// A single product, or null when it does not exist (→ 404).
export async function getProduct(id) {
  const key = Number(id);
  if (!Number.isFinite(key)) return null;
  if (!API_SERVER_URL) return mockProducts.find(p => p.id === key) || null;
  try {
    const res = await fetch(`${API_SERVER_URL}/api/v1/products/${key}`, { next: { revalidate: CATALOG_REVALIDATE } });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('product ' + res.status);
    return await res.json();
  } catch (e) {
    if (!CAN_FAKE) {
      console.error('[catalog] product ' + key + ' unreachable in production:', e.message);
      throw e;
    }
    console.warn('[catalog] product ' + key + ' unreachable, trying fixtures:', e.message);
    return mockProducts.find(p => p.id === key) || null;
  }
}
