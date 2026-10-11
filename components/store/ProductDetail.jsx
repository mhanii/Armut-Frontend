'use client';
import { fmtDate } from '@/lib/date.js';
import { money } from '@/lib/money.js';
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api.js';
import { Icon } from '@/components/ui/Icon.jsx';
import { Button } from '@/components/ui/Button.jsx';
import { Thumb } from '@/components/ui/Thumb.jsx';
import { ProductCard } from '@/components/ui/ProductCard.jsx';
import { useStore } from './StoreProvider.jsx';

function Stars({ value, size = 15 }) {
  return (
    <span className="rating" aria-hidden="true">
      {[...Array(5)].map((_, i) => (
        <Icon key={i} name="star" size={size} style={{ color: i < Math.round(value) ? 'var(--star)' : 'var(--border-strong)' }} />
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  const [hover, setHover] = React.useState(0);
  return (
    <span className="star-picker" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n} type="button" role="radio" aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
          onClick={() => onChange(n)}
        >
          <Icon name="star" size={26} style={{ color: (hover || value) >= n ? 'var(--star)' : 'var(--border-strong)' }} />
        </button>
      ))}
    </span>
  );
}

function ReviewForm({ productId, onSubmitted }) {
  const [rating, setRating] = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState('');
  const id = React.useId();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (rating < 1) { setError('Please pick a star rating.'); return; }
    setBusy(true);
    try {
      const res = await api.store.addReview(productId, { rating, comment });
      setRating(0); setComment('');
      onSubmitted(res);
    } catch (err) { setError(err.message || 'Could not submit your review.'); }
    setBusy(false);
  };

  return (
    <form className="panel stack review-form" onSubmit={submit} style={{ background: 'var(--surface-muted)', marginBottom: 'var(--space-8)' }}>
      <h3 className="display-3" style={{ fontSize: 'var(--text-lg)', fontFamily: 'var(--font-sans)', fontWeight: 'var(--weight-semibold)' }}>Write a review</h3>
      <StarPicker value={rating} onChange={setRating} />
      <div className="field">
        <label className="field__label" htmlFor={id}>Your thoughts (optional)</label>
        <textarea
          id={id} className="field__textarea" rows={3} maxLength={1000}
          value={comment} onChange={e => setComment(e.target.value)}
          placeholder="How does the piece look and feel in your room?"
        />
      </div>
      {error && <p className="field__error" role="alert">{error}</p>}
      <div><Button type="submit" variant="dark" disabled={busy}>{busy ? 'Submitting…' : 'Submit review'}</Button></div>
    </form>
  );
}

// Stock is shown rather than hidden behind a boolean: "only 2 left" is real
// information a buyer acts on, and the number was already in the payload.
function StockLine({ stock }) {
  if (stock == null) return null;
  if (stock <= 0) return <p className="stock stock--out">Out of stock</p>;
  if (stock <= 3) return <p className="stock stock--low">Only {stock} left in stock</p>;
  return <p className="stock stock--ok">In stock</p>;
}

const REVIEWS_SHOWN = 5;

