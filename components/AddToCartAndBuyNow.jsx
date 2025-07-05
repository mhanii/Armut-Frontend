"use client";
import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { CartIcon } from './ui/Icons';
import { FaCreditCard } from 'react-icons/fa';

const AddToCartAndBuyNow = ({ product }) => {
    const { onAddToCart } = useContext(AppContext);
    const router = useRouter();

    const handleAddToCart = () => {
        onAddToCart(product);
    };
    const handleBuyNow = () => {
        onAddToCart(product);
        router.push('/checkout');
    };

    return (
        <div className="flex flex-col gap-4 w-full">
            <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-900 font-bold py-3 rounded-lg hover:bg-gray-200 transition-colors text-lg border border-gray-300"
            >
                <CartIcon c="w-6 h-6" />
                Add to Cart
            </button>
            <button
                onClick={handleBuyNow}
                className="w-full flex items-center justify-center gap-2 bg-[#333] text-white font-bold py-3 rounded-lg hover:bg-black transition-colors text-lg"
            >
                <FaCreditCard className="w-6 h-6" />
                Buy Now
            </button>
        </div>
    );
};

export default AddToCartAndBuyNow; 