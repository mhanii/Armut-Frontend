'use client';
import React from 'react';
import Link from 'next/link';

// Until now a server-side failure fell through to Next's own unbranded
// "Application error" screen, which says nothing, offers nothing, and looks
// like a different website. That mattered more once the catalogue stopped
// inventing itself when the API is unreachable in production: failing
// honestly is only an improvement if the failure is presented properly.
export default function ErrorBoundary({ error, reset }) {
  React.useEffect(() => {
    // Whatever collects logs gets the real thing; the page does not print it.
    console.error('[armut] render failed:', error);
  }, [error]);

  return (
    <main id="main" tabIndex={-1} className="container page" style={{ minHeight: '70vh' }}>
      <div className="container--prose stack stack--lg" style={{ marginInline: 'auto', textAlign: 'center' }}>
        <p className="eyebrow" style={{ color: 'var(--danger-dark)' }}>Something went wrong</p>
        <h1 className="display-1">We couldn&apos;t load this page</h1>
        <p className="lede" style={{ marginInline: 'auto' }}>
          This is on our side, not yours. Trying again often works — the
          problem is usually brief.
        </p>

        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn--lg" onClick={() => reset()}>Try again</button>
          <Link href="/" className="btn btn--outline btn--lg">Back to home</Link>
        </div>

        {/* An error page that only apologises is a dead end. Anything in the
            basket is on this device and is still there. */}
        <p className="meta" style={{ marginTop: 'var(--space-4)' }}>
          Your basket is saved on this device and has not been lost.{' '}
          <Link href="/category" className="link-btn">Browse the collection</Link>
        </p>
      </div>
    </main>
  );
}
