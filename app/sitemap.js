import { SITE } from '@/lib/site.js';
import { getCatalog } from '@/lib/server-catalog.js';

// Re-crawl the live catalog hourly so new listings appear without a redeploy.
export const revalidate = 3600;

// lastModified was stamped with the time the sitemap was generated, on every
// entry, every hour — so the site told crawlers that all twenty of its pages
// had changed within the hour, forever. Google's guidance is that it ignores
// lastmod when a site's values are not consistently accurate, so the tag was
// not merely useless: it spent the signal.
//
// A product now carries the time it was actually last edited. A listing page
// is a collection of products, so it is as new as its newest member. The home
// page also depends on the banners and room tiles, which carry no timestamp
// of their own, so it declares none: omitting lastmod is explicitly allowed
// and means "unknown", which is the truth.
const newest = (items) => {
  const stamps = items.map(p => p.updatedAt).filter(Boolean).map(d => new Date(d)).filter(d => !Number.isNaN(+d));
  return stamps.length ? new Date(Math.max(...stamps)) : undefined;
};

export default async function sitemap() {
  const { products, categories } = await getCatalog();

  const staticPages = [
    { url: SITE + '/', changeFrequency: 'daily', priority: 1 },
    { url: SITE + '/category', changeFrequency: 'daily', priority: 0.8, lastModified: newest(products) },
  ];
  const categoryPages = categories.map(c => ({
    url: SITE + '/category/' + encodeURIComponent(c.name),
    changeFrequency: 'weekly', priority: 0.7,
    lastModified: newest(products.filter(p => p.category === c.name)),
  }));
  const productPages = products.map(p => ({
    url: SITE + '/product/' + p.id,
    changeFrequency: 'weekly', priority: 0.6,
    lastModified: p.updatedAt ? new Date(p.updatedAt) : undefined,
  }));
  return [...staticPages, ...categoryPages, ...productPages];
}
