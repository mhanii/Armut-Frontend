import http from '../http';
import { mockCategories } from '../data';

const USE_MOCK_DATA = false;

export async function getCategories() {
  if (USE_MOCK_DATA) {
    return mockCategories;
  } else {
    try {
      return await http('/api/categories');
    } catch (err) {
      console.log('getCategories error:', err);
      return mockCategories;
    }
  }
} 