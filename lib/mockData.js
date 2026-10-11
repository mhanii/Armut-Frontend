// Storefront catalog fixtures — the reference shape for GET /api/v1/catalog.
// Imagery is hot-linked from Unsplash; replace with owned CDN images for production.
export const banners = [
  { title: 'Design Your Comfort Zone', subtitle: 'Furniture handcrafted in Türkiye, made for the way you live.', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1600&auto=format&fit=crop' },
  { title: 'The Warm Minimal Home', subtitle: 'Solid hardwood pieces, delivered and assembled across the city.', image: 'https://images.unsplash.com/photo-1609081144289-eacc3108cd03?q=80&w=1600&auto=format&fit=crop' },
  { title: 'New Bedroom Collection', subtitle: 'Create your personal sanctuary with our latest arrivals.', image: 'https://images.unsplash.com/photo-1699869653495-fe26f4c70b3e?q=80&w=1600&auto=format&fit=crop' },
];

export const categories = [
  { name: 'Living Room', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop' },
  { name: 'Bedroom', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800&auto=format&fit=crop' },
  { name: 'Dining', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=800&auto=format&fit=crop' },
  { name: 'Storage', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop' },
];

export const products = [
  { id: 1, name: 'Minimalist Sofa', vendor: 'Armut Modern Designs', price: 799.99, discount: 12, rating: 4.8, stock: 24, reviewCount: 24, category: 'Living Room', image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=800&auto=format&fit=crop', description: 'A sleek, comfortable sofa with a minimalist frame, upholstered in durable soft-touch fabric.' },
  { id: 2, name: 'Oak Dining Table', vendor: 'Armut Modern Designs', price: 499.50, discount: 0, rating: 4.9, stock: 8, reviewCount: 18, category: 'Dining', image: 'https://images.unsplash.com/photo-1617806118233-18e1de247200?q=80&w=800&auto=format&fit=crop', description: 'Solid oak dining table that comfortably seats six, with a warm natural grain.' },
  { id: 3, name: 'Velvet Accent Chair', vendor: 'Bosphorus Woodworks', price: 249.00, discount: 12, rating: 4.6, stock: 0, reviewCount: 11, category: 'Living Room', image: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=800&auto=format&fit=crop', description: 'A luxurious velvet accent chair with brushed-brass legs. A perfect statement piece.' },
  { id: 4, name: 'Modern Platform Bed', vendor: 'Anatolia Home', price: 650.00, discount: 0, rating: 4.7, stock: 15, reviewCount: 32, category: 'Bedroom', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800&auto=format&fit=crop', description: 'Low-profile platform bed with an upholstered headboard for a serene bedroom.' },
  { id: 5, name: 'Scandinavian Bookshelf', vendor: 'Bosphorus Woodworks', price: 320.00, discount: 0, rating: 4.5, stock: 3, reviewCount: 9, category: 'Storage', image: 'https://images.unsplash.com/photo-1605116959031-6e2d13a2ee56?q=80&w=800&auto=format&fit=crop', description: 'An open-back bookshelf with clean lines, ideal for books and objects.' },
  { id: 6, name: 'Leather Recliner', vendor: 'Armut Modern Designs', price: 899.99, discount: 15, rating: 4.9, stock: 11, reviewCount: 41, category: 'Living Room', image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop', description: 'Full-grain leather recliner with a hand-finished timber base for lasting comfort.' },
  { id: 7, name: 'Round Coffee Table', vendor: 'Armut Modern Designs', price: 280.00, discount: 0, rating: 4.8, stock: 9, reviewCount: 15, category: 'Living Room', image: 'https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=800&auto=format&fit=crop', description: 'A round coffee table with a honed marble top and slim metal frame.' },
  { id: 8, name: 'Oak Nightstand', vendor: 'Anatolia Home', price: 130.00, discount: 0, rating: 4.5, stock: 20, reviewCount: 7, category: 'Bedroom', image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=800&auto=format&fit=crop', description: 'A simple, elegant nightstand with a soft-close drawer.' },
  { id: 9, name: 'Full-Length Mirror', vendor: 'Anatolia Home', price: 150.00, discount: 10, rating: 4.8, stock: 12, reviewCount: 20, category: 'Bedroom', image: 'https://images.unsplash.com/photo-1618220179428-22790b461013?q=80&w=800&auto=format&fit=crop', description: 'A full-length mirror with a thin, warm-toned metal frame.' },
  { id: 10, name: 'Kitchen Island', vendor: 'Bosphorus Woodworks', price: 750.00, discount: 0, rating: 4.7, stock: 6, reviewCount: 13, category: 'Dining', image: 'https://images.unsplash.com/photo-1600585152220-90363fe7e115?q=80&w=800&auto=format&fit=crop', description: 'Butcher-block kitchen island with generous built-in storage.' },
  { id: 11, name: 'Bar Stool Set', vendor: 'Bosphorus Woodworks', price: 190.00, discount: 0, rating: 4.6, stock: 18, reviewCount: 8, category: 'Dining', image: 'https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=800&auto=format&fit=crop', description: 'A set of two modern bar stools with solid-wood seats.' },
  { id: 12, name: 'Entryway Bench', vendor: 'Kilim & Co.', price: 220.00, discount: 0, rating: 4.6, stock: 7, reviewCount: 6, category: 'Storage', image: 'https://images.unsplash.com/photo-1757419095875-d50e9d48b574?q=80&w=800&auto=format&fit=crop', description: 'A stylish entryway bench with woven shoe storage beneath.' },
  { id: 13, name: 'Floating Shelves', vendor: 'Kilim & Co.', price: 90.00, discount: 0, rating: 4.6, stock: 30, reviewCount: 22, category: 'Storage', image: 'https://images.unsplash.com/photo-1588111948296-83a8e036e004?q=80&w=800&auto=format&fit=crop', description: 'A set of three floating shelves for a minimalist display.' },
  { id: 14, name: 'Upholstered Wardrobe', vendor: 'Anatolia Home', price: 1200.00, discount: 8, rating: 4.9, stock: 4, reviewCount: 17, category: 'Bedroom', image: 'https://images.unsplash.com/photo-1672137233327-37b0c1049e77?q=80&w=800&auto=format&fit=crop', description: 'A large wardrobe with soft-close doors and ample storage.' },
  { id: 15, name: 'Slat Lounge Chair', vendor: 'Armut Modern Designs', price: 340.00, discount: 0, rating: 4.7, stock: 10, reviewCount: 10, category: 'Living Room', image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=800&auto=format&fit=crop', description: 'A slatted hardwood lounge chair with a linen cushion.' },
  { id: 16, name: 'Extendable Dining Set', vendor: 'Bosphorus Woodworks', price: 980.00, discount: 12, rating: 4.8, stock: 6, reviewCount: 14, category: 'Dining', image: 'https://images.unsplash.com/photo-1758977404038-8aa1845d6635?q=80&w=800&auto=format&fit=crop', description: 'An extendable dining table with six matching upholstered chairs.' },
];

const mockData = { banners, categories, products };
export default mockData;
