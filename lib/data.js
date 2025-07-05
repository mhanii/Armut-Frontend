export const mockProducts = [
    { 
        id: 1, name: "Minimalist Sofa", price: 799.99, discountPrice: 699.99, imageUrl: "https://images.unsplash.com/photo-1540574163024-5735f35c2250?q=80&w=1974&auto=format&fit=crop", 
        category: "Living Room", description: "A sleek and comfortable sofa with a minimalist design, perfect for modern living spaces. Upholstered in durable, soft-touch fabric.", 
        rating: 4.8,
        reviews: [
            { id: 1, author: "Jane D.", rating: 5, comment: "Absolutely love this sofa! It's stylish and surprisingly comfortable.", date: "2023-05-15" },
            { id: 2, author: "Mark T.", rating: 4, comment: "Great value for the price. The fabric is a bit lighter than pictured but still looks good.", date: "2023-04-22" },
        ],
        deliveryOptions: { standard: 50, express: 90 },
        customizationOptions: {
            colors: [ {name: 'Charcoal', hex: '#36454F'}, {name: 'Beige', hex: '#F5F5DC'}, {name: 'Navy Blue', hex: '#000080'} ]
        }
    },
    { 
        id: 2, name: "Oak Dining Table", price: 499.50, imageUrl: "https://images.unsplash.com/photo-1604074131657-3a1454e93849?q=80&w=2070&auto=format&fit=crop", 
        category: "Dining", description: "Solid oak dining table that comfortably seats six. Its natural wood grain brings warmth to any dining room.",
        rating: 4.9,
        reviews: [ { id: 3, author: "Emily R.", rating: 5, comment: "This table is stunning. Solid wood, easy to assemble, and looks timeless.", date: "2023-06-01"} ],
        deliveryOptions: { standard: 60, express: 110 },
        customizationOptions: null
    },
    { 
        id: 3, name: "Velvet Accent Chair", price: 249.00, discountPrice: 219.00, imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1964&auto=format&fit=crop", 
        category: "Living Room", description: "A luxurious velvet accent chair with gold-finished metal legs. A perfect statement piece for any room.",
        rating: 4.6,
        reviews: [],
        deliveryOptions: { standard: 25, express: 45 },
        customizationOptions: {
            colors: [ {name: 'Emerald Green', hex: '#50C878'}, {name: 'Blush Pink', hex: '#FFB6C1'}, {name: 'Royal Blue', hex: '#4169E1'} ]
        }
    },
    { 
        id: 4, name: "Modern Platform Bed", price: 650.00, imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=2070&auto=format&fit=crop", 
        category: "Bedroom", description: "Low-profile platform bed with an upholstered headboard. Creates a serene and contemporary bedroom environment.",
        rating: 4.7,
        reviews: [{id: 4, author: "Chris P.", rating: 5, comment: "So sturdy and looks amazing.", date: "2023-05-20"}],
        deliveryOptions: { standard: 70, express: 120 },
        customizationOptions: null
    },
    { 
        id: 5, name: "Scandinavian Bookshelf", price: 320.00, imageUrl: "https://images.unsplash.com/photo-1594894883903-5f50f2249547?q=80&w=1964&auto=format&fit=crop", 
        category: "Storage", description: "An open-back bookshelf with a clean, Scandinavian design. Ideal for displaying books and decorative items.",
        rating: 4.5,
        reviews: [],
        deliveryOptions: { standard: 40, express: 75 },
        customizationOptions: null
    },
    { 
        id: 6, name: "Industrial Floor Lamp", price: 180.00, imageUrl: "https://images.unsplash.com/photo-1507494954048-834c44276600?q=80&w=1974&auto=format&fit=crop",
        category: "Lighting", description: "A vintage-style floor lamp with an adjustable head and metal cage. Adds an industrial touch to any space.",
        rating: 4.7,
        reviews: [],
        deliveryOptions: { standard: 20, express: 40 },
        customizationOptions: null
    },
    {
        id: 7, name: "Plush Throw Blanket", price: 59.99, imageUrl: "https://images.unsplash.com/photo-1576402099999-651c8e1a1b1b?q=80&w=1974&auto=format&fit=crop",
        category: "Accessories", description: "An incredibly soft and cozy throw blanket, perfect for chilly evenings.",
        rating: 4.9,
        reviews: [],
        deliveryOptions: { standard: 10, express: 20 },
        customizationOptions: {
            colors: [ {name: 'Cream', hex: '#FFFDD0'}, {name: 'Grey', hex: '#808080'} ]
        }
    },
    { id: 8, name: "Modern Vanity Set", price: 450.00, createdAt: "2023-07-01", imageUrl: "https://images.unsplash.com/photo-1596701021434-3d96a6f19b2c?q=80&w=1974&auto=format&fit=crop", category: "Bedroom", description: "Sleek vanity set with a large mirror and matching stool.", rating: 4.8, reviews: [], deliveryOptions: { standard: 40, express: 80 }, customizationOptions: null },
    { id: 9, name: "Leather Recliner", price: 899.99, createdAt: "2023-07-02", imageUrl: "https://images.unsplash.com/photo-1578328358473-2d2a9d821a7a?q=80&w=1974&auto=format&fit=crop", category: "Living Room", description: "Premium leather recliner for maximum comfort.", rating: 4.9, reviews: [], deliveryOptions: { standard: 60, express: 120 }, customizationOptions: null },
    { id: 10, name: "Kitchen Island", price: 750.00, createdAt: "2023-07-03", imageUrl: "https://images.unsplash.com/photo-1600121848594-d8644e57abab?q=80&w=2070&auto=format&fit=crop", category: "Dining", description: "Butcher block kitchen island with built-in storage.", rating: 4.7, reviews: [], deliveryOptions: { standard: 80, express: 150 }, customizationOptions: null },
    { id: 11, name: "Entryway Bench", price: 220.00, createdAt: "2023-07-04", imageUrl: "https://images.unsplash.com/photo-1519968779709-a3b5a160d7ac?q=80&w=2070&auto=format&fit=crop", category: "Storage", description: "Stylish entryway bench with shoe storage underneath.", rating: 4.6, reviews: [], deliveryOptions: { standard: 30, express: 60 }, customizationOptions: null },
    { id: 12, name: "C-Shaped Side Table", price: 120.00, createdAt: "2023-07-05", imageUrl: "https://images.unsplash.com/photo-1543168257-414b404b89e7?q=80&w=1974&auto=format&fit=crop", category: "Living Room", description: "A convenient C-shaped table to slide under your sofa.", rating: 4.5, reviews: [], deliveryOptions: { standard: 15, express: 30 }, customizationOptions: null },
    { id: 13, name: "Wall-Mounted TV Stand", price: 300.00, createdAt: "2023-07-06", imageUrl: "https://images.unsplash.com/photo-1593359677879-a4a991879059?q=80&w=2070&auto=format&fit=crop", category: "Living Room", description: "Floating TV stand to save space and create a modern look.", rating: 4.7, reviews: [], deliveryOptions: { standard: 35, express: 70 }, customizationOptions: null },
    { id: 14, name: "Ergonomic Office Chair", price: 350.00, createdAt: "2023-07-07", imageUrl: "https://images.unsplash.com/photo-1580480055273-228ff5388ef8?q=80&w=1974&auto=format&fit=crop", category: "Office", description: "Ergonomic chair with lumbar support for long hours of work.", rating: 4.9, reviews: [], deliveryOptions: { standard: 40, express: 80 }, customizationOptions: null },
    { id: 15, name: "Round Coffee Table", price: 280.00, createdAt: "2023-07-08", imageUrl: "https://images.unsplash.com/photo-1611269154421-4e7e6addca28?q=80&w=1964&auto=format&fit=crop", category: "Living Room", description: "A beautiful round coffee table with a marble top.", rating: 4.8, reviews: [], deliveryOptions: { standard: 30, express: 60 }, customizationOptions: null },
    { id: 16, name: "Bar Stool Set", price: 190.00, createdAt: "2023-07-09", imageUrl: "https://images.unsplash.com/photo-1503602642458-232111445657?q=80&w=1974&auto=format&fit=crop", category: "Dining", description: "Set of two modern bar stools.", rating: 4.6, reviews: [], deliveryOptions: { standard: 25, express: 50 }, customizationOptions: null },
    { id: 17, name: "Patio Dining Set", price: 950.00, createdAt: "2023-07-10", imageUrl: "https://images.unsplash.com/photo-1567990522430-c632488686b2?q=80&w=2070&auto=format&fit=crop", category: "Outdoor", description: "7-piece outdoor dining set for your patio or garden.", rating: 4.7, reviews: [], deliveryOptions: { standard: 100, express: 200 }, customizationOptions: null },
    { id: 18, name: "Full-Length Mirror", price: 150.00, createdAt: "2023-07-11", imageUrl: "https://images.unsplash.com/photo-1598421223962-658b148e6a9f?q=80&w=1974&auto=format&fit=crop", category: "Bedroom", description: "A stylish full-length mirror with a thin metal frame.", rating: 4.8, reviews: [], deliveryOptions: { standard: 20, express: 40 }, customizationOptions: null },
    { id: 19, name: "Nightstand with Drawer", price: 130.00, createdAt: "2023-07-12", imageUrl: "https://images.unsplash.com/photo-1594342442967-04c8a58a6e42?q=80&w=1974&auto=format&fit=crop", category: "Bedroom", description: "A simple and elegant nightstand with a single drawer.", rating: 4.5, reviews: [], deliveryOptions: { standard: 15, express: 30 }, customizationOptions: null },
    { id: 20, name: "Area Rug", price: 250.00, createdAt: "2023-07-13", imageUrl: "https://images.unsplash.com/photo-1575445244199-2856a394a1d4?q=80&w=1974&auto=format&fit=crop", category: "Accessories", description: "A soft, plush area rug to tie your room together.", rating: 4.7, reviews: [], deliveryOptions: { standard: 30, express: 60 }, customizationOptions: null },
    { id: 21, name: "Desk Lamp", price: 75.00, createdAt: "2023-07-14", imageUrl: "https://images.unsplash.com/photo-1507427845209-a03585a05b1c?q=80&w=2070&auto=format&fit=crop", category: "Lighting", description: "A modern LED desk lamp with adjustable brightness.", rating: 4.9, reviews: [], deliveryOptions: { standard: 10, express: 20 }, customizationOptions: null },
    { id: 22, name: "Floating Shelves", price: 90.00, createdAt: "2023-07-15", imageUrl: "https://images.unsplash.com/photo-1596205244383-37b3b443c2c4?q=80&w=1974&auto=format&fit=crop", category: "Storage", description: "Set of three floating shelves for a minimalist display.", rating: 4.6, reviews: [], deliveryOptions: { standard: 15, express: 30 }, customizationOptions: null },
    { id: 23, name: "Outdoor Lounge Chair", price: 320.00, createdAt: "2023-07-16", imageUrl: "https://images.unsplash.com/photo-1549488344-cbb6c144e207?q=80&w=1974&auto=format&fit=crop", category: "Outdoor", description: "A comfortable lounge chair for your poolside or patio.", rating: 4.8, reviews: [], deliveryOptions: { standard: 35, express: 70 }, customizationOptions: null },
    { id: 24, name: "Computer Desk", price: 400.00, createdAt: "2023-07-17", imageUrl: "https://images.unsplash.com/photo-1611218849090-94a6283b8b60?q=80&w=2070&auto=format&fit=crop", category: "Office", description: "A spacious computer desk with a built-in monitor stand.", rating: 4.7, reviews: [], deliveryOptions: { standard: 50, express: 100 }, customizationOptions: null },
    { id: 25, name: "Wardrobe", price: 1200.00, createdAt: "2023-07-18", imageUrl: "https://images.unsplash.com/photo-1631049035519-3cf45330368a?q=80&w=1974&auto=format&fit=crop", category: "Bedroom", description: "A large wardrobe with ample storage for all your clothes.", rating: 4.9, reviews: [], deliveryOptions: { standard: 150, express: 300 }, customizationOptions: null },
    { id: 26, name: "Picture Frame Set", price: 60.00, createdAt: "2023-07-19", imageUrl: "https://images.unsplash.com/photo-1506784333989-b42f61a1be7a?q=80&w=2070&auto=format&fit=crop", category: "Accessories", description: "A set of 10 gallery wall picture frames.", rating: 4.5, reviews: [], deliveryOptions: { standard: 10, express: 20 }, customizationOptions: null },
    { id: 27, name: "Bookshelf with Ladder", price: 850.00, createdAt: "2023-07-20", imageUrl: "https://images.unsplash.com/photo-1594445362483-20708d277a83?q=80&w=1974&auto=format&fit=crop", category: "Storage", description: "A grand bookshelf that comes with a rolling ladder.", rating: 4.9, reviews: [], deliveryOptions: { standard: 100, express: 200 }, customizationOptions: null }
];
export const mockStores = [
    { id: 1, name: "Armut Downtown", address: "123 Design Lane, Metropolis, 10001", hours: "10am - 8pm", phone: "(212) 555-0123", rating: 4.8, imageUrl: 'https://images.unsplash.com/photo-1556742111-a301076d9d18?q=80&w=2070&auto=format&fit=crop', productIds: [1, 2, 3] },
    { id: 2, name: "Armut Suburbia", address: "456 Comfort Ct, Pleasantville, 20002", hours: "10am - 9pm", phone: "(303) 555-0456", rating: 4.5, imageUrl: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1916&auto=format&fit=crop', productIds: [2, 4, 5] },
    { id: 3, name: "Armut The Heights", address: "789 Style St, Hill Valley, 30003", hours: "11am - 7pm", phone: "(415) 555-0789", rating: 4.9, imageUrl: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=2070&auto=format&fit=crop', productIds: [1, 3, 4, 5, 6, 7] },
];
export const mockBanners = [
    { id: 1, title: "Design Your Comfort Zone", subtitle: "Discover furniture that's made for you.", imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=2070&auto=format&fit=crop' },
    { id: 2, title: "Summer Sale Event", subtitle: "Up to 30% off on select items.", imageUrl: 'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?q=80&w=2070&auto=format&fit=crop' },
    { id: 3, title: "New Bedroom Collection", subtitle: "Create your personal sanctuary.", imageUrl: 'https://images.unsplash.com/photo-1567016526105-22b62b9f1ba3?q=80&w=1974&auto=format&fit=crop' },
];
export let mockOrders = [
  {
    orderId: 1001,
    customerId: 2,
    status: 'Processing',
    date: '2024-06-01T10:00:00Z',
    items: [
      {
        product: {
          id: 1,
          name: 'Minimalist Sofa',
          price: 799.99,
          discountPrice: 699.99,
          imageUrl: 'https://images.unsplash.com/photo-1540574163024-5735f35c2250?q=80&w=1974&auto=format&fit=crop',
        },
        quantity: 1
      },
      {
        product: {
          id: 3,
          name: 'Velvet Accent Chair',
          price: 249.00,
          discountPrice: 219.00,
          imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1964&auto=format&fit=crop',
        },
        quantity: 2
      }
    ],
    shippingAddress: {
      street: '123 Tech Avenue',
      apt: 'Suite 101',
      city: 'Silicon Valley',
      state: 'CA',
      zip: '94043'
    },
    subtotal: 799.99 + 2 * 249.00,
    deliveryCost: 50,
    total: 799.99 + 2 * 249.00 + 50
  },
  {
    orderId: 1002,
    customerId: 2,
    status: 'Delivered',
    date: '2024-05-20T15:30:00Z',
    items: [
      {
        product: {
          id: 5,
          name: 'Scandinavian Bookshelf',
          price: 320.00,
          imageUrl: 'https://images.unsplash.com/photo-1594894883903-5f50f2249547?q=80&w=1964&auto=format&fit=crop',
        },
        quantity: 1
      }
    ],
    shippingAddress: {
      street: '456 Oak Ave',
      apt: 'Apt 2B',
      city: 'Townsville',
      state: 'TX',
      zip: '75001'
    },
    subtotal: 320.00,
    deliveryCost: 40,
    total: 360.00
  }
];

// Mock Users
export const users = [
  {
    id: 1,
    name: "Modern Designs Inc.",
    email: "vendor@armut.com",
    password: "password",
    user_type: "vendor"
  },
  {
    id: 2,
    name: "Alice Johnson",
    email: "alice@armut.com",
    password: "password",
    user_type: "customer"
  }
];

// Mock Categories
export const mockCategories = [
  { id: 1, name: "Living Room" },
  { id: 2, name: "Bedroom" },
  { id: 3, name: "Dining" },
  { id: 4, name: "Storage" }
];

// Mock Stores
export const stores = [
  {
    id: 1,
    name: "Armut Modern Designs",
    owner: 1, // vendor id
    description: "A modern furniture store.",
    address: "123 Main St, Cityville"
  },
  {
    id: 2,
    name: "Armut Cozy Home",
    owner: 3, // another vendor id (optional)
    description: "Cozy and affordable furniture.",
    address: "456 Oak Ave, Townsville"
  }
];

// Mock Products
export const products = [
  {
    id: 1,
    name: "Minimalist Sofa",
    price: 799.99,
    discount: 12,
    category: 1, // Living Room
    store: 1,
    stock: 25,
    description: "A sleek and comfortable sofa with a minimalist design.",
    imageUrl: "https://images.unsplash.com/photo-1540574163024-5735f35c2250?q=80&w=1974&auto=format&fit=crop",
    rating: 4.8,
    reviews: [
      { author: "Jane D.", rating: 5, comment: "Love it!" }
    ]
  },
  {
    id: 2,
    name: "Velvet Accent Chair",
    price: 249.00,
    discount: 12,
    category: 1, // Living Room
    store: 1,
    stock: 40,
    description: "A luxurious velvet accent chair with gold-finished metal legs.",
    imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=1964&auto=format&fit=crop",
    rating: 4.6,
    reviews: []
  },
  {
    id: 3,
    name: "Wooden Dining Table",
    price: 599.00,
    discount: 0,
    category: 3, // Dining
    store: 1,
    stock: 10,
    description: "A solid wood dining table for family gatherings.",
    imageUrl: "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?q=80&w=2070&auto=format&fit=crop",
    rating: 4.7,
    reviews: []
  }
]; 