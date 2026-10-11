import { SITE } from '@/lib/site.js';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/vendor', '/admin', '/cart', '/checkout', '/login', '/signup', '/forgot-password', '/reset-password', '/account'] }],
    sitemap: SITE + '/sitemap.xml',
  };
}
