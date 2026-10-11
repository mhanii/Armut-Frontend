// Transactional email (nodemailer/SMTP).
//
// Sending is best-effort and never blocks or fails an API request: if SMTP is
// not configured the calls become no-ops (with a single boot-time warning), and
// delivery errors are logged rather than thrown.
const nodemailer = require('nodemailer');
const { db } = require('./db.js');
require('dotenv').config();

const {
  SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS,
  MAIL_FROM, ADMIN_NOTIFY_EMAILS, STORE_NAME, STORE_URL,
} = process.env;

const NAME = STORE_NAME || 'Armut';
const FROM = MAIL_FROM || (SMTP_USER ? `${NAME} <${SMTP_USER}>` : '');
const configured = Boolean(SMTP_HOST && FROM);

let transporter = null;
let transportBroken = false;
function tx() {
  if (!configured || transportBroken) return null;
  if (!transporter) {
    try {
      const port = parseInt(SMTP_PORT, 10) || 587;
      transporter = nodemailer.createTransport({
        host: SMTP_HOST,
        port,
        // Implicit TLS on 465; STARTTLS otherwise. SMTP_SECURE overrides.
        secure: SMTP_SECURE ? SMTP_SECURE === 'true' : port === 465,
        auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
      });
    } catch (err) {
      // Bad SMTP settings must not take checkout down with them.
      transportBroken = true;
      console.error('[mail] invalid SMTP configuration, email is disabled:', err.message);
      return null;
    }
  }
  return transporter;
}

if (!configured) {
  const how = 'set SMTP_HOST and MAIL_FROM (see .env.example) to enable order emails';
  if (process.env.NODE_ENV === 'production') console.warn(`[mail] SMTP is NOT configured — order emails will be skipped. ${how}.`);
  else console.log(`[mail] SMTP not configured — emails are skipped in this environment (${how}).`);
}

// Recipients for "new order" alerts: ADMIN_NOTIFY_EMAILS if set, else every admin account.
function adminRecipients() {
  const explicit = (ADMIN_NOTIFY_EMAILS || '').split(',').map(s => s.trim()).filter(Boolean);
  if (explicit.length) return explicit;
  try { return db.prepare(`SELECT email FROM admins`).all().map(a => a.email).filter(Boolean); }
  catch (e) { return []; }
}

// Fire-and-forget send. Never throws and always resolves — callers are in the
// request path and an email problem must never fail the operation that triggered it.
function send({ to, subject, html, text, replyTo }) {
  try {
    const recipients = (Array.isArray(to) ? to : [to]).filter(Boolean);
    if (!configured || recipients.length === 0) return Promise.resolve(false);
    const t = tx();
    if (!t) return Promise.resolve(false);
    return Promise.resolve(t.sendMail({ from: FROM, to: recipients.join(', '), subject, text, html, replyTo }))
      .then(() => true)
      .catch((err) => { console.error(`[mail] failed to send "${subject}" to ${recipients.join(', ')}:`, err.message); return false; });
  } catch (err) {
    console.error(`[mail] could not send "${subject}":`, err.message);
    return Promise.resolve(false);
  }
}

// Wrap a template so a malformed order (or a database hiccup while looking up
// recipients) degrades to "no email sent" instead of throwing into the caller.
const safe = (label, fn) => (...args) => {
  try { return fn(...args); }
  catch (err) { console.error(`[mail] could not build the ${label} email:`, err.message); return Promise.resolve(false); }
};

// ---- templates -------------------------------------------------------------

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// en-US grouping, same as the storefront: $1,453.98, not $1453.98.
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
const money = (n) => USD.format(Math.round(Number(n || 0) * 100) / 100);
// Same format as the site's lib/date.js: "Sep 23, 2026".
const DATE = new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const fmtDate = (d) => { const t = Date.parse(d); return Number.isFinite(t) ? DATE.format(t) : (d || ''); };
const METHOD = { standard: 'Standard delivery (3–5 business days)', express: 'Express delivery (1–2 business days)' };
const method = (m) => METHOD[m] || METHOD.standard;

// Palette mirrors the site tokens. Everything is inline and table-based:
// Outlook ignores <style> blocks and flexbox, and Gmail strips classes.
const C = { ink: '#1d1915', body: '#4a433b', muted: '#8a8175', line: '#e7e1d8', page: '#f4efe8', brand: '#a0643b' };
const FONT = `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`;
const SERIF = `Georgia,'Times New Roman',serif`;

function itemRows(items) {
  return items.map(i => `<tr>
    <td style="padding:12px 0;border-bottom:1px solid ${C.line};color:${C.ink}">${esc(i.name)}<span style="color:${C.muted}"> &times; ${i.qty}</span></td>
    <td style="padding:12px 0;border-bottom:1px solid ${C.line};text-align:right;color:${C.ink};white-space:nowrap">${money(i.price * i.qty)}</td>
  </tr>`).join('');
}

