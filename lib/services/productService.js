import { products } from '../data';
import http from '../http';
import axios from 'axios';
import Cookies from 'js-cookie';

const USE_MOCK_DATA = false;
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function getProducts(params = {}) {
  if (USE_MOCK_DATA) {
    // Optionally filter products by params if needed
    return products;
  } else {
    try {
      const query = new URLSearchParams(params).toString();
      return await http(`/api/products${query ? `?${query}` : ''}`);
    } catch (err) {
      console.log('getProducts error:', err);
      return products;
    }
  }
}

export async function getProductById(id) {
  if (USE_MOCK_DATA) {
    return products.find(p => p.id === Number(id));
  } else {
    try {
      return await http(`/api/products/${id}`);
    } catch (err) {
      console.log('getProductById error:', err);
      return products.find(p => p.id === Number(id));
    }
  }
}

export async function getProductsForVendor(token = null) {
  if (USE_MOCK_DATA) {
    // For mock, vendorId is store id 1
    return products.filter(p => p.store === 1);
  } else {
    const config = {
      headers: {
        'Accept': 'application/json',
      },
      withCredentials: true
    };
    
    // Add authorization header if token is provided
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    try {
      const res = await axios.get(`${BASE_URL}/api/vendor/products/`, config);
      return res.data;
    } catch (err) {
      console.log('Error fetching vendor products:', err);
      return [];
    }
  }
}

export async function createProduct(token, productData) {
  const config = {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    withCredentials: true
  };
  
  // If productData is FormData, don't set Content-Type header
  // Let the browser set it automatically to multipart/form-data
  if (!(productData instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  try {
    const res = await axios.post(`${BASE_URL}/api/vendor/products/create/`, productData, config);
    return res.data;
  } catch (err) {
    console.log('createProduct error:', err);
    return null;
  }
}

export async function getDiscountProducts() {
  if (USE_MOCK_DATA) {
    // return products.filter(p => p.discount && p.discount > 0);
  } else {
    const response = await getProducts({ discount: true });
    const products = Array.isArray(response) ? response : (Array.isArray(response?.results) ? response.results : []);
    return products.filter(p => p.discount && p.discount > 0);
  }
}

export async function updateProduct(token, productId, productData) {
  const config = {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    withCredentials: true
  };
  
  // If productData is FormData, don't set Content-Type header
  // Let the browser set it automatically to multipart/form-data
  if (!(productData instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json';
  }
  
  try {
    const res = await axios.put(`${BASE_URL}/api/vendor/products/${productId}/`, productData, config);
    return res.data;
  } catch (err) {
    console.log('Error updating product:', err);
    return null;
  }
}

export async function deleteProduct(token, productId) {
  const config = {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`,
      'X-CSRFToken': Cookies.get('csrftoken')
    },
    withCredentials: true
  };
  
  try {
    const res = await axios.delete(`${BASE_URL}/api/vendor/products/${productId}/`, config);
    return res.data;
  } catch (err) {
    console.log('Error deleting product:', err);
    return null;
  }
}

export async function getFeaturedProducts() {
    return await getProducts(); // TODO: Implement featured products
} 