import { Instrument_Serif, Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { EnvSwitch } from '@/components/EnvSwitch.jsx';
import { CAN_OVERRIDE } from '@/lib/config.js';
import { SITE } from '@/lib/site.js';
import { THEME_INIT } from '@/lib/theme.js';

// Self-hosted and preloaded. The previous <link> to fonts.googleapis.com was a
// render-blocking third-party request, and text reflowed when the webfont
// arrived; next/font emits a size-adjusted fallback so it does not.
// 'latin-ext' matters here: İ, ı, ğ and ş are Latin Extended-A, so without it
// every "İstanbul", "Kadıköy" and "Beşiktaş" on the site — the brand's own
// vocabulary — fell back to a system font mid-sentence.
const display = Instrument_Serif({
  subsets: ['latin', 'latin-ext'],
  weight: '400',
  style: ['normal', 'italic'],
  display: 'swap',
  variable: '--font-display-loaded',
});
const sans = Hanken_Grotesk({
  subsets: ['latin', 'latin-ext'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans-loaded',
});

const DESC = 'Solid hardwood furniture handcrafted in Türkiye — sofas, dining, bedroom and storage pieces, delivered and assembled at your home.';

export const metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Armut — Handcrafted Turkish Furniture',
    template: '%s | Armut',
  },
  description: DESC,
  applicationName: 'Armut',
  robots: { index: true, follow: true },
  // No canonical here. Metadata is inherited, so a canonical on the root
  // layout put rel="canonical" href="/" on every page that does not set its
  // own — the cart, checkout, both consoles, the account, the order
  // confirmation and the 404 all told crawlers they were the home page.
  // They are all noindex, and Google's guidance is explicitly not to pair
  // noindex with a canonical pointing somewhere else: the signals conflict,
  // and the one that can win is the one that would carry noindex up to the
  // target. The pages that should declare a canonical do it themselves.
  openGraph: {
    type: 'website',
    siteName: 'Armut',
    title: 'Armut — Handcrafted Turkish Furniture',
    description: 'Solid hardwood furniture handcrafted in Türkiye, delivered and assembled at your home.',
    url: SITE,
    // A branded card rather than a hot-linked stock photo: it carries the
    // wordmark, survives Unsplash changing anything, and is the 1200x630 that
    // link unfurlers actually want.
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'Armut — handcrafted Turkish furniture' }],
  },
  twitter: { card: 'summary_large_image' },
  manifest: '/manifest.webmanifest',
};

export const viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4f0e9' },
    { media: '(prefers-color-scheme: dark)', color: '#15120f' },
  ],
  width: 'device-width',
  initialScale: 1,
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', name: 'Armut', url: SITE + '/' },
    {
      '@type': 'WebSite', name: 'Armut', url: SITE + '/',
      potentialAction: {
        '@type': 'SearchAction',
        target: SITE + '/category?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${display.variable} ${sans.variable}`}>
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
        {/* Runs before first paint so a dark-mode visitor never sees a white
            flash. It only reads localStorage and sets an attribute. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
      </head>
      <body>
        {children}
        {/* A build-time constant, so a production build drops the switch's
            code entirely instead of shipping it to return null. */}
        {CAN_OVERRIDE && <EnvSwitch />}
      </body>
    </html>
  );
}
