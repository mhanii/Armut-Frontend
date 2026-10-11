'use client';
import React from 'react';
import { sized, srcSet } from '@/lib/img.js';
import Link from 'next/link';
import { Icon } from './Icon.jsx';

// Auto-advancing content needs a way to stop it (WCAG 2.2.2). Pausing on
// hover and on focus is good manners but does not satisfy that criterion: it
// is undiscoverable, and it is no use to someone who wants to read a headline
// while their pointer is somewhere else. There is a real control below.
//
// Reduced motion stops the rotation outright, and choosing a slide stops it
// for good — someone who has picked slide two should not be moved to slide
// three six seconds later.
export function HeroSlider({ banners, intervalMs = 6500, roomsHref = '/category' }) {
  const [current, setCurrent] = React.useState(0);
  const [hoverPaused, setHoverPaused] = React.useState(false);
  const [stopped, setStopped] = React.useState(false);
  const count = banners?.length || 0;

  const reduced = typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  React.useEffect(() => {
    if (count < 2 || stopped || hoverPaused || reduced) return undefined;
    const t = setTimeout(() => setCurrent(p => (p + 1) % count), intervalMs);
    return () => clearTimeout(t);
  }, [current, count, intervalMs, stopped, hoverPaused, reduced]);

  const goTo = (i) => { setCurrent(i); setStopped(true); };

  if (count === 0) return null;

  return (
    <section
      className="hero"
      aria-roledescription="carousel"
      aria-label="Featured collections"
      onMouseEnter={() => setHoverPaused(true)}
      onMouseLeave={() => setHoverPaused(false)}
      onFocusCapture={() => setHoverPaused(true)}
      onBlurCapture={() => setHoverPaused(false)}
    >
      <div className="container">
        {banners.map((b, i) => (
          <div
            key={b.id ?? i}
            className="hero__slide"
            hidden={i !== current}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${count}`}
          >
            <div className="hero__copy">
              <p className="eyebrow">New collection · İstanbul</p>
              <h2 className="display-1">{b.title}</h2>
              {b.subtitle && <p className="lede" style={{ maxWidth: '30rem' }}>{b.subtitle}</p>}
              <div className="row" style={{ gap: 'var(--space-5)' }}>
                <Link href="/category" className="btn btn--lg">Shop the collection</Link>
                <Link href={roomsHref} className="link-btn">Explore rooms</Link>
              </div>
            </div>
            <div className="hero__media">
              {/* All three slides were fetched at w=1600 on first paint, for a
                  column that is about 600px wide, and two of the three are
                  hidden. One of them alone was 407 KB. The visible slide is
                  still eager and high priority — it is the page's largest
                  paint — and the rest wait until they are shown. */}
              {b.image && (
                <img
                  className="hero__img"
                  src={sized(b.image, 800)}
                  srcSet={srcSet(b.image, 800)}
                  sizes="(max-width: 60rem) 100vw, 40rem"
                  alt=""
                  loading={i === 0 ? undefined : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : undefined}
                />
              )}
            </div>
          </div>
        ))}

        {count > 1 && (
          <div className="hero__controls">
            {banners.map((b, i) => (
              <button
                key={b.id ?? i}
                type="button"
                className="hero__dot"
                aria-current={i === current}
                aria-label={`Show slide ${i + 1}: ${b.title}`}
                onClick={() => goTo(i)}
              />
            ))}
            {/* The mechanism WCAG 2.2.2 actually asks for: always present,
                keyboard reachable, and it says which state it will put you
                in. Hidden when the rotation was never going to run. */}
            {!reduced && (
              <button
                type="button"
                className="hero__toggle"
                onClick={() => setStopped(v => !v)}
                aria-label={stopped ? 'Resume the slideshow' : 'Pause the slideshow'}
                title={stopped ? 'Resume' : 'Pause'}
              >
                <Icon name={stopped ? 'play' : 'pause'} size={13} aria-hidden="true" />
              </button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
