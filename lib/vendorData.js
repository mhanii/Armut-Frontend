// Vendor kit is scoped to ONE store owner ("the signed-in vendor"). No cross-vendor
// or user-management data lives here — that belongs to the separate admin console.
export const store = {
  name: 'Armut Modern Designs',
  handle: 'armut-modern',
  description: 'Handcrafted contemporary furniture, made in İstanbul. We design pieces that bring warmth and quiet confidence to any room.',
  address: 'Bomonti Mah. 34381, Şişli, İstanbul',
  email: 'studio@armutmodern.com',
  phone: '+90 212 555 0142',
  since: '2023',
};

export const categories = ['Living Room', 'Dining', 'Bedroom', 'Storage', 'Office'];

export const products = [
  { id: 1, name: 'Minimalist Sofa', category: 'Living Room', price: 799.99, discount: 12, stock: 24, rating: 4.8, status: 'Active',
    description: 'A sleek and comfortable sofa with a minimalist design, perfect for modern living spaces. Upholstered in durable, soft-touch fabric.',
    colors: [{ name: 'Charcoal', hex: '#3a3a3a' }, { name: 'Sand', hex: '#c9b79c' }, { name: 'Clay', hex: '#bd7a50' }],
    photos: ['https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop', 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=400&auto=format&fit=crop'] },
  { id: 2, name: 'Oak Dining Table', category: 'Dining', price: 499.50, discount: 0, stock: 8, rating: 4.6, status: 'Active',
    description: 'Solid oak dining table with a hand-oiled finish that brings warmth to any dining room. Seats six comfortably.',
    colors: [{ name: 'Natural Oak', hex: '#c9a06a' }, { name: 'Walnut', hex: '#5b3a24' }],
    photos: ['https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=400&auto=format&fit=crop'] },
  { id: 3, name: 'Velvet Accent Chair', category: 'Living Room', price: 249.00, discount: 12, stock: 0, rating: 4.9, status: 'Out of stock',
    description: 'A statement accent chair in plush velvet. The gentle curve of the back creates a serene, contemporary silhouette.',
    colors: [{ name: 'Emerald', hex: '#2f6b52' }, { name: 'Blush', hex: '#d7a9a1' }],
    photos: ['https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=400&auto=format&fit=crop'] },
  { id: 4, name: 'Modern Platform Bed', category: 'Bedroom', price: 650.00, discount: 0, stock: 15, rating: 4.7, status: 'Active',
    description: 'Low-profile platform bed that creates a serene and contemporary bedroom environment. Integrated headboard, no box spring needed.',
    colors: [{ name: 'Slate', hex: '#4a4f55' }, { name: 'Linen', hex: '#d8cdbb' }],
    photos: ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=400&auto=format&fit=crop'] },
  { id: 5, name: 'Scandinavian Bookshelf', category: 'Storage', price: 320.00, discount: 0, stock: 3, rating: 4.5, status: 'Draft',
    description: 'Open-frame ash bookshelf with five generous shelves. Light, airy, and quietly Scandinavian.',
    colors: [{ name: 'Ash', hex: '#cbb99a' }],
    photos: ['https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=400&auto=format&fit=crop'] },
  { id: 6, name: 'Leather Recliner', category: 'Living Room', price: 899.99, discount: 15, stock: 11, rating: 4.8, status: 'Active',
    description: 'Full-grain leather recliner that softens beautifully over time. A quiet corner of comfort for any living room.',
    colors: [{ name: 'Cognac', hex: '#8a4b2a' }, { name: 'Black', hex: '#2a2622' }],
    photos: ['https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=400&auto=format&fit=crop'] },
];

// Orders placed against THIS store's products only.
export const orders = [
  { id: 1042, customer: 'Ada Yılmaz', date: '2026-07-14', status: 'Processing', total: 1268.98,
    address: 'Home — Bağdat Cd. 120, Kadıköy, İstanbul', deliveryMethod: 'standard',
    items: [ { name: 'Minimalist Sofa', qty: 1, price: 703.99 }, { name: 'Velvet Accent Chair', qty: 1, price: 219.12 }, { name: 'Scandinavian Bookshelf', qty: 1, price: 320.00 } ] },
  { id: 1041, customer: 'Mert Demir', date: '2026-07-13', status: 'Shipped', total: 499.50,
    address: 'Office — Levent Mah. 45, Beşiktaş, İstanbul', deliveryMethod: 'express',
    items: [ { name: 'Oak Dining Table', qty: 1, price: 499.50 } ] },
  { id: 1040, customer: 'Elif Kaya', date: '2026-07-12', status: 'Delivered', total: 1099.99,
    address: 'Home — Alsancak Mah. 22, Konak, İzmir', deliveryMethod: 'standard',
    items: [ { name: 'Leather Recliner', qty: 1, price: 764.99 }, { name: 'Velvet Accent Chair', qty: 1, price: 335.00 } ] },
  { id: 1039, customer: 'Can Öztürk', date: '2026-07-11', status: 'Delivered', total: 320.00,
    items: [ { name: 'Scandinavian Bookshelf', qty: 1, price: 320.00 } ] },
  { id: 1038, customer: 'Zeynep Arslan', date: '2026-07-10', status: 'Cancelled', total: 249.00,
    items: [ { name: 'Velvet Accent Chair', qty: 1, price: 249.00 } ] },
  { id: 1037, customer: 'Deniz Şahin', date: '2026-07-09', status: 'Processing', total: 650.00,
    items: [ { name: 'Modern Platform Bed', qty: 1, price: 650.00 } ] },
];

export const newPhotoPool = [
  'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=400&auto=format&fit=crop',
];

const vendorData = { store, categories, products, orders, newPhotoPool };
export default vendorData;
