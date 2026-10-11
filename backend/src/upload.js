// Multer config for image uploads. Files land in UPLOAD_DIR and are served
// statically from /uploads by the server. Returns absolute URLs so the
// (separately-hosted) frontend can <img src> them directly.
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');
require('dotenv').config();

const UPLOAD_DIR = path.resolve(__dirname, '..', process.env.UPLOAD_DIR || './uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const EXT = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif', 'image/avif': '.avif' };

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const id = crypto.randomBytes(8).toString('hex');
    cb(null, Date.now() + '-' + id + (EXT[file.mimetype] || path.extname(file.originalname) || '.bin'));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
  fileFilter: (req, file, cb) => {
    if (ALLOWED.has(file.mimetype)) return cb(null, true);
    cb(new Error('Only image files (jpg, png, webp, gif, avif) are allowed.'));
  },
});

// Absolute public URL for a stored file.
function fileUrl(req, filename) {
  const base = (process.env.PUBLIC_URL || '').replace(/\/+$/, '') || `${req.protocol}://${req.get('host')}`;
  return `${base}/uploads/${filename}`;
}

module.exports = { upload, fileUrl, UPLOAD_DIR };
