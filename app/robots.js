import { SITE } from '@/lib/site.js';

export default function robots() {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/vendor', '/admin', '/cart', '/checkout', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/account'] }],
    sitemap: SITE + '/sitemap.xml',
  };
}
