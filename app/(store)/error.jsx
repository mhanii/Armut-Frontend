'use client';
import React from 'react';
import Link from 'next/link';

// A storefront error should not also delete the storefront. The root
// app/error.jsx sits above StoreLayout, so an error there takes the header,
// the search box, the room rail and the basket down with the page. This one
// is inside the layout: only the page content is replaced, and the shopper
// keeps every way out they had a moment ago.
export default function StoreError({ error, reset }) {
  React.useEffect(() => { console.error('[armut] page failed:', error); }, [error]);

  return (
    <div className="container page">
      <div className="container--prose stack stack--lg" style={{ marginInline: 'auto', textAlign: 'center' }}>
        <p className="eyebrow" style={{ color: 'var(--danger-dark)' }}>Something went wrong</p>
        <h1 className="display-2">We couldn&apos;t load this page</h1>
        <p className="lede" style={{ marginInline: 'auto' }}>
          This is on our side, not yours. Trying again often works — the
          problem is usually brief.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <button type="button" className="btn btn--lg" onClick={() => reset()}>Try again</button>
          <Link href="/category" className="btn btn--outline btn--lg">Browse the collection</Link>
        </div>
        <p className="meta">Your basket is saved on this device and has not been lost.</p>
      </div>
    </div>
  );
}
