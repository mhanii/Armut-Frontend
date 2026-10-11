// Admin console manages EVERYTHING across the marketplace: all vendors, all their
// products, every order, and all customer accounts. (A single vendor only ever sees
// their own store — that's the separate vendor console.)
export const vendors = [
  { id: 1, store: 'Armut Modern Designs', manager: 'Selin Aydın', email: 'studio@armutmodern.com', city: 'İstanbul', joined: '2023-02-11', products: 6, sales: 3888.47, status: 'Active' },
  { id: 2, store: 'Bosphorus Woodworks', manager: 'Emre Çelik', email: 'hello@bosphoruswood.com', city: 'İstanbul', joined: '2023-08-04', products: 4, sales: 2140.00, status: 'Active' },
  { id: 3, store: 'Anatolia Home', manager: 'Derya Koç', email: 'sales@anatoliahome.com', city: 'İzmir', joined: '2024-05-19', products: 3, sales: 1290.50, status: 'Active' },
  { id: 4, store: 'Kilim & Co.', manager: 'Baran Yıldız', email: 'contact@kilimco.com', city: 'Ankara', joined: '2025-01-27', products: 2, sales: 0, status: 'Pending' },
  { id: 5, store: 'Loom Studio', manager: 'Naz Şen', email: 'naz@loomstudio.com', city: 'Bursa', joined: '2025-09-02', products: 1, sales: 320.00, status: 'Suspended' },
];

export const products = [
  { id: 1, name: 'Minimalist Sofa', vendor: 'Armut Modern Designs', category: 'Living Room', price: 799.99, stock: 24, status: 'Active',
    photo: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=400&auto=format&fit=crop' },
  { id: 2, name: 'Oak Dining Table', vendor: 'Armut Modern Designs', category: 'Dining', price: 499.50, stock: 8, status: 'Active',
    photo: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=400&auto=format&fit=crop' },
  { id: 3, name: 'Velvet Accent Chair', vendor: 'Bosphorus Woodworks', category: 'Living Room', price: 249.00, stock: 0, status: 'Out of stock',
    photo: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=400&auto=format&fit=crop' },
  { id: 4, name: 'Modern Platform Bed', vendor: 'Anatolia Home', category: 'Bedroom', price: 650.00, stock: 15, status: 'Active',
    photo: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=400&auto=format&fit=crop' },
  { id: 5, name: 'Scandinavian Bookshelf', vendor: 'Bosphorus Woodworks', category: 'Storage', price: 320.00, stock: 3, status: 'Flagged',
    photo: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=400&auto=format&fit=crop' },
  { id: 6, name: 'Leather Recliner', vendor: 'Armut Modern Designs', category: 'Living Room', price: 899.99, stock: 11, status: 'Active',
    photo: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=400&auto=format&fit=crop' },
  { id: 7, name: 'Handwoven Kilim Rug', vendor: 'Kilim & Co.', category: 'Living Room', price: 189.00, stock: 40, status: 'Pending review',
    photo: 'https://images.unsplash.com/photo-1600166898405-da9535204843?q=80&w=400&auto=format&fit=crop' },
];

export const orders = [
  { id: 1042, customer: 'Ada Yılmaz', vendor: 'Armut Modern Designs', date: '2026-07-14', status: 'Processing', total: 1268.98, items: 3 },
  { id: 1041, customer: 'Mert Demir', vendor: 'Armut Modern Designs', date: '2026-07-13', status: 'Shipped', total: 499.50, items: 1 },
  { id: 1040, customer: 'Elif Kaya', vendor: 'Bosphorus Woodworks', date: '2026-07-12', status: 'Delivered', total: 899.99, items: 2 },
  { id: 1039, customer: 'Can Öztürk', vendor: 'Anatolia Home', date: '2026-07-11', status: 'Delivered', total: 320.00, items: 1 },
  { id: 1038, customer: 'Zeynep Arslan', vendor: 'Bosphorus Woodworks', date: '2026-07-10', status: 'Cancelled', total: 249.00, items: 1 },
  { id: 1037, customer: 'Deniz Şahin', vendor: 'Anatolia Home', date: '2026-07-09', status: 'Processing', total: 650.00, items: 1 },
];

export const clients = [
  { id: 1, name: 'Ada Yılmaz', email: 'ada@example.com', joined: '2025-03-02', orders: 7, spent: 4210.50, status: 'VIP' },
  { id: 2, name: 'Mert Demir', email: 'mert@example.com', joined: '2025-06-18', orders: 3, spent: 1180.00, status: 'Active' },
  { id: 3, name: 'Elif Kaya', email: 'elif@example.com', joined: '2024-11-25', orders: 12, spent: 8930.75, status: 'VIP' },
  { id: 4, name: 'Can Öztürk', email: 'can@example.com', joined: '2026-01-09', orders: 1, spent: 320.00, status: 'Active' },
  { id: 5, name: 'Zeynep Arslan', email: 'zeynep@example.com', joined: '2026-04-30', orders: 2, spent: 540.00, status: 'Active' },
];

const adminData = { vendors, products, orders, clients };
export default adminData;
