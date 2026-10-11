'use client';
import React from 'react';

// Reports which edges of a horizontally scrolling strip still have content
// past them, as a `data-fade` value of "start", "end", "start end" or nothing.
//
// The rails that use this (the storefront's room nav, both console sidebars)
// each used to fade their right edge unconditionally below a breakpoint, which
// said the wrong thing twice: at a width where everything already fitted, the
// last item sat permanently half-faded as though more followed it; and where
// the rail really did scroll, reaching the end parked that last item under the
// gradient, so the one item you had scrolled for was the one you could never
// read. A fade is a promise that there is more — it should only appear when
// there is.
export function useEdgeFade(dep) {
  const ref = React.useRef(null);
  const [fade, setFade] = React.useState('');

  const measure = React.useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const at = el.scrollLeft;
    setFade([at > 1 ? 'start' : '', max - at > 1 ? 'end' : ''].filter(Boolean).join(' '));
  }, []);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    // A rail's own box does not change when its contents overflow, so the
    // observer alone would miss items arriving after the first paint; `dep`
    // covers that.
    const ro = typeof ResizeObserver === 'function' ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(el);
    return () => {
      el.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
      if (ro) ro.disconnect();
    };
  }, [measure, dep]);

  return [ref, fade || undefined];
}
