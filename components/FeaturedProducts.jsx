import React from 'react';
import ProductCard from './ProductCard';

const FeaturedProducts = ({ products }) => {
    if (!products || products.length === 0) {
        return (
            <div className="py-8 sm:py-12">
                <div className="container mx-auto px-4 sm:px-6">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">Featured Products</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                                <div className="relative h-48 sm:h-64 bg-gray-200 animate-glow-opacity" />
                                <div className="p-3 sm:p-4">
                                    <div className="h-5 sm:h-6 w-3/4 mb-2 rounded bg-gray-200 animate-glow-opacity" />
                                    <div className="h-3 sm:h-4 w-1/2 mb-2 rounded bg-gray-200 animate-glow-opacity" />
                                    <div className="h-5 sm:h-6 w-1/4 mt-2 rounded bg-gray-200 animate-glow-opacity" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="py-8 sm:py-12">
            <div className="container mx-auto px-4 sm:px-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">Featured Products</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                    {products.map(p => (
                        <ProductCard key={p.id} product={p} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturedProducts; 