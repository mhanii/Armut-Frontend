'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon.jsx';
import { ThemeToggle } from './ThemeToggle.jsx';
import { useEdgeFade } from '@/lib/useEdgeFade.js';

// Categories live on their own rail beneath the bar. On narrow screens it
// scrolls horizontally instead of collapsing into a hamburger, so a shopper is
// always one tap from a room rather than two.
const DEFAULT_ROOMS = ['Living Room', 'Bedroom', 'Dining', 'Storage'];

export function Header({ rooms, cartCount = 0, userName, onSearch }) {
  const pathname = usePathname();
  const [q, setQ] = React.useState('');

  // Someone arriving on a shared /category?q=sofa link saw an empty search box
  // above results headed "sofa", and refining the search meant retyping it.
  // Read from the URL rather than useSearchParams: this component renders
  // inside statically-generated pages, where that hook needs a Suspense
  // boundary it does not have.
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const term = (new URLSearchParams(window.location.search).get('q') || '').trim();
    setQ(pathname.startsWith('/category') && term ? term : '');
  }, [pathname]);
  const list = (rooms && rooms.length ? rooms : DEFAULT_ROOMS).slice(0, 6);

  const [rail, fade] = useEdgeFade(list.length);

  const submit = (e) => { e.preventDefault(); onSearch?.(q); };

  const search = (variant) => (
    <form className={`header__search header__search--${variant}`} role="search" onSubmit={submit}>
      <label className="visually-hidden" htmlFor={`search-${variant}`}>Search furniture</label>
      <div className="search">
        <Icon name="search" size={16} aria-hidden="true" />
        <input
          id={`search-${variant}`}
          className="search__input"
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search furniture"
        />
      </div>
    </form>
  );

  return (
    <header className="header">
      <div className="container">
        <div className="header__bar">
          <Link href="/" className="header__logo">Armut</Link>
          {search('inline')}
          <div className="header__actions">
            <ThemeToggle />
            <Link href="/account" className="icon-btn" aria-label={userName ? `Your account, signed in as ${userName}` : 'Sign in'}>
              <Icon name="user" size={19} aria-hidden="true" />
              {userName && <span className="icon-btn__label">{userName}</span>}
            </Link>
            <Link href="/cart" className="icon-btn" aria-label={cartCount ? `Cart, ${cartCount} item${cartCount === 1 ? '' : 's'}` : 'Cart, empty'}>
              <Icon name="cart" size={19} aria-hidden="true" />
              {cartCount > 0 && <span className="icon-btn__count" aria-hidden="true">{cartCount}</span>}
            </Link>
          </div>
        </div>
        {search('stacked')}
      </div>
      <nav className="header__nav" aria-label="Rooms">
        <div className="container">
          <div className="header__rail" ref={rail} data-fade={fade}>
            <Link href="/category" className="header__link" aria-current={pathname === '/category' ? 'page' : undefined}>All furniture</Link>
            {list.map(name => {
              const href = `/category/${encodeURIComponent(name)}`;
              return (
                <Link key={name} href={href} className="header__link" aria-current={pathname === href ? 'page' : undefined}>
                  {name}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
