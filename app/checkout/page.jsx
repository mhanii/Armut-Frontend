'use client';

import React, { useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import Link from 'next/link';
import { getUserAddresses } from '@/lib/services/userService';
import * as cartService from '@/lib/services/cartService';

const PlaceOrderPage = () => {
    const { user, cartItems, setCartItems, onPlaceOrder } = useContext(AppContext);
    const [deliveryMethod, setDeliveryMethod] = React.useState('standard');
    const [isPlacing, setIsPlacing] = React.useState(false);
    const router = useRouter();
    
    // Fetch addresses from backend
    const [addresses, setAddresses] = React.useState([]);
    const [selectedAddressId, setSelectedAddressId] = React.useState(null);

    useEffect(() => {
        if (user && user.token) {
            // Always load cart on page access
            cartService.loadCart().then(data => {
                setCartItems(data.cartItems || []);
            }).catch(() => setCartItems([]));
        }
    }, [user, setCartItems]);

    React.useEffect(() => {
        if (!user) {
            router.push('/login?from=checkout');
        } else if (cartItems.length === 0) {
            router.push('/cart');
        } else {
            // Fetch addresses from backend
            getUserAddresses(user.token).then(fetched => {
                setAddresses(fetched);
                if (fetched.length > 0) {
                    setSelectedAddressId(fetched[0].id);
                }
            });
        }
    }, [user, cartItems, router]);

    if (!user || cartItems.length === 0) {
        return <div className="text-center py-20">Loading...</div>;
    }

    const subtotal = cartItems.reduce((s, i) => s + (parseFloat(i.product.discountPrice) || parseFloat(i.product.price)) * i.quantity, 0);
    const getDeliveryOption = (product, method) => {
        const options = product.deliveryOptions || {};
        if (method === 'express') return options.express ?? 0;
        return options.standard ?? 0;
    };
    const deliveryCost = cartItems.reduce((s, i) => Math.max(s, getDeliveryOption(i.product, deliveryMethod)), 0);
    const total = subtotal + deliveryCost;
    
    const handleConfirm = async () => {
        if (!selectedAddressId) {
            alert("Please select a shipping address.");
            return;
        }
        setIsPlacing(true);
        const selectedAddress = addresses.find(a => a.id === selectedAddressId);
        await onPlaceOrder(deliveryMethod, selectedAddress);
    };

    return (
         <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Review Your Order</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                <div className="lg:col-span-2 bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Shipping Information</h3>
                    
                    {addresses.length > 0 ? (
                        <div className="space-y-3 sm:space-y-4">
                            {addresses.map(addr => (
                                <label key={addr.id} className={`flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                                    <input type="radio" name="address" value={addr.id} checked={selectedAddressId === addr.id} onChange={e => setSelectedAddressId(Number(e.target.value))} className="mr-3 sm:mr-4 w-4 h-4"/>
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium text-sm sm:text-base truncate">
                                            {['Country', addr.town, addr.area, addr.road, addr.building, addr.floor, addr.door_number].filter(Boolean).join(', ')}
                                        </p>
                                        <p className="text-gray-600 text-xs sm:text-sm">{addr.title}</p>
                                    </div>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-6 sm:p-8 border-2 border-dashed rounded-lg">
                            <p className="text-gray-600 mb-3 sm:mb-4 text-sm sm:text-base">You have no saved addresses.</p>
                            <Link href="/profile" className="bg-brand text-white font-bold py-2 px-3 sm:px-4 rounded-lg hover:bg-brand-dark text-sm sm:text-base">
                                Add an Address
                            </Link>
                        </div>
                    )}

                     <h3 className="text-lg sm:text-xl font-bold mt-6 sm:mt-8 mb-3 sm:mb-4">Delivery Method</h3>
                     <div className="space-y-2 sm:space-y-3">
                         <label className={`flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${deliveryMethod === 'standard' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                            <input type="radio" name="delivery" value="standard" checked={deliveryMethod === 'standard'} onChange={e => setDeliveryMethod(e.target.value)} className="mr-2 sm:mr-3 w-4 h-4"/>
                            <span className="text-sm sm:text-base">Standard Delivery - (approx. ${cartItems.reduce((s, i) => Math.max(s, getDeliveryOption(i.product, 'standard')), 0).toFixed(2)})</span>
                         </label>
                         <label className={`flex items-center p-3 sm:p-4 border rounded-lg cursor-pointer transition-all ${deliveryMethod === 'express' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}`}>
                             <input type="radio" name="delivery" value="express" checked={deliveryMethod === 'express'} onChange={e => setDeliveryMethod(e.target.value)} className="mr-2 sm:mr-3 w-4 h-4"/>
                             <span className="text-sm sm:text-base">Express Delivery - (approx. ${cartItems.reduce((s, i) => Math.max(s, getDeliveryOption(i.product, 'express')), 0).toFixed(2)})</span>
                         </label>
                     </div>
                </div>
                <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm h-fit">
                    <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Final Summary</h3>
                    <div className="space-y-1">
                        {cartItems.map(i => 
                            <div key={i.product.id} className="flex justify-between text-xs sm:text-sm">
                                <span className="w-3/4 truncate pr-2">{i.product.name} x{i.quantity}</span>
                                <span>${((parseFloat(i.product.discountPrice) || parseFloat(i.product.price)) * i.quantity).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                    <div className="border-t my-2 sm:my-3"></div>
                    <div className="flex justify-between text-sm sm:text-base"><span>Subtotal</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between text-gray-600 text-sm sm:text-base"><span>Delivery</span><span>${deliveryCost.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-lg sm:text-xl pt-2 sm:pt-3 border-t mt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
                    <button 
                        onClick={handleConfirm} 
                        disabled={isPlacing || cartItems.length === 0 || !selectedAddressId} 
                        className="w-full mt-4 sm:mt-6 bg-green-600 text-white font-bold py-2 sm:py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors text-sm sm:text-base"
                    >
                        {isPlacing ? 'Placing Order...' : 'Confirm & Pay'}
                    </button>
                </div>
            </div>
         </div>
    );
};

export default PlaceOrderPage; 