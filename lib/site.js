// Canonical public origin of the storefront, used for metadata, robots and the
// sitemap. Set NEXT_PUBLIC_SITE_URL at build time (e.g. https://armut.com).
export const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim().replace(/\/+$/, '');

// The browser's base URL for the API — public, and compiled into the bundle.
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');

// The URL the Next server itself uses for SSR and revalidation. Inside a
// container the public hostname may not route back (and in compose it would
// take a needless trip out through the proxy), so API_INTERNAL_URL can point
// straight at the service — e.g. http://api:4000. Falls back to the public URL
// when it is not set, which is correct for a single-host deployment.
export const API_SERVER_URL =
  (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
