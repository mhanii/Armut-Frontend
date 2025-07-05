import http from './http';
import { users, stores, products, mockStores, mockProducts, mockOrders } from './data';

// --- MOCK USER DATABASE ---
let mockUser = {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    addresses: [
        { id: 1, street: '123 Tech Avenue', apt: 'Suite 101', city: 'Silicon Valley', state: 'CA', zip: '94043' },
    ]
};

// --- MOCK API OBJECT ---
export const api = {
    getStores: async () => {
        console.log('Mock API: getStores called');
        return mockStores;
    },
    
    getStoreById: async (id) => {
        console.log('Mock API: getStoreById called with id:', id);
        return mockStores.find(store => store.id === id) || mockStores[0];
    },
    
    getProducts: async (storeId) => {
        console.log('Mock API: getProducts called with storeId:', storeId);
        return mockProducts;
    },
    
    getOrderById: async (orderId, user) => {
        console.log('Mock API: getOrderById called with orderId:', orderId, 'user:', user);
        return mockOrders.find(order => order.orderId === parseInt(orderId)) || mockOrders[0];
    }
};

// --- MOCK HELPERS ---
export function getMockUserByEmail(email) {
  return users.find(u => u.email === email);
}

export function getMockProducts() {
  return products;
}

export function getMockCategories() {
  return categories;
}

export function getMockStores() {
  return stores;
} 