// Minimal Chrome DevTools Protocol driver: navigate, optionally run script
// (to inject a session), then screenshot. Enough to capture signed-in pages.
const [,, url, out, width='1440', height='1600', script='', after=''] = process.argv;
const base = 'http://127.0.0.1:9222';

const list = async () => (await fetch(base + '/json/list')).json();
let targets = await list();
let page = targets.find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0; const pending = new Map();
const send = (method, params={}) => new Promise(res => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({id:i, method, params})); });
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); }
});
await new Promise(r => ws.addEventListener('open', r));

await send('Emulation.setDeviceMetricsOverride', { width:+width, height:+height, deviceScaleFactor:1, mobile:+width < 600 });
if (script) {
  await send('Page.navigate', { url: new URL('/', url).href });
  await new Promise(r => setTimeout(r, 1500));
  await send('Runtime.evaluate', { expression: script });
}
await send('Page.navigate', { url });
await new Promise(r => setTimeout(r, 6000));
// Optional post-load script, for reaching state that only exists after a
// click — console tabs, an opened dialog, an expanded row.
if (after) {
  await send('Runtime.evaluate', { expression: after, awaitPromise: true });
  await new Promise(r => setTimeout(r, 2500));
}
const { data } = await send('Page.captureScreenshot', { format: 'png' });
const fs = await import('node:fs');
fs.writeFileSync(out, Buffer.from(data, 'base64'));
console.log('saved', out);
process.exit(0);
