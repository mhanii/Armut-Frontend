// 2026-07-18 reads like a log line; "Jul 18, 2026" reads like a date. UTC so
// the server render and the browser agree on the day.
const DATE = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const fmtDate = (d) => { const t = Date.parse(d); return Number.isFinite(t) ? DATE.format(t) : (d || ''); };
