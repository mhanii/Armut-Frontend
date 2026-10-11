// Armut API server. Serves the Next.js storefront, vendor & admin consoles.
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { db } = require('./db.js');
const { UPLOAD_DIR } = require('./upload.js');
const { ApiError } = require('./helpers.js');
const storeRoutes = require('./routes/store.js');
const vendorRoutes = require('./routes/vendor.js');
const adminRoutes = require('./routes/admin.js');

const app = express();
app.disable('x-powered-by');
// Behind Dokploy/Traefik: trust the proxy so req.protocol and client IPs are right.
app.set('trust proxy', Number(process.env.TRUST_PROXY || 1));

const origins = (process.env.CORS_ORIGIN || '*').split(',').map(s => s.trim());
app.use(cors({ origin: origins.includes('*') ? true : origins }));
app.use(express.json({ limit: '2mb' }));
// The upload filter trusts the type the client declares, so never let a
// browser second-guess it: a file stored as .png is served — and read — as one.
app.use((req, res, next) => { res.setHeader('X-Content-Type-Options', 'nosniff'); next(); });

// Uploaded images (cross-origin so the frontend can hot-link them).
app.use('/uploads', express.static(UPLOAD_DIR, {
  setHeaders: (res) => res.setHeader('Access-Control-Allow-Origin', '*'),
}));

app.get('/', (req, res) => res.json({ name: 'Armut API', status: 'ok', version: 'v1' }));
app.get('/health', (req, res) => {
  try { db.prepare('SELECT 1').get(); }
  catch (e) { return res.status(503).json({ status: 'error', db: 'unavailable' }); }
  res.json({ status: 'ok', db: 'ok', mail: require('./mailer.js').configured ? 'configured' : 'disabled' });
});

app.use('/api/v1', storeRoutes);
app.use('/api/v1/vendor', vendorRoutes);
app.use('/api/v1/admin', adminRoutes);

// 404
app.use((req, res) => res.status(404).json({ message: 'Not found.', code: 'not_found' }));

// Central error handler — maps ApiError + multer errors to JSON.
app.use((err, req, res, next) => {
  if (err instanceof ApiError) return res.status(err.status).json({ message: err.message, code: err.code });
  if (err && err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed request body.', code: 'bad_request' });
  if (err && err.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.', code: 'too_large' });
  if (err && err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ message: 'Image is too large (max 8 MB).', code: 'too_large' });
  if (err && err.message && /Only image files/.test(err.message)) return res.status(422).json({ message: err.message, code: 'validation' });
  console.error(err);
  res.status(500).json({ message: 'Something went wrong on our end.', code: 'server_error' });
});

const PORT = process.env.PORT || 4000;
const HOST = process.env.HOST || '0.0.0.0';
const server = app.listen(PORT, HOST, () => console.log(`Armut API listening on http://${HOST}:${PORT}`));

// Containers stop with SIGTERM — finish in-flight requests, then close the DB.
for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    console.log(`${sig} received — shutting down.`);
    server.close(() => { try { db.close(); } catch (e) {} process.exit(0); });
    setTimeout(() => process.exit(1), 10000).unref();
  });
}
