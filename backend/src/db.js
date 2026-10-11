// SQLite connection + schema. One file, synchronous (better-sqlite3), zero-config.
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

const DATA_DIR = path.resolve(__dirname, '..', process.env.DATA_DIR || './data');
fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'armut.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Active',
  created_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS vendors (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  store         TEXT NOT NULL,
  handle        TEXT,
  manager       TEXT,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  city          TEXT,
  description   TEXT,
  address       TEXT,
  phone         TEXT,
  since         TEXT,
  joined        TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'Pending'
);

CREATE TABLE IF NOT EXISTS products (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  vendor_id    INTEGER NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  category     TEXT,
  price        REAL NOT NULL DEFAULT 0,
  discount     REAL NOT NULL DEFAULT 0,
  stock        INTEGER NOT NULL DEFAULT 0,
  rating       REAL NOT NULL DEFAULT 0,
  review_count INTEGER NOT NULL DEFAULT 0,
  status       TEXT NOT NULL DEFAULT 'Draft',
  description  TEXT,
  image        TEXT,
  colors       TEXT NOT NULL DEFAULT '[]',
  photos       TEXT NOT NULL DEFAULT '[]',
  created_at   TEXT NOT NULL,
  updated_at   TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  author     TEXT NOT NULL,
  rating     INTEGER NOT NULL,
  comment    TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS addresses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  street     TEXT NOT NULL,
  district   TEXT NOT NULL,
  is_default INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_addresses_user ON addresses(user_id);

CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id         INTEGER REFERENCES users(id) ON DELETE SET NULL,
  vendor_id       INTEGER REFERENCES vendors(id) ON DELETE SET NULL,
  customer        TEXT NOT NULL,
  date            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Processing',
  total           REAL NOT NULL DEFAULT 0,
  address         TEXT,
  delivery_method TEXT
);

CREATE TABLE IF NOT EXISTS order_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id   INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  name       TEXT NOT NULL,
  qty        INTEGER NOT NULL DEFAULT 1,
  price      REAL NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS banners (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  subtitle   TEXT,
  image      TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS categories (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  image      TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0
);
`);

// `CREATE TABLE IF NOT EXISTS` is a no-op on a database that already exists,
// so every column added after the first deploy would silently never arrive on
// a live database — the schema above would describe something that is only
// true of a fresh install. Additive migrations, applied once, keep the two in
// step. Each is idempotent: adding a column that is already there is skipped,
// so this is safe to run on every boot.
function addColumn(table, column, definition) {
  const present = db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column);
  if (present) return false;
  db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  console.log(`[db] migrated: ${table}.${column} added`);
  return true;
}

addColumn('products', 'updated_at', 'TEXT');

// Password reset links. Only a SHA-256 of the token is stored, so a copy of
// the database cannot be turned into working reset links.
db.exec(`
CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  used_at    INTEGER
);
CREATE INDEX IF NOT EXISTS password_resets_user ON password_resets(user_id);
`);

module.exports = { db, DATA_DIR, addColumn };
