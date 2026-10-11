// Tiny in-process rate limiter for credential endpoints — enough to blunt
// password guessing on a single-instance deployment. No external dependency;
// state is per-process and resets on restart.
const hits = new Map();

function keyOf(req) {
  const email = String((req.body && req.body.email) || '').toLowerCase();
  return `${req.ip}|${req.path}|${email}`;
}

// max attempts per window (ms); replies 429 once exceeded.
function rateLimit({ max = 10, windowMs = 15 * 60 * 1000 } = {}) {
  return (req, res, next) => {
    const now = Date.now();
    const key = keyOf(req);
    const entry = hits.get(key);
    if (!entry || now > entry.reset) {
      hits.set(key, { count: 1, reset: now + windowMs });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      const retry = Math.ceil((entry.reset - now) / 1000);
      res.setHeader('Retry-After', String(retry));
      return res.status(429).json({ message: `Too many attempts. Try again in ${Math.ceil(retry / 60)} minute(s).`, code: 'rate_limited' });
    }
    next();
  };
}

// Drop expired buckets so the map cannot grow without bound.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (now > v.reset) hits.delete(k);
}, 10 * 60 * 1000).unref();

module.exports = { rateLimit };
