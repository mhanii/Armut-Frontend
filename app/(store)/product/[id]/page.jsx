import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/store/ProductDetail.jsx';
import { getCatalog, getProduct, CATALOG_REVALIDATE } from '@/lib/server-catalog.js';
import { SITE } from '@/lib/site.js';
import { ogImage, OG_WIDTH, OG_HEIGHT } from '@/lib/img.js';

export const revalidate = CATALOG_REVALIDATE;
// Products added after a build still render — on demand, then cached.
export const dynamicParams = true;

// Pre-render the catalog's product pages at build time (SSG) for crawlers + speed.
export async function generateStaticParams() {
  const { products } = await getCatalog();
  return products.map(p => ({ id: String(p.id) }));
}

export async function generateMetadata({ params }) {
  const product = await getProduct(params.id);
  if (!product) return { title: 'Product not found' };
  const price = (product.price * (1 - (product.discount || 0) / 100)).toFixed(2);
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: '/product/' + product.id },
    openGraph: {
      // 'product' is a Facebook extension, not core OpenGraph, and Next
      // rejects it. The product:price:* tags below carry the commerce detail.
      type: 'website',
      title: product.name + ' | Armut',
      description: product.description,
      // Cropped to the card's own shape and declared, rather than handing over
      // the catalogue photo at whatever size and ratio it happens to be.
      images: [ogImage(product.image)
        ? { url: ogImage(product.image), width: OG_WIDTH, height: OG_HEIGHT, alt: product.name }
        : { url: '/og-default.png', width: OG_WIDTH, height: OG_HEIGHT, alt: 'Armut' }],
      url: '/product/' + product.id,
    },
    other: { 'product:price:amount': price, 'product:price:currency': 'USD' },
  };
}

// Pieces from the same room, best first. Server-side rather than in the client
// component so the links are in the initial HTML — a product page that links
// only upwards to its category is a dead end for a crawler and for a reader.
// Same room only: topping the row up with unrelated pieces to reach a round
// four is padding, and padding is what "more from this room" stops meaning.
async function getRelated(product) {
  if (!product.category) return [];
  const { products } = await getCatalog();
  return products
    .filter(p => p.id !== product.id
      && p.category === product.category
      && !(p.stock != null && p.stock <= 0))
    .sort((a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount))
    .slice(0, 4);
}

export default async function ProductPage({ params }) {
  const product = await getProduct(params.id);
  if (!product) notFound();
  const related = await getRelated(product);

  const url = `${SITE}/product/${product.id}`;
  // priceValidUntil and itemCondition are what rich-result validators ask for;
  // without them the product card is reported as incomplete.
  const validUntil = new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: [product.image].filter(Boolean),
    description: product.description,
    category: product.category,
    sku: String(product.id),
    // The workshop is the brand; Armut is the seller, below in the offer.
    ...(product.vendor ? { brand: { '@type': 'Brand', name: product.vendor } } : {}),
    ...(product.reviewCount
      ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviewCount } }
      : {}),
    offers: {
      '@type': 'Offer',
      url,
      priceCurrency: 'USD',
      price: (product.price * (1 - (product.discount || 0) / 100)).toFixed(2),
      priceValidUntil: validUntil,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      seller: { '@type': 'Organization', name: 'Armut' },
    },
  };

  // Mirrors the on-page breadcrumb, so search results can show the hierarchy.
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: SITE + '/' },
      ...(product.category
        ? [{ '@type': 'ListItem', position: 2, name: product.category, item: `${SITE}/category/${encodeURIComponent(product.category)}` }]
        : []),
      { '@type': 'ListItem', position: product.category ? 3 : 2, name: product.name, item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <ProductDetail product={product} related={related} />
    </>
  );
}
