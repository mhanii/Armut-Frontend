'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ProductCard } from '@/components/ui/ProductCard.jsx';
import { useStore } from './StoreProvider.jsx';

// What a shopper actually asks a furniture grid. Sorting is on the price they
// are shown — the discounted one — because sorting by list price while
// displaying sale price puts the cards in an order the page contradicts.
const paid = (p) => (p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price);

export const SORTS = [
  { key: 'featured',   label: 'Featured' },
  { key: 'price-asc',  label: 'Price: low to high', cmp: (a, b) => paid(a) - paid(b) },
  { key: 'price-desc', label: 'Price: high to low', cmp: (a, b) => paid(b) - paid(a) },
  { key: 'rating',     label: 'Top rated',          cmp: (a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount) },
  { key: 'newest',     label: 'Newest first',       cmp: (a, b) => b.id - a.id },
];

export function CategoryView({ products, category, query, sort }) {
  const live = useStore()?.catalog;
  const all = live ? live.products : products;
  const router = useRouter();
  const pathname = usePathname();

  const active = SORTS.find(s => s.key === sort) || SORTS[0];

  const list = React.useMemo(() => {
    const q = (query || '').trim().toLowerCase();
    let out = category ? all.filter(p => p.category === category) : all;
    // Every word, anywhere: "oak table" finds the Oak Dining Table, which a
    // single substring match never did. The maker's name is on every listing,
    // so it is searchable too.
    const words = q.split(/\s+/).filter(Boolean);
    if (words.length) out = out.filter(p => {
      const hay = [p.name, p.category, p.vendor].filter(Boolean).join(' ').toLowerCase();
      return words.every(w => hay.includes(w));
    });
    const sorted = active.cmp ? [...out].sort(active.cmp) : [...out];
    // Whatever the shopper sorted by, they did not ask to be shown things they
    // cannot buy first. Sold-out pieces keep their place relative to each other
    // and sink below everything available — Array#sort is stable, so this is a
    // second pass rather than a tie-break bolted into every comparator.
    const gone = (p) => (p.stock != null && p.stock <= 0 ? 1 : 0);
    return sorted.sort((a, b) => gone(a) - gone(b));
  }, [all, category, query, active]);

  // The sort lives in the URL, not in component state, so a sorted grid can be
  // linked, reloaded and stepped back out of. 'featured' is the default and so
  // leaves no parameter behind.
  const onSort = (key) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (key !== 'featured') params.set('sort', key);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const title = query ? `“${query}”` : (category || 'All furniture');

  return (
    <div className="container page">
      <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="/" className="meta">Home</Link>
        <span className="meta" aria-hidden="true"> / </span>
        {category
          ? <><Link href="/category" className="meta">Furniture</Link><span className="meta" aria-hidden="true"> / </span><span className="meta" aria-current="page">{category}</span></>
          : <span className="meta" aria-current="page">Furniture</span>}
      </nav>

      <div className="section-head">
        <div className="section-head__text">
          <p className="eyebrow">{query ? 'Search results' : 'Collection'}</p>
          <h1 className="display-1">{title}</h1>
        </div>
      </div>

      {/* The count used to hang off the heading with nothing beside it. It is
          the left half of a toolbar; the sort is the right half. */}
      {list.length > 0 && (
        <div className="toolbar">
          <p className="meta" aria-live="polite">
            {list.length} {list.length === 1 ? 'piece' : 'pieces'}
          </p>
          <div className="sort">
            <label className="sort__label" htmlFor="sort-select">Sort</label>
            <select id="sort-select" className="sort__select" value={active.key} onChange={e => onSort(e.target.value)}>
              {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
      )}

      {list.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: 'clamp(3rem, 8vw, 4.5rem)' }}>
          <p className="lede" style={{ margin: '0 auto var(--space-6)' }}>
            {query
              ? <>Nothing matches “{query}”.</>
              : <>New pieces for this room are on their way.</>}
          </p>
          <Link href="/category" className="btn btn--outline">Browse all furniture</Link>
        </div>
      ) : (
        <section aria-labelledby="results-head">
          <h2 className="visually-hidden" id="results-head">
            {category ? `${category} furniture` : 'All furniture'}
          </h2>
          <div className="grid grid--products">
            {list.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