export function ProductDetail({ product: initial, related = [] }) {
  const router = useRouter();
  const { addToCart, goCheckout, user } = useStore();
  const [product, setProduct] = React.useState(initial);
  const [reviews, setReviews] = React.useState(initial.reviews || []);
  const [activePhoto, setActivePhoto] = React.useState(0);
  const [allReviews, setAllReviews] = React.useState(false);

  // Re-fetch from the API on mount so the page reflects live data (price, stock,
  // reviews) rather than the build-time snapshot used for SSR/SEO.
  React.useEffect(() => {
    let alive = true;
    api.store.getProduct(initial.id).then(p => { if (alive) { setProduct(p); setReviews(p.reviews || []); } }).catch(() => {});
    return () => { alive = false; };
  }, [initial.id]);

  const finalPrice = product.discount > 0 ? product.price * (1 - product.discount / 100) : product.price;
  const photos = (product.photos && product.photos.length) ? product.photos : [product.image].filter(Boolean);
  const colors = product.colors || [];
  const mainImage = photos[Math.min(activePhoto, photos.length - 1)] || product.image;
  const outOfStock = product.stock != null && product.stock <= 0;

  const onReviewSubmitted = (res) => {
    setReviews(res.reviews || []);
    setProduct(p => ({ ...p, rating: res.rating, reviewCount: res.reviewCount }));
  };

  return (
    <div className="container page">
      <nav aria-label="Breadcrumb" style={{ marginBottom: 'var(--space-6)' }}>
        <Link href="/" className="meta">Home</Link>
        <span className="meta" aria-hidden="true"> / </span>
        {product.category && <>
          <Link href={`/category/${encodeURIComponent(product.category)}`} className="meta">{product.category}</Link>
          <span className="meta" aria-hidden="true"> / </span>
        </>}
        <span className="meta" aria-current="page">{product.name}</span>
      </nav>

      <div className="split split--even">
        <div className="pdp__gallery">
          <div className="pdp__main">
            {/* The largest image on the page, and the one worth the pixels —
                but a 2x screen still only needs ~1200, not whatever the
                stored URL happened to say. */}
            <Thumb src={mainImage} alt={product.name} fallbackClassName="card__empty"
              slot={640} sizes="(max-width: 60rem) 100vw, 40rem" fetchPriority="high" />
          </div>
          {photos.length > 1 && (
            <div className="pdp__thumbs">
              {photos.map((src, i) => (
                <button
                  key={i} type="button" className="pdp__thumb"
                  aria-current={i === activePhoto}
                  aria-label={`Show image ${i + 1} of ${photos.length}`}
                  onClick={() => setActivePhoto(i)}
                >
                  <Thumb src={src} alt="" loading="lazy" fallback="" slot={96} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp__buy stack stack--lg">
          <div className="stack stack--sm">
            {product.category && <p className="eyebrow">{product.category}</p>}
            <h1 className="display-2">{product.name}</h1>
          </div>

          <div className="row" style={{ gap: 'var(--space-3)' }}>
            <Stars value={product.rating} />
            <span className="meta">
              {product.reviewCount > 0
                ? `${product.rating} out of 5 · ${product.reviewCount} review${product.reviewCount === 1 ? '' : 's'}`
                : 'No reviews yet'}
            </span>
          </div>

          <div className="stack stack--sm">
            <p className="pdp__price">
              <span className="pdp__price-now">{money(finalPrice)}</span>
              {product.discount > 0 && <span className="pdp__price-was">{money(product.price)}</span>}
            </p>
            <StockLine stock={product.stock} />
          </div>

          {product.description && <p className="lede" style={{ maxWidth: '34rem' }}>{product.description}</p>}

          {/* Colours are shown as information, not as a selector. The cart and
              order payload carry no variant, so a picker here would let someone
              choose "Navy" and be shipped whatever the vendor sends. */}
          {colors.length > 0 && (
            <div className="stack stack--sm">
              <p className="pdp__fact-label">Available in</p>
              <ul className="swatch-list list-reset">
                {colors.map((c, i) => (
                  <li key={c.name + i} className="swatch-item">
                    <span className="swatch" style={{ background: c.hex }} aria-hidden="true" />
                    <span className="meta">{c.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Both buttons were rendered and both disabled when a piece is sold
              out, which is correct but reads as two dead controls — and a
              disabled dark button and a disabled outline button look the same,
              so the primary/secondary distinction collapsed into noise. One
              button, stating the fact. */}
          <div className="row" style={{ gap: 'var(--space-3)' }}>
            {outOfStock ? (
              <Button variant="outline" size="lg" disabled>Out of stock</Button>
            ) : (
              <>
                <Button variant="dark" size="lg" onClick={() => addToCart(product)}>Add to cart</Button>
                <Button variant="outline" size="lg" onClick={() => { addToCart(product); goCheckout(); }}>
                  Buy now
                </Button>
              </>
            )}
          </div>

          <div className="pdp__facts">
            {/* A shopper could not see which workshop made a piece until after
                they had bought it, on their order history. On a marketplace —
                and on one whose promise is "built by Turkish hands" — the
                maker is part of what is being sold. It sits with the other
                facts about the purchase rather than crowding the buy button. */}
            {product.vendor && (
              <div>
                <p className="pdp__fact-label">Made by</p>
                <p className="pdp__fact-value">{product.vendor}</p>
              </div>
            )}
            <div>
              <p className="pdp__fact-label">Delivery</p>
              <p className="pdp__fact-value">$50 standard · $90 express</p>
            </div>
            <div>
              <p className="pdp__fact-label">Assembly</p>
              <p className="pdp__fact-value">Included at home</p>
            </div>
            <div>
              <p className="pdp__fact-label">Returns</p>
              <p className="pdp__fact-value">30 days</p>
            </div>
          </div>
        </div>
      </div>

      <section className="reviews" aria-labelledby="reviews-head">
        <div className="row" style={{ gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
          <h2 className="display-3" id="reviews-head">Reviews</h2>
          {product.reviewCount > 0 && (
            <span className="row" style={{ gap: 'var(--space-2)' }}>
              <Stars value={product.rating} size={14} />
              <span className="meta">{product.rating} out of 5 · {product.reviewCount}</span>
            </span>
          )}
        </div>

        {user
          ? <ReviewForm productId={product.id} onSubmitted={onReviewSubmitted} />
          : (
            <p className="note" style={{ marginBottom: 'var(--space-8)' }}>
              <button type="button" className="link-btn" onClick={() => router.push('/login')}>Sign in</button> to write a review.
            </p>
          )}

        {reviews.length === 0 ? (
          <p className="body">Be the first to review this piece.</p>
        ) : (
          <>
            {/* Every review used to render at once — fine at 24, unusable at
                300. The rest are one click away. */}
            <div>
              {(allReviews ? reviews : reviews.slice(0, REVIEWS_SHOWN)).map(r => {
                const comment = (r.comment || '').trim();
                return (
                  <article key={r.id} className={`review${comment ? '' : ' review--rating-only'}`}>
                    <div className="review__head">
                      <span className="review__author">{r.author}{r.mine ? ' (You)' : ''}</span>
                      <time className="meta" dateTime={r.date}>{fmtDate(r.date)}</time>
                    </div>
                    <Stars value={r.rating} size={13} />
                    <span className="visually-hidden">{r.rating} out of 5</span>
                    {/* A review with no text is a rating, not an empty
                        paragraph. Saying so beats leaving a blank row. */}
                    {comment
                      ? <p className="body" style={{ marginTop: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>{comment}</p>
                      : <p className="meta" style={{ marginTop: 'var(--space-2)' }}>Rated without a written review.</p>}
                  </article>
                );
              })}
            </div>
            {reviews.length > REVIEWS_SHOWN && (
              <Button variant="outline" onClick={() => setAllReviews(v => !v)} aria-expanded={allReviews}>
                {allReviews
                  ? 'Show fewer reviews'
                  : `Show all ${reviews.length} reviews`}
              </Button>
            )}
          </>
        )}
      </section>

      {/* The page used to end at the reviews and drop straight into the
          footer, which left the reader with nowhere to go but back. */}
      {related.length > 0 && (
        <section className="section section--tight" aria-labelledby="related-head">
          <div className="section-head">
            <div className="section-head__text">
              <p className="eyebrow">Also in this room</p>
              <h2 className="display-3" id="related-head">More from {product.category}</h2>
            </div>
            <Link href={`/category/${encodeURIComponent(product.category)}`} className="link-btn">
              All {product.category}
            </Link>
          </div>
          <div className="grid grid--products">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
