// Armut environment config — where the app gets its data.
//
// Production: set NEXT_PUBLIC_API_URL at build time and the app talks to that
// API. Nothing else is needed — the mock fixtures and the <EnvSwitch/> widget
// are development conveniences and are inert once a URL is configured.
//
// Development: with no NEXT_PUBLIC_API_URL the app starts on the built-in mock
// fixtures, and the EnvSwitch pill (bottom-left) can point it at a local API.
// That choice persists in localStorage and never applies to a production build.
const ENV_URL = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
const ENV_MODE = (process.env.NEXT_PUBLIC_API_MODE || '').trim();
const IS_DEV = process.env.NODE_ENV !== 'production';

// An explicit mode wins; otherwise a configured URL means "live".
const DEFAULT_MODE = ENV_MODE === 'live' || ENV_MODE === 'mock' ? ENV_MODE : (ENV_URL ? 'live' : 'mock');

// The switch is a dev tool. NEXT_PUBLIC_ENABLE_API_SWITCH=true re-enables it on
// a deployed build (handy for a staging environment).
export const CAN_OVERRIDE = IS_DEV || process.env.NEXT_PUBLIC_ENABLE_API_SWITCH === 'true';

const KM = 'armut.apiMode', KU = 'armut.apiBaseUrl';
const get = (k, d) => {
  if (!CAN_OVERRIDE) return d;
  try { return (typeof window !== 'undefined' && localStorage.getItem(k)) || d; } catch (e) { return d; }
};
const set = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

export const ArmutConfig = {
  get mode() { return get(KM, DEFAULT_MODE) === 'live' ? 'live' : 'mock'; },
  get baseUrl() { return get(KU, ENV_URL).replace(/\/+$/, ''); },
  isLive() { return this.mode === 'live'; },
  canOverride: CAN_OVERRIDE,
  envUrl: ENV_URL,
  apply(m, url) { if (!CAN_OVERRIDE) return; set(KM, m); if (url != null) set(KU, String(url).trim().replace(/\/+$/, '')); location.reload(); },
  reset() { if (!CAN_OVERRIDE) return; try { localStorage.removeItem(KM); localStorage.removeItem(KU); } catch (e) {} location.reload(); },
};
