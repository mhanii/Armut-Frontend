'use client';

import React, { createContext } from 'react';

export const AppContext = createContext({
  user: null,
  setUser: () => {},
  isVendor: false,
  isCustomer: false,
  cartItems: [],
  cartItemCount: 0,
  toast: { show: false, message: '', type: 'note' },
  modal: { show: false, order: null },
  onAddToCart: () => {},
  onUpdateCartQuantity: () => {},
  onAuthSuccess: () => {},
  onLogout: () => {},
  onPlaceOrder: () => {},
  setModal: () => {},
  showToast: () => {},
}); 