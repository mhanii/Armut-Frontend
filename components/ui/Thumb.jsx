'use client';
import React from 'react';
import { sized, srcSet } from '@/lib/img.js';

// Product imagery is hot-linked from a third party, and third-party images go
// away — nine of the seeded photos had already been removed upstream, which
// rendered as alt text sitting on a blank tile. A failed load now falls back
// to the same placeholder used when there is no image at all.
// `slot` is the CSS width this image is drawn at, at its largest. Given one,
// the image is requested at that size (and offered at 2x through srcset)
// instead of always pulling the stored rendition — see lib/img.js.
export function Thumb({ src, alt = '', className = '', fallbackClassName = 'card__empty', fallback = 'No image', slot, sizes, ...rest }) {
  const [failed, setFailed] = React.useState(false);
  React.useEffect(() => { setFailed(false); }, [src]);

  if (!src || failed) {
    return <span className={fallbackClassName} aria-hidden={alt ? undefined : true}>{fallback}</span>;
  }
  return (
    <img
      className={className}
      src={sized(src, slot)}
      srcSet={srcSet(src, slot)}
      sizes={sizes}
      alt={alt}
      onError={() => setFailed(true)}
      {...rest}
    />
  );
}
