// Theme selection. "system" follows the OS; an explicit choice overrides it and
// persists. Kept tiny and dependency-free because the same logic runs as a
// blocking inline script before first paint.
export const THEME_KEY = 'armut.theme';

// Stringified into <head> so the document is already correct when it paints —
// otherwise a dark-mode visitor gets a white flash on every navigation.
export const THEME_INIT = `(function(){try{
var t=localStorage.getItem('${THEME_KEY}');
if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t);}
}catch(e){}})();`;

export function readTheme() {
  try {
    const t = localStorage.getItem(THEME_KEY);
    return t === 'dark' || t === 'light' ? t : 'system';
  } catch (e) { return 'system'; }
}

export function systemPrefersDark() {
  return typeof window !== 'undefined'
    && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}

export function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'system') {
    root.removeAttribute('data-theme');
    try { localStorage.removeItem(THEME_KEY); } catch (e) {}
  } else {
    root.setAttribute('data-theme', theme);
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) {}
  }
}