// Items, the delivery charge they imply, and the total — so the numbers in
// the email add up on their own without the reader doing arithmetic.
function totals(items, total, deliveryMethod) {
  const goods = items.reduce((s, i) => s + i.price * i.qty, 0);
  const delivery = Math.round((Number(total) - goods) * 100) / 100;
  const row = (l, v, strong) => `<tr><td style="padding:${strong ? '14px' : '6px'} 0 0;color:${strong ? C.ink : C.body};${strong ? 'font-weight:600;font-size:16px' : ''}">${l}</td><td style="padding:${strong ? '14px' : '6px'} 0 0;text-align:right;color:${C.ink};${strong ? 'font-weight:600;font-size:16px' : ''}">${v}</td></tr>`;
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">
    ${itemRows(items)}
    ${delivery > 0 ? row('Items', money(goods)) + row(esc(method(deliveryMethod).split(' (')[0]), money(delivery)) : ''}
    ${row('Total', money(total), true)}
  </table>`;
}

function detail(label, value) {
  return `<tr><td style="padding:4px 16px 4px 0;color:${C.muted};font-size:12px;text-transform:uppercase;letter-spacing:.08em;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:4px 0;color:${C.body};font-size:14px">${value}</td></tr>`;
}

function button(href, label) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:${C.ink};border-radius:4px">
    <a href="${esc(href)}" style="display:inline-block;padding:13px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;font-family:${FONT}">${esc(label)}</a>
  </td></tr></table>`;
}

function shell(heading, bodyHtml, preheader = '') {
  const url = (STORE_URL || '').replace(/\/+$/, '');
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"><meta name="color-scheme" content="light"></head>
<body style="margin:0;padding:0;background:${C.page}">
  <span style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(preheader)}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.page}"><tr><td align="center" style="padding:32px 16px">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;font-family:${FONT};color:${C.body};line-height:1.55">
      <tr><td style="padding:0 4px 20px;font-family:${SERIF};font-size:26px;color:${C.ink};letter-spacing:-.01em">${url ? `<a href="${esc(url)}" style="color:${C.ink};text-decoration:none">${esc(NAME)}</a>` : esc(NAME)}</td></tr>
      <tr><td style="background:#ffffff;border:1px solid ${C.line};border-radius:6px;padding:36px 32px">
        <h1 style="margin:0 0 12px;font-family:${SERIF};font-weight:400;font-size:28px;line-height:1.2;color:${C.ink}">${esc(heading)}</h1>
        ${bodyHtml}
      </td></tr>
      ${url ? `<tr><td style="padding:20px 4px 0;font-size:12px;color:${C.muted}"><a href="${esc(url)}" style="color:${C.brand}">${esc(url.replace(/^https?:\/\//, ''))}</a></td></tr>` : ''}
    </table>
  </td></tr></table>
