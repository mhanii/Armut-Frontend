// Seed the database with a single coherent dataset reconciled from the three
// frontend fixture files (mockData / vendorData / adminData).
//
//   npm run seed    populate an EMPTY database (refuses to touch existing data)
//   npm run reset   wipe everything and repopulate — destroys real orders
//
// The guard exists because seeding is a first-deploy step: running it by
// reflex on a live database would delete every customer, order and listing.
const { db } = require('./db.js');
const { hash } = require('./auth.js');

const FORCE = process.argv.includes('--reset') || process.argv.includes('--force');
const TABLES = ['reviews', 'order_items', 'orders', 'addresses', 'products', 'categories', 'banners', 'vendors', 'users', 'admins'];

// What is already in there?
const existing = TABLES
  .map(t => ({ t, n: db.prepare(`SELECT COUNT(*) AS n FROM ${t}`).get().n }))
  .filter(r => r.n > 0);

if (existing.length && !FORCE) {
  console.error('✖ This database already has data:');
  for (const r of existing) console.error(`    ${r.n.toString().padStart(6)}  ${r.t}`);
  console.error('\n  Seeding would DELETE all of it, including real orders and customers.');
  console.error('  If that is genuinely what you want:  npm run reset\n');
  process.exit(1);
}

// ---- default credentials (printed at the end) ------------------------------
const ADMIN_PW = 'admin123';
const VENDOR_PW = 'vendor123';
const CLIENT_PW = 'client123';

// ---- vendors ---------------------------------------------------------------
const VENDORS = [
  { store: 'Armut Modern Designs', handle: 'armut-modern', manager: 'Selin Aydın', email: 'studio@armutmodern.com', city: 'İstanbul', joined: '2023-02-11', since: '2023', status: 'Active',
    description: 'Handcrafted contemporary furniture, made in İstanbul. We design pieces that bring warmth and quiet confidence to any room.',
    address: 'Bomonti Mah. 34381, Şişli, İstanbul', phone: '+90 212 555 0142' },
  { store: 'Bosphorus Woodworks', handle: 'bosphorus-wood', manager: 'Emre Çelik', email: 'hello@bosphoruswood.com', city: 'İstanbul', joined: '2023-08-04', since: '2023', status: 'Active',
    description: 'Solid-timber joinery inspired by the strait. Tables, shelving and seating built to outlive us.',
    address: 'Cihangir Mah. 34433, Beyoğlu, İstanbul', phone: '+90 212 555 0198' },
  { store: 'Anatolia Home', handle: 'anatolia-home', manager: 'Derya Koç', email: 'sales@anatoliahome.com', city: 'İzmir', joined: '2024-05-19', since: '2024', status: 'Active',
    description: 'Bedroom and storage pieces with an Aegean calm. Natural oils, honest materials.',
    address: 'Alsancak Mah. 35220, Konak, İzmir', phone: '+90 232 555 0121' },
  { store: 'Kilim & Co.', handle: 'kilim-co', manager: 'Baran Yıldız', email: 'contact@kilimco.com', city: 'Ankara', joined: '2025-01-27', since: '2025', status: 'Pending',
    description: 'Handwoven rugs and textile-led accents from Central Anatolia.',
    address: 'Kızılay Mah. 06420, Çankaya, Ankara', phone: '+90 312 555 0173' },
  { store: 'Loom Studio', handle: 'loom-studio', manager: 'Naz Şen', email: 'naz@loomstudio.com', city: 'Bursa', joined: '2025-09-02', since: '2025', status: 'Suspended',
    description: 'Small-batch upholstery studio.',
    address: 'Osmangazi, Bursa', phone: '+90 224 555 0155' },
];

const DEFAULT_COLORS = [{ name: 'Natural', hex: '#c9a06a' }, { name: 'Charcoal', hex: '#3a3a3a' }];

