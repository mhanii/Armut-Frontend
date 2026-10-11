// Behaviour the markup cannot show: does auto-moving content stop when asked?
//
// WCAG 2.2.2 wants a mechanism to pause, stop or hide anything that moves by
// itself for more than five seconds. Pausing on hover is not that mechanism —
// it is undiscoverable and useless to someone reading with the pointer
// elsewhere — and no parser can tell the difference, which is why this drives
// a real browser instead.
//
// Needs Chrome with --remote-debugging-port=9222 and the site on :3000.
//   node tests/motion-audit.mjs
const CDP = 'http://127.0.0.1:9222';
const SITE = process.env.SITE || 'http://localhost:3000';

let targets;
try {
  targets = await (await fetch(CDP + '/json/list')).json();
} catch (e) {
  console.log('motion: no browser on :9222 — skipped (this check needs one)');
  process.exit(0);
}
const page = targets.find(t => t.type === 'page');
if (!page) { console.log('motion: no page target — skipped'); process.exit(0); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (m, p = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
await new Promise(r => ws.addEventListener('open', r));
const sleep = ms => new Promise(r => setTimeout(r, ms));
const ev = async x => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.value;

const slide = "([...document.querySelectorAll('.hero__slide')].findIndex(s=>!s.hidden))";
const label = "(document.querySelector('.hero__toggle')||{}).getAttribute?.('aria-label')";
let fails = 0;
const check = (name, ok, detail = '') => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? '  — ' + detail : ''}`); if (!ok) fails++; };

await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });

console.log('hero slideshow');
await send('Page.navigate', { url: SITE + '/' }); await sleep(4500);
const dots = await ev("document.querySelectorAll('.hero__dot').length");
if (!dots || dots < 2) { console.log('  (only one slide — nothing to check)'); process.exit(0); }

check('a pause control exists', !!(await ev(label)));
check('it starts on "pause"', /pause/i.test((await ev(label)) || ''));

await ev("document.querySelector('.hero__toggle').click();1"); await sleep(300);
const at = await ev(slide);
check('clicking it offers "resume"', /resume/i.test((await ev(label)) || ''));
await sleep(9000);
check('paused really stops the rotation', (await ev(slide)) === at, `slide ${at} -> ${await ev(slide)}`);

await ev("document.querySelector('.hero__toggle').click();1"); await sleep(8500);
check('resuming starts it again', (await ev(slide)) !== at);

await send('Page.navigate', { url: SITE + '/' }); await sleep(4500);
await ev("document.querySelectorAll('.hero__dot')[1].click();1"); await sleep(500);
const picked = await ev(slide);
await sleep(9000);
check('choosing a slide keeps it', (await ev(slide)) === picked, `stayed on ${picked}`);

await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
await send('Page.navigate', { url: SITE + '/' }); await sleep(4500);
const first = await ev(slide);
await sleep(9000);
check('reduced motion does not rotate', (await ev(slide)) === first);
await send('Emulation.setEmulatedMedia', { features: [] });

console.log(fails ? `\n${fails} check(s) failed` : '\nAuto-moving content can be stopped.');
process.exit(fails ? 1 : 0);
