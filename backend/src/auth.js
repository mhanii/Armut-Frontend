// Password hashing (bcrypt) + JWT issue/verify + role-scoped Express middleware.
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const DEV_SECRET = 'armut-dev-secret-change-me';
const SECRET = process.env.JWT_SECRET || DEV_SECRET;

// A predictable signing key would let anyone mint admin tokens — refuse to boot.
if (process.env.NODE_ENV === 'production' && (SECRET === DEV_SECRET || SECRET.length < 32)) {
  console.error('[auth] JWT_SECRET must be set to a unique value of at least 32 characters in production.');
  console.error('[auth] Generate one with:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
  process.exit(1);
}
const EXPIRES = '30d';

const hash = (pw) => bcrypt.hashSync(pw, 10);
const compare = (pw, h) => bcrypt.compareSync(pw, h || '');

// role: 'store' | 'vendor' | 'admin'
function sign({ id, role, email, name }) {
  return jwt.sign({ sub: id, role, email, name }, SECRET, { expiresIn: EXPIRES });
}

function verify(token) {
  try { return jwt.verify(token, SECRET); } catch (e) { return null; }
}

// Build an auth middleware that requires a valid token of the given role.
// Sets req.auth = { id, role, email, name }.
function requireRole(role) {
  return (req, res, next) => {
    const h = req.headers.authorization || '';
    const token = h.startsWith('Bearer ') ? h.slice(7) : null;
    const payload = token && verify(token);
    if (!payload || payload.role !== role) {
      return res.status(401).json({ message: 'Your session has expired. Please sign in again.', code: 'unauthorized' });
    }
    req.auth = { id: payload.sub, role: payload.role, email: payload.email, name: payload.name };
    next();
  };
}

module.exports = { hash, compare, sign, verify, requireRole };
