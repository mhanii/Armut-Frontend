'use client';

import React from 'react';
import { AppContext } from './AppContext';
// import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import useLocalStorageState from '@/hooks/useLocalStorageState';
import * as cartService from '@/lib/services/cartService';
import { logout as backendLogout, createOrderFromCart } from '@/lib/services/userService';
import Cookies from 'js-cookie';
// import { getProfile } from '@/lib/services/userService';

export const AppProvider = ({ children }) => {
    const [cartItems, setCartItems] = React.useState([]);
    const [toast, setToast] = React.useState({ show: false, message: '', type: 'note' });
    const [user, setUser] = useLocalStorageState('user', null);
    const [modal, setModal] = React.useState({ show: false, order: null });
    const [authenticated, setAuthenticated] = useLocalStorageState('authenticated', false);
    const [mounted, setMounted] = React.useState(false);
    const router = useRouter();

    // Ensure component is mounted before accessing localStorage
    React.useEffect(() => {
        setMounted(true);
    }, []);

    // On mount, if authenticated=true, load user from localStorage
    React.useEffect(() => {
        if (!mounted) return;
        
        const auth = window.localStorage.getItem('authenticated');
        if (auth === 'true') {
            const userStr = window.localStorage.getItem('user');
            if (userStr) {
                try {
                    setUser(JSON.parse(userStr));
                } catch {}
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mounted]);

    // Load cart from backend if user changes
    React.useEffect(() => {
        if (user && user.token) {
            cartService.loadCart().then(data => {
                setCartItems(data.cartItems || []);
            }).catch(() => setCartItems([]));
        }
    }, [user]);

    const showToast = (message, type = 'note') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type }), 3000);
    };

    const handleAddToCart = async (productToAdd) => {
        try {
            await cartService.addToCart(productToAdd.id, 1);
            // Reload cart from backend
            const data = await cartService.loadCart();
            setCartItems(data.cartItems || []);
            showToast("Added to cart!", 'success');
        } catch (e) {
            showToast("Failed to add to cart.", 'error');
        }
    };

    const handleUpdateCartQuantity = async (productId, newQuantity) => {
        try {
            if (newQuantity <= 0) {
                await cartService.removeFromCart(productId);
            } else {
                // If decreasing, use decrease endpoint, else use addToCart
                const item = cartItems.find(i => i.product.id === productId);
                if (item && newQuantity < item.quantity) {
                    await cartService.decreaseCartItemQuantity(productId);
                } else {
                    await cartService.addToCart(productId, 1);
                }
            }
            // Reload cart
            const data = await cartService.loadCart();
            setCartItems(data.cartItems || []);
        } catch (e) {
            showToast("Failed to update cart.", 'error');
        }
    };
    
    const handleAuthSuccess = (userData, from) => {
        setUser(userData);
        setAuthenticated(true);
        if (mounted) {
            window.localStorage.setItem('authenticated', 'true');
            window.localStorage.setItem('user', JSON.stringify(userData));
        }
        showToast(`Welcome, ${userData.first_name || userData.last_name || 'User'}!`, 'success');
        router.push(from || '/');
    };

    const handleLogout = async () => {
        console.log("Should loog out")
        try {
            if (user) {
                await backendLogout(user.token);
                console.log("Logging out")
            }
        } catch (e) {
            console.log(e)
        }
        setUser(null);
        setAuthenticated(false);
        if (mounted) {
            window.localStorage.setItem('authenticated', 'false');
            window.localStorage.removeItem('user');
        }
        setCartItems([]);
        showToast("Logged out.", 'note');
        router.push('/');
    };

    const handlePlaceOrder = async (deliveryMethod, address) => {
        if (!user) {
            showToast("Please log in to place an order.", 'error');
            router.push('/login');
            return;
        }
        try {
            const orderDetails = await createOrderFromCart(user.token, {
                shipping_address: address.id
            });
            setCartItems([]);
            setModal({ show: true, order: orderDetails, type: 'orderSuccess' });
        } catch (error) {
            showToast(error.message || "Checkout failed.", 'error');
        }
    };

    const cartItemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

    const isVendor = user?.user_type === 'vendor';
    const isCustomer = user?.user_type === 'customer';
    const value = {
        user,
        setUser,
        isVendor,
        isCustomer,
        cartItems,
        setCartItems,
        cartItemCount,
        toast,
        modal,
        onAddToCart: handleAddToCart,
        onUpdateCartQuantity: handleUpdateCartQuantity,
        onAuthSuccess: handleAuthSuccess,
        onLogout: handleLogout,
        onPlaceOrder: handlePlaceOrder,
        setModal,
        showToast
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}; 