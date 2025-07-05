"use client";

import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { CartIcon } from '@/components/ui/Icons';

const AddToCartButton = ({ product }) => {
  const { onAddToCart } = useContext(AppContext);
  return (
    <button
      onClick={e => {
        e.preventDefault();
        e.stopPropagation();
        onAddToCart(product);
      }}
      className="bg-brand text-white p-3 rounded-full shadow-lg hover:bg-brand-dark"
    >
      <CartIcon c="w-5 h-5" />
    </button>
  );
};

export default AddToCartButton; 