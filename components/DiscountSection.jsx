import React from 'react';
import ProductCard from '@/components/ProductCard';

const DiscountSection = ({ discountedProducts }) => {
    if (!discountedProducts || discountedProducts.length === 0) return null;
    return (
        <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">
            <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">Limited Time Offers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {discountedProducts.map(p => (
                    <ProductCard key={p.id} product={p} />
                ))}
            </div>
        </div>
    );
};

export default DiscountSection; 