</body></html>`;
}

const para = (html, extra = '') => `<p style="margin:0 0 16px;font-size:15px;color:${C.body};${extra}">${html}</p>`;
const fine = (html) => `<p style="margin:16px 0 0;font-size:13px;color:${C.muted}">${html}</p>`;

// A cart spanning several vendors is stored as one order row per vendor; the
// alert names every id so admins can find them all in the console.
const orderRef = (order) => (order.ids && order.ids.length > 1 ? order.ids.map(i => '#' + i).join(', ') : '#' + order.id);

// `order`: { id, ids[], date, total, deliveryMethod, address, items[], customer:{name,email} }
function orderPlacedAdmin(order) {
  const lines = order.items.map(i => `  - ${i.name} x${i.qty} — ${money(i.price * i.qty)}`).join('\n');
  const addr = order.address || '—';
  const ref = orderRef(order);
  const subject = `New order ${ref} — ${money(order.total)}`;
  const html = shell(`New order ${ref}`, `
    ${para(`Placed by <strong style="color:${C.ink}">${esc(order.customer.name)}</strong> (${esc(order.customer.email)}) on ${esc(fmtDate(order.date))}.`)}
    ${totals(order.items, order.total, order.deliveryMethod)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px">
      ${detail('Deliver to', esc(addr))}${detail('Method', esc(method(order.deliveryMethod)))}
    </table>`, `${order.customer.name} — ${money(order.total)}`);
  const text = `New order ${ref} (${money(order.total)})\nCustomer: ${order.customer.name} <${order.customer.email}>\nDate: ${fmtDate(order.date)}\n\nItems:\n${lines}\n\nDeliver to: ${addr}\nMethod: ${method(order.deliveryMethod)}\n`;
  return send({ to: adminRecipients(), subject, html, text, replyTo: order.customer.email });
}

function orderConfirmationCustomer(order) {
  if (!order.customer.email) return Promise.resolve(false);
  const lines = order.items.map(i => `  - ${i.name} x${i.qty} — ${money(i.price * i.qty)}`).join('\n');
  const url = (STORE_URL || '').replace(/\/+$/, '');
  const subject = `${NAME} — order #${order.id} confirmed`;
  const html = shell(`Thank you, ${order.customer.name}`, `
    ${para(`Your order <strong style="color:${C.ink}">#${order.id}</strong> is confirmed. We'll email you again when it ships.`)}
    ${totals(order.items, order.total, order.deliveryMethod)}
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px">
      ${detail('Delivering to', esc(order.address || '—'))}${detail('Method', esc(method(order.deliveryMethod)))}
    </table>
    ${url ? button(`${url}/account`, 'View your order') : ''}`, `Order #${order.id} — ${money(order.total)}`);
  const text = `Thank you, ${order.customer.name}!\n\nYour order #${order.id} is confirmed. We'll email you again when it ships.\n\nItems:\n${lines}\n\nTotal: ${money(order.total)}\nDelivering to: ${order.address || '—'}\nMethod: ${method(order.deliveryMethod)}\n`;
  return send({ to: order.customer.email, subject, html, text });
}

// One vendor's part of a checkout changed status. Sent for the changes a
// customer acts on; "Processing" is where every order starts, so it is silent.
const STATUS_COPY = {
  Shipped: { subject: 'has shipped', heading: 'Your order has shipped', body: 'has been shipped.' },
  Delivered: { subject: 'was delivered', heading: 'Your order was delivered', body: 'has been marked as delivered.' },
  Cancelled: { subject: 'was cancelled', heading: 'Your order was cancelled', body: 'has been cancelled.' },
};
function orderStatusCustomer({ order, status, customer, vendor }) {
  const copy = STATUS_COPY[status];
  if (!copy || !customer || !customer.email) return Promise.resolve(false);
  const url = (STORE_URL || '').replace(/\/+$/, '');
  const subject = `${NAME} — order #${order.id} ${copy.subject}`;
  const by = vendor ? ` from ${esc(vendor)}` : '';
  const html = shell(copy.heading, `
    ${para(`Hi ${esc(customer.name)}, order <strong style="color:${C.ink}">#${order.id}</strong>${by} ${copy.body}`)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px">${itemRows(order.items)}</table>
    ${order.address && status !== 'Cancelled' ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:20px">${detail('Delivering to', esc(order.address))}</table>` : ''}
    ${url ? button(`${url}/account`, 'View your orders') : ''}`, `Order #${order.id} ${copy.subject}`);
  const lines = order.items.map(i => `  - ${i.name} x${i.qty}`).join('\n');
  const text = `Hi ${customer.name},\n\nOrder #${order.id}${vendor ? ` from ${vendor}` : ''} ${copy.body}\n\n${lines}\n${url ? `\nYour orders: ${url}/account\n` : ''}`;
  return send({ to: customer.email, subject, html, text });
}

// Account emails. These are sent only to the address on the account, so the
// link inside is the proof of ownership.
function passwordReset({ name, email, link, minutes }) {
  const subject = `Reset your ${NAME} password`;
  const html = shell(`Reset your password`, `
    ${para(`Hi ${esc(name)}, someone — hopefully you — asked to reset the password for this account.`)}
    ${button(link, 'Choose a new password')}
    ${fine(`The link works once and expires in ${minutes} minutes. If you did not ask for this, ignore this email — your password has not changed.`)}`, 'Your reset link is inside — it expires in an hour.');
  const text = `Hi ${name},\n\nReset your ${NAME} password here (valid for ${minutes} minutes, works once):\n${link}\n\nIf you did not ask for this, ignore this email — your password has not changed.\n`;
  return send({ to: email, subject, html, text });
}

function passwordChanged({ name, email }) {
  const url = (STORE_URL || '').replace(/\/+$/, '');
  const subject = `Your ${NAME} password was changed`;
  const html = shell(`Your password was changed`, `
    ${para(`Hi ${esc(name)}, the password for this account was just changed.`)}
    ${fine(`If this was not you, reset your password straight away${url ? ` at <a href="${esc(url)}/forgot-password" style="color:${C.brand}">${esc(url.replace(/^https?:\/\//, ''))}/forgot-password</a>` : ''}.`)}`, 'A security notice about your account.');
  const text = `Hi ${name},\n\nThe password for your ${NAME} account was just changed. If this was not you, reset your password straight away${url ? ` at ${url}/forgot-password` : ''}.\n`;
  return send({ to: email, subject, html, text });
}

function welcome({ name, email }) {
  const subject = `Welcome to ${NAME}`;
  const url = (STORE_URL || '').replace(/\/+$/, '');
  const html = shell(`Welcome, ${name}`, `
    ${para(`Your account is ready.`)}
    ${para(`We'll email you a confirmation for each order, and again when it ships.`)}
    ${url ? button(`${url}/category`, 'Browse the collection') : ''}`, 'Your account is ready.');
  const text = `Welcome, ${name}!\n\nYour ${NAME} account is ready. We'll email you a confirmation for each order and again when it ships.\n`;
  return send({ to: email, subject, html, text });
}

module.exports = {
  passwordReset: safe('password-reset', passwordReset),
  passwordChanged: safe('password-changed', passwordChanged),
  welcome: safe('welcome', welcome),
  send, configured, adminRecipients,
  orderPlacedAdmin: safe('new-order', orderPlacedAdmin),
  orderConfirmationCustomer: safe('order-confirmation', orderConfirmationCustomer),
  orderStatusCustomer: safe('order-status', orderStatusCustomer),
};
