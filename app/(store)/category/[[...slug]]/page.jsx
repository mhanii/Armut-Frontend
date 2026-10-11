import { CategoryView } from '@/components/store/CategoryView.jsx';
import { getCatalog, CATALOG_REVALIDATE } from '@/lib/server-catalog.js';

export const revalidate = CATALOG_REVALIDATE;

const readCategory = (slug) => (slug && slug.length ? decodeURIComponent(slug[0]) : null);

export function generateMetadata({ params, searchParams }) {
  const q = (searchParams?.q || '').trim();
  const category = readCategory(params.slug);
  const label = q ? 'Search: ' + q : (category || 'All Furniture');
  const description = category
    ? `Browse ${category} furniture handcrafted in Türkiye — delivered and assembled at your home.`
    : 'Browse all Armut furniture — sofas, dining, bedroom and storage, handcrafted in Türkiye.';
  const canonical = category ? '/category/' + encodeURIComponent(category) : '/category';
  return {
    title: label,
    description,
    alternates: { canonical },
    // Without this the page inherited the site-wide card, so sharing a room
    // showed the generic home preview with the wrong title.
    // Defining openGraph here replaces the parent's rather than merging it,
    // so the image has to be restated or the card loses its picture.
    openGraph: {
      type: 'website',
      title: `${label} | Armut`,
      description,
      url: canonical,
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Armut — handcrafted Turkish furniture' }],
    },
  };
}

export default async function CategoryPage({ params, searchParams }) {
  const category = readCategory(params.slug);
  // Also trimmed on the way in, so a hand-typed or older link renders the
  // same as one the search box built.
  const query = (searchParams?.q || '').trim();
  const sort = searchParams?.sort || 'featured';
  const { products } = await getCatalog();
  return <CategoryView products={products} category={category} query={query} sort={sort} />;
}
