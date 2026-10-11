'use client';
import React from 'react';
import Link from 'next/link';
import { HeroSlider } from '@/components/ui/HeroSlider.jsx';
import { CategoryTile } from '@/components/ui/CategoryTile.jsx';
import { ProductCard } from '@/components/ui/ProductCard.jsx';
import { Thumb } from '@/components/ui/Thumb.jsx';
import { useStore } from './StoreProvider.jsx';

// The one photograph on the site that is not in the content model — banners and
// room tiles are both admin-editable, this band's image is not. Until it is,
// it at least lives in one named place rather than inline in the markup.
const CRAFT_PHOTO = {
  src: 'https://images.unsplash.com/photo-1533090161767-e6ffed986c88?q=80&w=1200&auto=format&fit=crop',
  // The alt used to read "A craftsman finishing a wooden chair by hand". The
  // photograph is a wall clock, a lamp and a plant above a desk — there is no
  // craftsman and no chair in it. A screen reader was being told about a
  // picture that does not exist. This describes the one that does.
  alt: 'A wooden wall clock above a desk with a lamp and a small potted plant',
};

function SectionHead({ eyebrow, title, note, action, href, id }) {
  return (
    <div className="section-head">
      <div className="section-head__text">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 className="display-2" id={id}>{title}</h2>
        {note && <p className="section-head__note">{note}</p>}
      </div>
      {action && href && <Link href={href} className="link-btn">{action}</Link>}
    </div>
  );
}

const PROMISES = [
  'Handcrafted in Türkiye',
  'Solid hardwood',
  'Delivered & assembled',
  '30-day returns',
];

function TrustStrip() {
  return (
    <div className="trust">
      <div className="container">
        <ul className="trust__list">
          {PROMISES.map(item => (
            <li key={item} className="trust__item">
              <span className="trust__dot" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function Home({ banners, categories, products }) {
  // Prefer the live catalog (admin slider edits, vendor product changes) once it
  // has loaded; fall back to the server-rendered snapshot for the first paint.
  const live = useStore()?.catalog;
  if (live) { banners = live.banners; categories = live.categories; products = live.products; }

  // Both product sections used to be slices off the front of the same array —
  // featured was products[0..3] and the collection products[0..7], so the page
  // printed the same four cards twice under two different headings. Nothing
  // says "assembled from a template" faster. They now answer different
  // questions, and the second cannot repeat the first.
  //
  // The catalog arrives ordered by id ascending (insertion order), so the old
  // slice was not even showing the newest pieces — it was showing the oldest.
  // Featuring a piece nobody can buy wastes the best slot on the page, so the
  // sold-out ones are not candidates — unless the whole catalog is sold out,
  // in which case an empty section would be stranger than an honest one.
  const featured = React.useMemo(() => {
    const available = products.filter(p => !(p.stock != null && p.stock <= 0));
    return [...(available.length ? available : products)]
      .sort((a, b) => (b.rating - a.rating) || (b.reviewCount - a.reviewCount))
      .slice(0, 4);
  }, [products]);

  const rest = React.useMemo(() => {
    const shown = new Set(featured.map(p => p.id));
    return products.filter(p => !shown.has(p.id)).sort((a, b) => b.id - a.id).slice(0, 8);
  }, [products, featured]);

  return (
    <>
      {/* One h1 for the page. The hero rotates, so its headlines are h2s
          beneath this rather than three competing h1s. */}
      <h1 className="visually-hidden">Armut — handcrafted Turkish furniture</h1>
      <HeroSlider banners={banners} />
      <TrustStrip />

      {/* Rooms come first: most shoppers arrive knowing the room, not the piece. */}
      <section className="section" aria-labelledby="rooms-head">
        <div className="container">
          <SectionHead id="rooms-head" eyebrow="Browse" title="Shop by room" action="All rooms" href="/category" />
          <div className="grid grid--categories">
            {categories.map(c => <CategoryTile key={c.name} {...c} />)}
          </div>
        </div>
      </section>

      <section className="section section--surface" aria-labelledby="featured-head">
        <div className="container">
          <SectionHead id="featured-head" eyebrow="Curated" title="Featured pieces"
            note="The pieces our customers rate highest." action="Shop all" href="/category" />
          <div className="grid grid--products">
            {featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* The editorial band gets the most room on the page — it is the one
          section meant to slow the reader down rather than move them along. */}
      <section className="section section--loose" aria-labelledby="craft-head">
        <div className="container">
          <div className="split split--media" style={{ gap: 0, alignItems: 'stretch', background: 'var(--surface-muted)', overflow: 'hidden', borderRadius: 'var(--radius-md)' }}>
            <div className="stack stack--lg" style={{ padding: 'clamp(2rem, 6vw, 4.5rem)', justifyContent: 'center' }}>
              <p className="eyebrow">Our promise</p>
              <h2 className="display-2" id="craft-head">
                Built by Turkish hands, <em style={{ color: 'var(--brand-700)' }}>made to last</em> a lifetime.
              </h2>
              <p className="lede">
                Every piece is crafted from responsibly sourced hardwood in our
                İstanbul workshop, then delivered and assembled in your home.
              </p>
              <div><Link href="/category" className="btn">Discover the craft</Link></div>
            </div>
            {/* Was a div with a background-image, which cannot lazy-load and
                cannot fail visibly: if the URL went away — and nine of the
                seeded photos already had — the band silently became an empty
                grey rectangle with no way to tell. A real img goes through
                Thumb, which falls back to the shared placeholder. */}
            <div className="craft__media">
              <Thumb className="craft__img" src={CRAFT_PHOTO.src} alt={CRAFT_PHOTO.alt}
                slot={720} sizes="(max-width: 60rem) 100vw, 45rem"
                fallbackClassName="craft__empty" fallback="" loading="lazy" />
            </div>
          </div>
        </div>
      </section>

      {/* Only worth a section if there is something here the reader has not
          already scrolled past. A five-product catalog should not be padded
          out with a second grid of the same five. The top-right link is gone
          too: one section, one link, and the button below the grid is the
          stronger of the two. */}
      {rest.length > 0 && (
        <section className="section section--surface" aria-labelledby="collection-head">
          <div className="container">
            <SectionHead id="collection-head" eyebrow="Shop" title="The collection"
              note="Everything else in the workshop right now, newest first." />
            <div className="grid grid--products">
              {rest.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
            <div className="row" style={{ justifyContent: 'center', marginTop: 'clamp(2rem, 5vw, 3.5rem)' }}>
              <Link href="/category" className="btn btn--outline btn--lg">View all products</Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