// ---- products (canonical 16-item catalog, mapped onto vendors) -------------
// v = vendor store name; colors default unless a bespoke palette is given.
const PRODUCTS = [
  { name: 'Minimalist Sofa', v: 'Armut Modern Designs', category: 'Living Room', price: 799.99, discount: 12, rating: 4.8, reviewCount: 24, stock: 24, status: 'Active',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop',
    description: 'A sleek, comfortable sofa with a minimalist frame, upholstered in durable soft-touch fabric.',
    colors: [{ name: 'Charcoal', hex: '#3a3a3a' }, { name: 'Sand', hex: '#c9b79c' }, { name: 'Clay', hex: '#bd7a50' }] },
  { name: 'Oak Dining Table', v: 'Armut Modern Designs', category: 'Dining', price: 499.50, discount: 0, rating: 4.9, reviewCount: 18, stock: 8, status: 'Active',
    image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=800&auto=format&fit=crop',
    description: 'Solid oak dining table that comfortably seats six, with a warm natural grain.',
    colors: [{ name: 'Natural Oak', hex: '#c9a06a' }, { name: 'Walnut', hex: '#5b3a24' }] },
  { name: 'Velvet Accent Chair', v: 'Bosphorus Woodworks', category: 'Living Room', price: 249.00, discount: 12, rating: 4.6, reviewCount: 11, stock: 0, status: 'Out of stock',
    image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=800&auto=format&fit=crop',
    description: 'A luxurious velvet accent chair with brushed-brass legs. A perfect statement piece.',
    colors: [{ name: 'Emerald', hex: '#2f6b52' }, { name: 'Blush', hex: '#d7a9a1' }] },
  { name: 'Modern Platform Bed', v: 'Anatolia Home', category: 'Bedroom', price: 650.00, discount: 0, rating: 4.7, reviewCount: 32, stock: 15, status: 'Active',
    image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800&auto=format&fit=crop',
    description: 'Low-profile platform bed with an upholstered headboard for a serene bedroom.',
    colors: [{ name: 'Slate', hex: '#4a4f55' }, { name: 'Linen', hex: '#d8cdbb' }] },
  { name: 'Scandinavian Bookshelf', v: 'Bosphorus Woodworks', category: 'Storage', price: 320.00, discount: 0, rating: 4.5, reviewCount: 9, stock: 3, status: 'Flagged',
    image: 'https://images.unsplash.com/photo-1605116959031-6e2d13a2ee56?q=80&w=800&auto=format&fit=crop',
    description: 'An open-back bookshelf with clean lines, ideal for books and objects.',
    colors: [{ name: 'Ash', hex: '#cbb99a' }] },
  { name: 'Leather Recliner', v: 'Armut Modern Designs', category: 'Living Room', price: 899.99, discount: 15, rating: 4.9, reviewCount: 41, stock: 11, status: 'Active',
    image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop',
    description: 'Full-grain leather recliner with a hand-finished timber base for lasting comfort.',
    colors: [{ name: 'Cognac', hex: '#8a4b2a' }, { name: 'Black', hex: '#2a2622' }] },
  { name: 'Round Coffee Table', v: 'Armut Modern Designs', category: 'Living Room', price: 280.00, discount: 0, rating: 4.8, reviewCount: 15, stock: 9, status: 'Active',
    image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop',
    description: 'A round coffee table with a honed marble top and slim metal frame.' },
  { name: 'Oak Nightstand', v: 'Anatolia Home', category: 'Bedroom', price: 130.00, discount: 0, rating: 4.5, reviewCount: 7, stock: 20, status: 'Active',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop',
    description: 'A simple, elegant nightstand with a soft-close drawer.' },
  { name: 'Full-Length Mirror', v: 'Anatolia Home', category: 'Bedroom', price: 150.00, discount: 10, rating: 4.8, reviewCount: 20, stock: 12, status: 'Active',
    image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=800&auto=format&fit=crop',
    description: 'A full-length mirror with a thin, warm-toned metal frame.' },
  { name: 'Kitchen Island', v: 'Bosphorus Woodworks', category: 'Dining', price: 750.00, discount: 0, rating: 4.7, reviewCount: 13, stock: 6, status: 'Active',
    image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=800&auto=format&fit=crop',
    description: 'Butcher-block kitchen island with generous built-in storage.' },
  { name: 'Bar Stool Set', v: 'Bosphorus Woodworks', category: 'Dining', price: 190.00, discount: 0, rating: 4.6, reviewCount: 8, stock: 18, status: 'Active',
    image: 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop',
    description: 'A set of two modern bar stools with solid-wood seats.' },
  { name: 'Entryway Bench', v: 'Kilim & Co.', category: 'Storage', price: 220.00, discount: 0, rating: 4.6, reviewCount: 6, stock: 7, status: 'Pending review',
    image: 'https://images.unsplash.com/photo-1757419095875-d50e9d48b574?q=80&w=800&auto=format&fit=crop',
    description: 'A stylish entryway bench with woven shoe storage beneath.' },
  { name: 'Floating Shelves', v: 'Kilim & Co.', category: 'Storage', price: 90.00, discount: 0, rating: 4.6, reviewCount: 22, stock: 30, status: 'Active',
    image: 'https://images.unsplash.com/photo-1588111948296-83a8e036e004?q=80&w=800&auto=format&fit=crop',
    description: 'A set of three floating shelves for a minimalist display.' },
  { name: 'Upholstered Wardrobe', v: 'Anatolia Home', category: 'Bedroom', price: 1200.00, discount: 8, rating: 4.9, reviewCount: 17, stock: 4, status: 'Active',
    image: 'https://images.unsplash.com/photo-1672137233327-37b0c1049e77?q=80&w=800&auto=format&fit=crop',
    description: 'A large wardrobe with soft-close doors and ample storage.' },
  { name: 'Slat Lounge Chair', v: 'Armut Modern Designs', category: 'Living Room', price: 340.00, discount: 0, rating: 4.7, reviewCount: 10, stock: 10, status: 'Active',
    image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop',
    description: 'A slatted hardwood lounge chair with a linen cushion.' },
  { name: 'Extendable Dining Set', v: 'Bosphorus Woodworks', category: 'Dining', price: 980.00, discount: 12, rating: 4.8, reviewCount: 14, stock: 6, status: 'Active',
    image: 'https://images.unsplash.com/photo-1758977404038-8aa1845d6635?q=80&w=800&auto=format&fit=crop',
    description: 'An extendable dining table with six matching upholstered chairs.' },
];

