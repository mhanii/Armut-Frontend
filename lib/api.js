import http from './http';
import { users, stores, products } from './data';

// --- MOCK USER DATABASE ---
let mockUser = {
    id: 1,
    name: "John Doe",
    email: "john.doe@example.com",
    addresses: [
        { id: 1, street: '123 Tech Avenue', apt: 'Suite 101', city: 'Silicon Valley', state: 'CA', zip: '94043' },
    ]
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