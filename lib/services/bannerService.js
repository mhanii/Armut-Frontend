import { mockBanners } from '../data';
import http from '../http'; // Uncomment for backend

const USE_MOCK_DATA = false;

export async function getBanners() {
  if (USE_MOCK_DATA) {
    return mockBanners;
  } else {
    try {
      const response = await http('/api/banners');
      return response;
    } catch (err) {
      console.log('getBanners error:', err);
      return mockBanners;
    }
  }
} 