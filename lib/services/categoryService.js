import http from '../http';
import { mockCategories } from '../data';

const USE_MOCK_DATA = false;

export async function getCategories() {
  if (USE_MOCK_DATA) {
    return mockCategories;
  } else {
    return await http('/api/categories');
  }
} 