// ---- reviews ---------------------------------------------------------------
// Real review rows are generated per product so that each product's rating and
// review count are DERIVED from actual data (not a hardcoded number). Ratings
// are distributed to average the product's target score.
const REVIEW_AUTHORS = ['Ada Y.', 'Mert D.', 'Elif K.', 'Can Ö.', 'Zeynep A.', 'Deniz Ş.', 'Burak T.', 'Selin M.', 'Kaan R.', 'Ece B.', 'Ozan V.', 'Lale N.', 'Emir S.', 'Nil A.'];
const REVIEW_COMMENTS = [
  'Beautiful craftsmanship — even better in person.',
  'Solid and well made. Delivery and assembly were smooth.',
  'Exactly as pictured. Very happy with it.',
  'Great quality for the price. Would buy again.',
  'The finish is gorgeous and it feels really sturdy.',
  'Comfortable and stylish. Fits our space perfectly.',
  'Arrived on time and packaged carefully.',
  'Lovely piece, though it was a little smaller than I expected.',
  'Warm, natural materials. You can tell it is handmade.',
  'Assembly took a while but the result is worth it.',
  'Looks elegant and the colour is spot on.',
  'Sturdy build and a really clean design.',
  '', '', '', // some reviews are a rating with no written comment
];

// Deterministic integer ratings (count items) averaging ~target, values 3–5.
function buildRatings(target, count) {
  const base = Math.max(3, Math.min(5, Math.floor(target)));
  const highs = base >= 5 ? 0 : Math.round((target - base) * count);
  const out = [];
  for (let i = 0; i < count; i++) out.push(Math.min(5, i < highs ? base + 1 : base));
  // interleave so highs/lows aren't clustered
  out.sort((a, b) => (a * 7 + 3) % 5 - (b * 7 + 3) % 5);
  return out;
}

// ---- customers -------------------------------------------------------------
const CLIENTS = [
  { name: 'Ada Yılmaz', email: 'ada@example.com', joined: '2025-03-02', title: 'Home', street: 'Bağdat Cd. 120', district: 'Kadıköy, İstanbul' },
  { name: 'Mert Demir', email: 'mert@example.com', joined: '2025-06-18', title: 'Home', street: 'Levent Mah. 45', district: 'Beşiktaş, İstanbul' },
  { name: 'Elif Kaya', email: 'elif@example.com', joined: '2024-11-25', title: 'Home', street: 'Alsancak Mah. 22', district: 'Konak, İzmir' },
  { name: 'Can Öztürk', email: 'can@example.com', joined: '2026-01-09', title: 'Home', street: 'Kızılay Mah. 7', district: 'Çankaya, Ankara' },
  { name: 'Zeynep Arslan', email: 'zeynep@example.com', joined: '2026-04-30', title: 'Office', street: 'Nispetiye Cd. 61', district: 'Beşiktaş, İstanbul' },
  { name: 'Deniz Şahin', email: 'deniz@example.com', joined: '2026-05-01', title: 'Home', street: 'Konak Mah. 14', district: 'Konak, İzmir' },
];
const addressLine = (c) => `${c.title} — ${c.street}, ${c.district}`;

