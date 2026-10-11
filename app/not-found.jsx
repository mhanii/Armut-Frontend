import Link from 'next/link';

export const metadata = { title: 'Page not found', robots: { index: false } };

const ROOMS = ['Living Room', 'Bedroom', 'Dining', 'Storage'];

// This page renders outside the storefront layout, so it carries its own way
// out. Previously it offered a single "Back to Home" link — the fewest options
// at the moment someone is most lost.
export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="container page" style={{ minHeight: '70vh' }}>
      <div className="container--prose stack stack--lg" style={{ marginInline: 'auto', textAlign: 'center' }}>
        <p className="eyebrow">Error 404</p>
        <h1 className="display-1">This page has moved on</h1>
        <p className="lede" style={{ marginInline: 'auto' }}>
          The page you&apos;re looking for isn&apos;t here. Try one of our rooms,
          or head back to the collection.
        </p>

        <div className="row" style={{ justifyContent: 'center' }}>
          <Link href="/" className="btn btn--lg">Back to home</Link>
          <Link href="/category" className="btn btn--outline btn--lg">Browse all furniture</Link>
        </div>

        <nav aria-label="Rooms" style={{ marginTop: 'var(--space-4)' }}>
          <ul className="list-reset row" style={{ justifyContent: 'center', gap: 'var(--space-5)' }}>
            {ROOMS.map(name => (
              <li key={name}>
                <Link href={`/category/${encodeURIComponent(name)}`} className="link-btn">{name}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </main>
  );
}
