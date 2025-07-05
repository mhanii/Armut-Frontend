'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { AppContext } from '@/context/AppContext';
import CustomImage from '@/components/ui/CustomImage';

const OrderDetailsPage = () => {
    const { user } = React.useContext(AppContext);
    const [order, setOrder] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState('');
    const params = useParams();
    const router = useRouter();
    const { orderId } = params;

    React.useEffect(() => {
        if (!user) {
            router.push(`/login?from=/orders/${orderId}`);
            return;
        }
        if (orderId) {
            api.getOrderById(orderId, user)
                .then(setOrder)
                .catch(err => setError(err.message))
                .finally(() => setLoading(false));
        }
    }, [orderId, user, router]);

    const handleCancelOrder = () => {
        if (window.confirm("Are you sure you want to cancel this order?")) {
            // In a real app, you'd call: api.cancelOrder(order.orderId)
            alert("Order has been cancelled. (This is a mock action)");
            setOrder(prev => ({ ...prev, status: 'Cancelled' }));
        }
    };
    
    if (loading) return <div className="text-center py-20">Loading order details...</div>;
    if (error) return <div className="text-center py-20 text-red-500">Error: {error}</div>;
    if (!order) return <div className="text-center py-20">Order not found.</div>;

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Order Details</h2>
            <p className="text-gray-500 mb-4 sm:mb-6 text-sm sm:text-base">Order ID: {order.orderId}</p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
                <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Order Summary</h3>
                        <div className="flex justify-between mb-2 text-sm sm:text-base">
                            <span>Status:</span>
                            <span className="font-medium text-blue-600">{order.status}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base">
                            <span>Order Date:</span>
                            <span>{new Date(order.date).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Items Ordered ({order.items.length})</h3>
                        {order.items.map(item => (
                            <div key={item.product.id} className="py-3 sm:py-4 border-b last:border-b-0">
                                <p className="font-semibold text-sm sm:text-base">{item.product.name}</p>
                                <div className="flex items-center gap-2 sm:gap-3 pl-4 sm:pl-6 mt-1">
                                    <CustomImage src={item.product.imageUrl} alt={item.product.name} width={40} height={40} className="rounded object-cover border flex-shrink-0" />
                                    <div className="text-xs text-gray-600 flex flex-col min-w-0 flex-1">
                                        <span>Quantity: {item.quantity}</span>
                                        <span>Unit Price: ${parseFloat(item.product.price).toFixed(2)}</span>
                                        {item.product.discountPrice && <span>Discounted: ${parseFloat(item.product.discountPrice).toFixed(2)}</span>}
                                    </div>
                                    <span className="ml-auto text-xs sm:text-sm font-medium">Total: ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-6 sm:space-y-8">
                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                         <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Shipping Address</h3>
                         <div className="text-gray-700 text-sm sm:text-base">
                             <p>{order.shippingAddress.street}, {order.shippingAddress.apt}</p>
                             <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                         </div>
                    </div>
                    <div className="bg-white p-3 sm:p-6 rounded-lg shadow-sm">
                        <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4">Payment Summary</h3>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm sm:text-base"><span>Subtotal:</span> <span>${order.subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-sm sm:text-base"><span>Delivery:</span> <span>${order.deliveryCost.toFixed(2)}</span></div>
                            <div className="flex justify-between font-bold text-base sm:text-lg border-t pt-2 mt-2"><span>Total:</span> <span>${order.total.toFixed(2)}</span></div>
                        </div>
                    </div>
                    {order.status === 'Processing' && (
                        <button onClick={handleCancelOrder} className="w-full bg-red-500 text-white font-bold py-2 sm:py-3 rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base">
                            Cancel Order
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrderDetailsPage; 