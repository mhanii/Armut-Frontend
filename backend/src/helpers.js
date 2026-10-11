// Shared: input validation + row→API-shape mappers that mirror lib/api.js contracts.

// Throwable API error → turned into a JSON response by the error middleware.
class ApiError extends Error {
  constructor(message, status = 400, code = 'error') { super(message); this.status = status; this.code = code; }
}

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function assertCreds(email, password) {
  if (!EMAIL.test(email || '')) throw new ApiError('Enter a valid email address.', 422, 'validation');
  if (!password || password.length < 6) throw new ApiError('Password must be at least 6 characters.', 422, 'validation');
}

const num = (v, d = 0) => { const n = Number(v); return Number.isFinite(n) ? n : d; };
const int = (v, d = 0) => { const n = parseInt(v, 10); return Number.isFinite(n) ? n : d; };
const jparse = (s, d) => { try { return JSON.parse(s); } catch (e) { return d; } };
const today = () => new Date().toISOString().slice(0, 10);
const round2 = (n) => Math.round((num(n) + Number.EPSILON) * 100) / 100;

// ---- shape mappers ---------------------------------------------------------

// Storefront catalog / product-detail shape.
function toStoreProduct(r) {
  return {
    id: r.id, name: r.name, price: r.price, discount: r.discount,
    rating: r.rating, reviewCount: r.review_count, category: r.category,
    image: r.image, description: r.description,
    colors: jparse(r.colors, []), photos: jparse(r.photos, []), stock: r.stock,
    // On a marketplace the maker is part of what is being sold — especially
    // one whose pitch is "built by Turkish hands". Shoppers could not see who
    // made a piece until after they had bought it, on their order history.
    vendor: r.vendor_store || null,
    // When this listing last changed, for the sitemap. Falls back to creation
    // for a listing nobody has edited since — which is the truth for it.
    updatedAt: r.updated_at || r.created_at || null,
  };
}

// Vendor-console product shape.
function toVendorProduct(r) {
  return {
    id: r.id, name: r.name, category: r.category, price: r.price, discount: r.discount,
    stock: r.stock, rating: r.rating, status: r.status, description: r.description,
    colors: jparse(r.colors, []), photos: jparse(r.photos, []),
  };
}

// Admin-console product row (vendor name + primary photo).
function toAdminProduct(r) {
  return {
    id: r.id, name: r.name, vendor: r.vendor_store, category: r.category,
    price: r.price, stock: r.stock, status: r.status,
    photo: r.image || (jparse(r.photos, [])[0] || null),
  };
}

function toBanner(r) { return { id: r.id, title: r.title, subtitle: r.subtitle, image: r.image }; }
function toCategory(r) { return { id: r.id, name: r.name, image: r.image }; }

module.exports = { ApiError, EMAIL, assertCreds, num, int, jparse, today, round2, toStoreProduct, toVendorProduct, toAdminProduct, toBanner, toCategory };
