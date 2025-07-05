import axios from 'axios';
import Cookies from 'js-cookie';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function loadCart() {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  };
  const res = await axios.get(`${BASE_URL}/cart/loadcart`, config);
  return res.data;
}

export async function addToCart(item_id, quantity = 1) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken'),
    },
    withCredentials: true,
  };
  const body = { item_id, quantity };
  const res = await axios.post(`${BASE_URL}/cart/addtocart`, body, config);
  return res.data;
}

export async function removeFromCart(item_id) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken'),
    },
    data: { item_id },
    withCredentials: true,
  };
  const res = await axios.delete(`${BASE_URL}/cart/removefromcart`, config);
  return res.data;
}

export async function clearCart() {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken'),
    },
    withCredentials: true,
  };
  const res = await axios.post(`${BASE_URL}/cart/clearcart`, {}, config);
  return res.data;
}

export async function decreaseCartItemQuantity(item_id) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken'),
    },
    withCredentials: true,
  };
  const body = { item_id };
  const res = await axios.post(`${BASE_URL}/cart/decrease_quantity`, body, config);
  return res.data;
}

export async function setCart(cart_items) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': Cookies.get('csrftoken'),
    },
    withCredentials: true,
  };
  const body = { cart_items };
  const res = await axios.post(`${BASE_URL}/cart/setcart`, body, config);
  return res.data;
} 