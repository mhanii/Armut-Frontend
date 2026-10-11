/** @type {import('next').NextConfig} */

// Uploaded product imagery is served by the API host; allow it through
// next/image when an API URL is configured at build time.
const apiUrl = (process.env.NEXT_PUBLIC_API_URL || '').trim();
let apiPattern = null;
try {
  if (apiUrl) {
    const u = new URL(apiUrl);
    apiPattern = { protocol: u.protocol.replace(':', ''), hostname: u.hostname, port: u.port || undefined, pathname: '/uploads/**' };
  }
} catch (e) {
  console.warn('[next.config] NEXT_PUBLIC_API_URL is not a valid URL:', apiUrl);
}

const nextConfig = {
  reactStrictMode: true,
  // Self-contained server bundle for the Docker image (Dokploy deploys this).
  output: 'standalone',
  poweredByHeader: false,
  compress: true,
  // Product/banner/store imagery is hot-linked from Unsplash in the fixtures.
  // Components use plain <img>, but this keeps next/image usable if adopted later.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      ...(apiPattern ? [apiPattern] : []),
    ],
  },
  async headers() {
    return [{
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
      ],
    }];
  },
};

export default nextConfig;