// ---- orders (with line items; totals computed) -----------------------------
const ORDERS = [
  { id: 1042, customer: 'Ada Yılmaz', vendor: 'Armut Modern Designs', date: '2026-07-14', status: 'Processing',
    items: [{ name: 'Minimalist Sofa', qty: 1, price: 703.99 }, { name: 'Round Coffee Table', qty: 1, price: 280.00 }, { name: 'Slat Lounge Chair', qty: 1, price: 340.00 }] },
  { id: 1041, customer: 'Mert Demir', vendor: 'Armut Modern Designs', date: '2026-07-13', status: 'Shipped',
    items: [{ name: 'Oak Dining Table', qty: 1, price: 499.50 }] },
  { id: 1040, customer: 'Elif Kaya', vendor: 'Bosphorus Woodworks', date: '2026-07-12', status: 'Delivered',
    items: [{ name: 'Velvet Accent Chair', qty: 1, price: 219.12 }, { name: 'Scandinavian Bookshelf', qty: 1, price: 320.00 }] },
  { id: 1039, customer: 'Can Öztürk', vendor: 'Anatolia Home', date: '2026-07-11', status: 'Delivered',
    items: [{ name: 'Modern Platform Bed', qty: 1, price: 650.00 }] },
  { id: 1038, customer: 'Zeynep Arslan', vendor: 'Bosphorus Woodworks', date: '2026-07-10', status: 'Cancelled',
    items: [{ name: 'Velvet Accent Chair', qty: 1, price: 249.00 }] },
  { id: 1037, customer: 'Deniz Şahin', vendor: 'Anatolia Home', date: '2026-07-09', status: 'Processing',
    items: [{ name: 'Oak Nightstand', qty: 1, price: 130.00 }, { name: 'Full-Length Mirror', qty: 1, price: 135.00 }] },
];

