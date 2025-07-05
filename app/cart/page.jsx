'use client';

import React, { useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import Link from 'next/link';
import { PlusIcon, MinusIcon, TrashIcon } from '@/components/ui/Icons';
import { useRouter } from 'next/navigation';
import CustomImage from '@/components/ui/CustomImage';

const CartPage = () => {
    const { cartItems, onUpdateCartQuantity, onAddToCart, user, setCartItems } = useContext(AppContext);
    const router = useRouter();

    const subtotal = cartItems.reduce((s, i) => s + (parseFloat(i.product.discountPrice) || parseFloat(i.product.price)) * i.quantity, 0);

    useEffect(() => {
        if (user) {
            // Always load cart on page access
            import('@/lib/services/cartService').then(cartService => {
                cartService.loadCart().then(data => {
                    setCartItems(data.cartItems || []);
                }).catch(() => setCartItems([]));
            });
        }
    }, [user, setCartItems]);

    const handleCheckout = () => {
        if (user) {
            router.push('/checkout');
        } else {
            router.push('/login?from=cart');
        }
    };

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Your Cart</h2>
            {cartItems.length === 0 ? (
                <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm">
                    <p className="text-base sm:text-lg text-gray-500">Your cart is empty.</p>
                    <Link href="/products" className="bg-[#333] text-white font-bold py-2 px-4 sm:px-6 rounded-lg mt-4 inline-block hover:bg-black transition-colors text-sm sm:text-base">
                        Continue Shopping
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                    <div className="lg:col-span-2 bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                        {cartItems.map(({ product, quantity, selectedCustomization }) => (
                            <div key={`${product.id}-${selectedCustomization?.color?.name}`} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 sm:py-4 border-b last:border-b-0 gap-3 sm:gap-4">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 relative flex-shrink-0">
                                        <CustomImage src={product.imageUrl} alt={product.name} fill style={{objectFit:"cover"}} className="rounded" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-semibold text-sm sm:text-base truncate">{product.name}</h3>
                                        {selectedCustomization?.color && <p className="text-xs sm:text-sm text-gray-500">Color: {selectedCustomization.color.name}</p>}
                                        <p className="text-xs sm:text-sm text-gray-800">${(parseFloat(product.discountPrice) || parseFloat(product.price)).toFixed(2)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 sm:gap-4">
                                    <div className="flex border rounded">
                                        <button onClick={() => onUpdateCartQuantity(product.id, quantity - 1)} className="p-1 sm:p-2 hover:bg-gray-100 transition-colors"><MinusIcon c="w-3 h-3 sm:w-4 sm:h-4" /></button>
                                        <span className="px-2 sm:px-4 py-1 text-xs sm:text-sm">{quantity}</span>
                                        <button onClick={() => onUpdateCartQuantity(product.id, quantity + 1)} className="p-1 sm:p-2 hover:bg-gray-100 transition-colors"><PlusIcon c="w-3 h-3 sm:w-4 sm:h-4" /></button>
                                    </div>
                                    <p className="w-16 sm:w-20 text-right font-semibold text-xs sm:text-sm">${((parseFloat(product.discountPrice) || parseFloat(product.price)) * quantity).toFixed(2)}</p>
                                    <button onClick={() => onUpdateCartQuantity(product.id, 0)} className="text-red-500 hover:text-red-700 transition-colors"><TrashIcon c="w-4 h-4 sm:w-5 sm:h-5" /></button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm h-fit">
                        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Order Summary</h3>
                        <div className="flex justify-between mt-3 sm:mt-4">
                            <span className="text-sm sm:text-base">Subtotal</span>
                            <span className="font-semibold text-sm sm:text-base">${subtotal.toFixed(2)}</span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-500 mt-2">Shipping and taxes calculated at checkout.</p>
                        <button 
                            onClick={handleCheckout} 
                            className="w-full mt-4 sm:mt-6 bg-[#333] text-white font-bold py-2 sm:py-3 rounded-lg hover:bg-black transition-colors disabled:bg-gray-400 text-sm sm:text-base"
                        >
                            {user ? 'Proceed to Checkout' : 'Login to Checkout'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CartPage; 