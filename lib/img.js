// Ask the image host for the size we are actually going to draw.
//
// Every photograph on the storefront is hot-linked from Unsplash, whose URLs
// carry the rendition in the query string. The stored URLs all say w=800 (or
// w=1600 for a hero slide) regardless of where they end up, so a room tile
// drawn 215px wide was downloading an 800px file — nearly four times the
// pixels it can show — and the home page carried 887 KB of imagery because of
// it. The stored URL stays as the admin typed it; only the request is resized.
//
// Anything that is not an Unsplash URL — a vendor's own upload under
// /uploads/, a data: URI, a relative path — is returned untouched.
const HOST = 'images.unsplash.com';

function withWidth(url, w) {
  try {
    const u = new URL(url, 'http://local');
    if (u.hostname !== HOST) return null;
    u.searchParams.set('w', String(Math.round(w)));
    return u.toString();
  } catch (e) {
    return null;
  }
}

// A social card is a fixed shape: 1200x630, or 1.91:1. A product page was
// handing over the raw catalogue photo — 800px wide at whatever ratio the
// photograph happens to be — with no dimensions declared. Platforms that
// cannot measure an image on the first scrape fall back to a small card or
// none, and a 3:2 photo dropped into a 1.91:1 frame is centre-cropped, which
// for furniture shot low in frame cuts the piece in half. Unsplash crops on
// request, so ask for the shape the card actually is.
export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export function ogImage(url) {
  if (!url) return null;
  try {
    const u = new URL(url, 'http://local');
    if (u.hostname !== HOST) return null;
    u.searchParams.set('w', String(OG_WIDTH));
    u.searchParams.set('h', String(OG_HEIGHT));
    u.searchParams.set('fit', 'crop');
    return u.toString();
  } catch (e) {
    return null;
  }
}

export function sized(url, width) {
  if (!url || !width) return url;
  return withWidth(url, width) || url;
}

// A srcset across the sensible renditions for a slot, so a phone does not pull
// a desktop file and a 2x screen still gets enough pixels. `width` is the CSS
// width of the slot at its largest.
export function srcSet(url, width) {
  if (!url || !width) return undefined;
  const widths = [width, width * 2].map(w => Math.min(Math.round(w), 2000));
  const set = [...new Set(widths)]
    .map(w => { const u = withWidth(url, w); return u ? `${u} ${w}w` : null; })
    .filter(Boolean);
  return set.length > 1 ? set.join(', ') : undefined;
}