// ---- home slider + rooms ---------------------------------------------------
const BANNERS = [
  { title: 'Design Your Comfort Zone', subtitle: 'Furniture handcrafted in Türkiye, made for the way you live.', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1600&auto=format&fit=crop' },
  { title: 'The Warm Minimal Home', subtitle: 'Solid hardwood pieces, delivered and assembled across the city.', image: 'https://images.unsplash.com/photo-1609081144289-eacc3108cd03?q=80&w=1600&auto=format&fit=crop' },
  { title: 'New Bedroom Collection', subtitle: 'Create your personal sanctuary with our latest arrivals.', image: 'https://images.unsplash.com/photo-1699869653495-fe26f4c70b3e?q=80&w=1600&auto=format&fit=crop' },
];

const CATEGORIES = [
  { name: 'Living Room', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop' },
  { name: 'Bedroom', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800&auto=format&fit=crop' },
  { name: 'Dining', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=800&auto=format&fit=crop' },
  { name: 'Storage', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop' },
];

// ---------------------------------------------------------------------------
const seed = db.transaction(() => {
  for (const t of TABLES) db.prepare(`DELETE FROM ${t}`).run();
  db.prepare(`DELETE FROM sqlite_sequence`).run();

  // admin
  db.prepare(`INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)`)
    .run('Armut Admin', 'admin@armut.com', hash(ADMIN_PW));

  // vendors
  const vIns = db.prepare(`INSERT INTO vendors (store, handle, manager, email, password_hash, city, description, address, phone, since, joined, status)
                           VALUES (@store, @handle, @manager, @email, @password_hash, @city, @description, @address, @phone, @since, @joined, @status)`);
  const vendorId = {};
  for (const v of VENDORS) {
    const r = vIns.run({ ...v, password_hash: hash(VENDOR_PW) });
    vendorId[v.store] = r.lastInsertRowid;
  }

  // products
  const pIns = db.prepare(`INSERT INTO products (vendor_id, name, category, price, discount, stock, rating, review_count, status, description, image, colors, photos, created_at, updated_at)
                           VALUES (@vendor_id, @name, @category, @price, @discount, @stock, @rating, @review_count, @status, @description, @image, @colors, @photos, @created_at, @created_at)`);
  const productId = {};
  for (const p of PRODUCTS) {
    const r = pIns.run({
      vendor_id: vendorId[p.v], name: p.name, category: p.category, price: p.price, discount: p.discount,
      stock: p.stock, rating: p.rating, review_count: p.reviewCount, status: p.status, description: p.description,
      image: p.image, colors: JSON.stringify(p.colors || DEFAULT_COLORS), photos: JSON.stringify([p.image]),
      created_at: new Date().toISOString(),
    });
    productId[p.name] = r.lastInsertRowid;
  }

  // reviews — generate real rows, then derive each product's rating/count
  const rIns = db.prepare(`INSERT INTO reviews (product_id, user_id, author, rating, comment, created_at) VALUES (?, NULL, ?, ?, ?, ?)`);
  let seq = 0;
  for (const p of PRODUCTS) {
    const pid = productId[p.name];
    const ratings = buildRatings(p.rating, p.reviewCount);
    ratings.forEach((rating, i) => {
      const author = REVIEW_AUTHORS[seq % REVIEW_AUTHORS.length];
      const comment = REVIEW_COMMENTS[seq % REVIEW_COMMENTS.length];
      const daysAgo = (i * 9 + seq * 3) % 240 + 1;
      const date = new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10);
      rIns.run(pid, author, rating, comment, date);
      seq++;
    });
    const agg = db.prepare(`SELECT COUNT(*) AS n, COALESCE(AVG(rating), 0) AS avg FROM reviews WHERE product_id = ?`).get(pid);
    db.prepare(`UPDATE products SET rating = ?, review_count = ? WHERE id = ?`)
      .run(agg.n ? Math.round(agg.avg * 10) / 10 : 0, agg.n, pid);
  }

  // customers
  const uIns = db.prepare(`INSERT INTO users (name, email, password_hash, status, created_at) VALUES (?, ?, ?, 'Active', ?)`);
  const aIns = db.prepare(`INSERT INTO addresses (user_id, title, street, district, is_default, created_at) VALUES (?, ?, ?, ?, 1, ?)`);
  const userId = {}, userAddress = {};
  for (const c of CLIENTS) {
    const r = uIns.run(c.name, c.email, hash(CLIENT_PW), c.joined);
    userId[c.name] = r.lastInsertRowid;
    // Every customer starts with one saved delivery address, so the consoles
    // show a real "deliver to" line on their orders.
    aIns.run(r.lastInsertRowid, c.title, c.street, c.district, c.joined);
    userAddress[c.name] = addressLine(c);
  }

  // orders + items
  const oIns = db.prepare(`INSERT INTO orders (id, user_id, vendor_id, customer, date, status, total, address, delivery_method)
                           VALUES (@id, @user_id, @vendor_id, @customer, @date, @status, @total, @address, @delivery_method)`);
  const oiIns = db.prepare(`INSERT INTO order_items (order_id, product_id, name, qty, price) VALUES (?, ?, ?, ?, ?)`);
  for (const o of ORDERS) {
    const total = Math.round(o.items.reduce((s, i) => s + i.price * i.qty, 0) * 100) / 100;
    oIns.run({
      id: o.id, user_id: userId[o.customer] || null, vendor_id: vendorId[o.vendor] || null,
      customer: o.customer, date: o.date, status: o.status, total,
      address: userAddress[o.customer] || null, delivery_method: o.delivery || 'standard',
    });
    for (const it of o.items) oiIns.run(o.id, productId[it.name] || null, it.name, it.qty, it.price);
  }

  // banners + categories
  const bIns = db.prepare(`INSERT INTO banners (title, subtitle, image, sort_order) VALUES (?, ?, ?, ?)`);
  BANNERS.forEach((b, i) => bIns.run(b.title, b.subtitle, b.image, i));
  const cIns = db.prepare(`INSERT INTO categories (name, image, sort_order) VALUES (?, ?, ?)`);
  CATEGORIES.forEach((c, i) => cIns.run(c.name, c.image, i));
});

seed();

console.log(FORCE && existing.length ? '✔ Database reset and re-seeded.\n' : '✔ Seed complete.\n');
console.log('  Default accounts');
console.log('  ────────────────');
console.log(`  Admin     admin@armut.com          / ${ADMIN_PW}`);
console.log(`  Vendor    studio@armutmodern.com   / ${VENDOR_PW}   (Armut Modern Designs)`);
console.log(`  Vendor    hello@bosphoruswood.com  / ${VENDOR_PW}   (Bosphorus Woodworks)`);
console.log(`  Customer  ada@example.com          / ${CLIENT_PW}`);
console.log('\n  Change these passwords before the site goes live.\n');
process.exit(0);
