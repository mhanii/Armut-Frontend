#!/usr/bin/env node
// Account recovery and bootstrap from the server's own shell — the things the
// consoles cannot do because there is no one signed in yet.
//
//   node src/accounts.js admin:add <email> <name> [password]
//   node src/accounts.js passwd <admin|vendor|user> <email> [password]
//   node src/accounts.js verify <email>          mark a customer's email confirmed
//
// With no password argument it reads one from $NEW_PASSWORD, so the secret need
// not land in shell history.
const { db } = require('./db.js');
const { hash } = require('./auth.js');

const [cmd, ...a] = process.argv.slice(2);
const TABLES = { admin: 'admins', vendor: 'vendors', user: 'users' };
const die = (m) => { console.error(m); process.exit(1); };
const password = (arg) => {
  const pw = arg || process.env.NEW_PASSWORD;
  if (!pw || pw.length < 8) die('Give a password of at least 8 characters (argument or NEW_PASSWORD).');
  return pw;
};

if (cmd === 'admin:add') {
  const [email, name] = a;
  if (!email || !name) die('usage: admin:add <email> <name> [password]');
  const e = email.toLowerCase();
  if (db.prepare(`SELECT 1 FROM admins WHERE email = ?`).get(e)) die(`An admin with ${e} already exists (use passwd to change it).`);
  db.prepare(`INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)`).run(name, e, hash(password(a[2])));
  console.log(`Admin ${e} created.`);
} else if (cmd === 'passwd') {
  const [role, email] = a;
  if (!TABLES[role] || !email) die('usage: passwd <admin|vendor|user> <email> [password]');
  const r = db.prepare(`UPDATE ${TABLES[role]} SET password_hash = ? WHERE email = ?`).run(hash(password(a[2])), email.toLowerCase());
  if (!r.changes) die(`No ${role} with email ${email}.`);
  console.log(`Password updated for ${role} ${email}.`);
} else if (cmd === 'verify') {
  const r = db.prepare(`UPDATE users SET email_verified_at = COALESCE(email_verified_at, ?) WHERE email = ?`).run(new Date().toISOString(), (a[0] || '').toLowerCase());
  if (!r.changes) die(`No customer with email ${a[0]}.`);
  console.log(`${a[0]} marked as verified.`);
} else {
  die('usage: accounts.js admin:add | passwd | verify  (see the header of this file)');
}
