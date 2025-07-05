'use client';

import React, { useContext, useState, useEffect } from 'react';
import Link from 'next/link';
import { AppContext } from '@/context/AppContext';
import { CartIcon, UserIcon } from '@/components/ui/Icons';
import { useRouter } from 'next/navigation';
import * as cartService from '@/lib/services/cartService';
import ClientOnly from '@/components/ui/ClientOnly';

const Header = () => {
    const { cartItemCount, user, isVendor, isCustomer, onLogout, setCartItems } = useContext(AppContext);
    const [userLoading, setUserLoading] = React.useState(true);
    const [cartLoading, setCartLoading] = React.useState(true);
    const [mounted, setMounted] = React.useState(false);
    const router = useRouter();
    const [mobileNavOpen, setMobileNavOpen] = useState(false);

    // Ensure component is mounted before rendering dynamic content
    useEffect(() => {
        setMounted(true);
    }, []);

    // Load cart on page reload
    useEffect(() => {
        if (user) {
            setCartLoading(true);
            cartService.loadCart().then(data => {
                setCartItems(data.cartItems || []);
                setCartLoading(false);
            }).catch(() => {
                setCartItems([]);
                setCartLoading(false);
            });
        } else {
            setCartLoading(false);
        }
    }, [user, setCartItems]);

    React.useEffect(() => {
        if (!mounted) return;
        
        // Wait for user state to be determined (simulate async check)
        // If user is null and localStorage has 'authenticated' true, wait for effect in AppProvider
        // Otherwise, set loading to false immediately
        const auth = window.localStorage.getItem('authenticated');
        if (auth === 'true' && !user) {
            // Wait for AppProvider to update user
            const interval = setInterval(() => {
                if (user) {
                    setUserLoading(false);
                    clearInterval(interval);
                }
            }, 50);
            return () => clearInterval(interval);
        } else {
            setUserLoading(false);
        }
    }, [user, mounted]);

    const handleNavigate = (path) => {
        router.push(path);
    };

    // Show loading skeleton until mounted to prevent hydration mismatch
    if (!mounted) {
        return (
            <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b">
                <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                    <Link href="/" className="text-xl sm:text-2xl font-bold">
                        Armut
                    </Link>
                    <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-base lg:text-lg">
                        {[...Array(3)].map((_, i) => (
                            <span key={i} className="w-20 h-6 rounded bg-gray-200 animate-glow-opacity" />
                        ))}
                    </nav>
                    <div className="flex items-center space-x-4 sm:space-x-6">
                        <div className="flex items-center">
                            <UserIcon c="w-6 h-6" />
                            <span className="ml-2 hidden sm:inline w-20 h-8 rounded bg-gray-200 animate-glow-opacity" />
                        </div>
                        <div className="relative">
                            <CartIcon c="w-6 h-6" />
                            <span className="absolute -top-2 -right-2 bg-gray-300 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            </span>
                        </div>
                        <button className="md:hidden flex flex-col justify-center items-center w-10 h-10 bg-gray-100 rounded-lg">
                            <span className="block w-5 h-0.5 bg-gray-800 rounded mb-1" />
                            <span className="block w-5 h-0.5 bg-gray-800 rounded mb-1" />
                            <span className="block w-5 h-0.5 bg-gray-800 rounded" />
                        </button>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b">
            <div className="container mx-auto px-4 sm:px-6 py-3 flex justify-between items-center">
                <Link href="/" className="text-xl sm:text-2xl font-bold">
                    Armut
                </Link>
                {/* Desktop nav */}
                <nav className="hidden md:flex items-center space-x-6 lg:space-x-8 text-base lg:text-lg">
                    {userLoading ? (
                        <>
                            {[...Array(isVendor ? 4 : 3)].map((_, i) => (
                                <span key={i} className="w-20 h-6 rounded bg-gray-200 animate-glow-opacity" />
                            ))}
                        </>
                    ) : isVendor ? (
                        <>
                            <Link href="/vendor">Dashboard</Link>
                            <Link href="/vendor/products">Products</Link>
                            <Link href="/vendor/orders">Orders</Link>
                            <Link href="/vendor/store">Store</Link>
                        </>
                    ) : (
                        <>
                            <Link href="/">Home</Link>
                            <Link href="/products">Products</Link>
                            <Link href="/stores">Stores</Link>
                        </>
                    )}
                </nav>
                <div className="flex items-center space-x-4 sm:space-x-6">
                    {userLoading ? (
                        <div className="flex items-center">
                            <UserIcon c="w-6 h-6" />
                            <span className="ml-2 hidden sm:inline w-20 h-8 rounded bg-gray-200 animate-glow-opacity" />
                        </div>
                    ) : user ? (
                        <div className="relative group">
                             <button onClick={() => handleNavigate('/profile')} className="flex items-center text-base sm:text-lg">
                                <UserIcon c="w-6 h-6" />
                                <span className="ml-2 hidden sm:inline">Hi, {user.first_name || user.name || user.email}</span>
                            </button>
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded shadow py-1 z-50 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-gray-100">Profile</Link>
                                <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); }} className="block px-4 py-2 text-sm hover:bg-gray-100">Logout</a>
                            </div>
                        </div>
                    ) : (
                        <Link href="/login" className="text-base sm:text-lg">Login</Link>
                    )}
                    <Link href="/cart" className="relative cursor-pointer">
                        <CartIcon c="w-6 h-6" />
                        {cartLoading ? (
                            <span className="absolute -top-2 -right-2 bg-gray-300 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                            </span>
                        ) : cartItemCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-brand text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                {cartItemCount}
                            </span>
                        )}
                    </Link>
                    {/* Hamburger for mobile */}
                    <button
                        className="md:hidden flex flex-col justify-center items-center w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand"
                        aria-label="Open navigation menu"
                        onClick={() => setMobileNavOpen(true)}
                    >
                        <span className={`block w-5 h-0.5 bg-gray-800 rounded transition-all duration-200 ${mobileNavOpen ? 'opacity-0' : 'mb-1'}`} />
                        <span className={`block w-5 h-0.5 bg-gray-800 rounded transition-all duration-200 mb-1`} />
                        <span className={`block w-5 h-0.5 bg-gray-800 rounded transition-all duration-200 ${mobileNavOpen ? 'opacity-0' : ''}`} />
                    </button>
                </div>
                {/* Mobile nav drawer */}
                {mobileNavOpen && (
                    <div className="fixed inset-0 z-50 flex md:hidden">
                        {/* Overlay: make it solid white with some opacity for dimming */}
                        <div className="fixed inset-0 bg-black bg-opacity-60" onClick={() => setMobileNavOpen(false)} />
                        {/* Drawer: make sure it covers the full height and is solid white */}
                        <div className="relative bg-white w-80 max-w-full h-full shadow-xl p-6 z-50 flex flex-col" style={{ minHeight: '100vh' }}>
                            <div className="flex justify-between items-center mb-6">
                                <span className="text-xl font-bold">Menu</span>
                                <button
                                    onClick={() => setMobileNavOpen(false)}
                                    className="text-gray-500 hover:text-gray-900 text-2xl font-bold transition-colors duration-200"
                                    aria-label="Close menu"
                                >
                                    &times;
                                </button>
                            </div>
                            <nav className="flex flex-col gap-4 text-lg">
                                {userLoading ? (
                                    [...Array(isVendor ? 4 : 3)].map((_, i) => (
                                        <span key={i} className="w-20 h-6 rounded bg-gray-200 animate-glow-opacity" />
                                    ))
                                ) : isVendor ? (
                                    <>
                                        <Link href="/vendor" onClick={() => setMobileNavOpen(false)} className="py-2 hover:text-brand transition-colors duration-200">Dashboard</Link>
                                        <Link href="/vendor/products" onClick={() => setMobileNavOpen(false)} className="py-2 hover:text-brand transition-colors duration-200">Products</Link>
                                        <Link href="/vendor/orders" onClick={() => setMobileNavOpen(false)} className="py-2 hover:text-brand transition-colors duration-200">Orders</Link>
                                        <Link href="/vendor/store" onClick={() => setMobileNavOpen(false)} className="py-2 hover:text-brand transition-colors duration-200">Store</Link>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/" onClick={() => setMobileNavOpen(false)} className="py-2 hover:text-brand transition-colors duration-200">Home</Link>
                                        <Link href="/products" onClick={() => setMobileNavOpen(false)} className="py-2 hover:text-brand transition-colors duration-200">Products</Link>
                                        <Link href="/stores" onClick={() => setMobileNavOpen(false)} className="py-2 hover:text-brand transition-colors duration-200">Stores</Link>
                                    </>
                                )}
                                <hr className="my-2" />
                                {user ? (
                                    <>
                                        <Link href="/profile" onClick={() => setMobileNavOpen(false)} className="py-2 hover:text-brand transition-colors duration-200">Profile</Link>
                                        <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setMobileNavOpen(false); }} className="py-2 hover:text-brand transition-colors duration-200">Logout</a>
                                    </>
                                ) : (
                                    <Link href="/login" onClick={() => setMobileNavOpen(false)} className="py-2 hover:text-brand transition-colors duration-200">Login</Link>
                                )}
                                <Link href="/cart" onClick={() => setMobileNavOpen(false)} className="flex items-center gap-2 py-2 hover:text-brand transition-colors duration-200">
                                    <CartIcon c="w-5 h-5" />
                                    Cart{cartLoading ? (
                                        <span className="ml-1 bg-gray-300 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                            <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                                        </span>
                                    ) : cartItemCount > 0 && (
                                        <span className="ml-1 bg-brand text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">{cartItemCount}</span>
                                    )}
                                </Link>
                            </nav>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header; 