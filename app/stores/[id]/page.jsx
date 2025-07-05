'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import ProductCard from '@/components/ProductCard';
import { AppContext } from '@/context/AppContext';
import Image from 'next/image';

const StoreProductsPage = () => {
    const params = useParams();
    const storeId = parseInt(params.id);
    const [store, setStore] = React.useState(null);
    const [products, setProducts] = React.useState([]);
    const { onAddToCart } = React.useContext(AppContext);

    React.useEffect(() => {
        if (!storeId) return;
        api.getStoreById(storeId).then(setStore);
        api.getProducts(storeId).then(setProducts);
    }, [storeId]);

    if (!store) return <div className="text-center py-10">Loading...</div>;

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <div className="relative h-32 sm:h-64 rounded-lg overflow-hidden mb-6 sm:mb-8">
                <Image 
                    src={store.imageUrl} 
                    alt={store.name} 
                    fill 
                    style={{objectFit: 'cover'}} 
                    unoptimized={store.imageUrl && (store.imageUrl.includes('armut-backend.onrender.com') || store.imageUrl.includes('localhost:8000'))}
                />
                <div className="absolute inset-0 bg-black/50 flex items-end p-4 sm:p-8">
                    <div>
                        <h2 className="text-xl sm:text-4xl font-bold text-white mb-1 sm:mb-2">{store.name}</h2>
                        <p className="text-base sm:text-lg text-gray-200">{store.address}</p>
                    </div>
                </div>
            </div>
            <h3 className="text-lg sm:text-2xl font-bold mb-4 sm:mb-6">Products Available Here</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {products.length > 0 ? (
                    products.map(p => <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />)
                ) : (
                    <p className="col-span-full text-center text-gray-500 text-sm sm:text-base">No products available at this store.</p>
                )}
            </div>
        </div>
    );
};

export default StoreProductsPage; 