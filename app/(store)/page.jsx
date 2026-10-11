import { Home } from '@/components/store/Home.jsx';
import { getCatalog, CATALOG_REVALIDATE } from '@/lib/server-catalog.js';

export const revalidate = CATALOG_REVALIDATE;

// Declared here rather than inherited from the root layout, so it applies to
// this page and not to every page in the app.
export const metadata = { alternates: { canonical: '/' } };

// Home is server-rendered with catalog data as props so product names, headings and
// links are in the initial HTML for crawlers. Interactivity hydrates client-side.
export default async function HomePage() {
  const { banners, categories, products } = await getCatalog();
  return <Home banners={banners} categories={categories} products={products} />;
}
