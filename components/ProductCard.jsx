'use client';

import Link from 'next/link';
import { StarIcon } from '@/components/ui/Icons';
import CustomImage from './ui/CustomImage';
import AddToCartButton from './ui/AddToCartButton';

const PLACEHOLDER_IMAGE = '/placeholder-product.png';

const ProductCard = ({ product }) => {
    const thumbnail = product.images && product.images.length > 0
        ? product.images[0].imageUrl
        : PLACEHOLDER_IMAGE;
    return( 
        <div className="bg-white rounded-lg shadow-sm overflow-hidden transform hover:-translate-y-2 transition-all-fast group">
            <Link href={`/products/${product.id}`}>
                <div className="relative h-48 sm:h-64">
                    <CustomImage 
                        src={thumbnail} 
                        alt={product.name} 
                        fill
                        style={{objectFit: "cover"}}
                    />
                    {product.discount > 0 && <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-red-500 text-white text-xs sm:text-sm font-bold px-2 py-1 rounded">SALE</div>}
                    <div className="absolute bottom-0 right-0 p-2 sm:p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <AddToCartButton product={product} />
                    </div>
                </div>
            </Link>
            <div className="p-3 sm:p-4">
                <h4 className="text-base sm:text-lg font-semibold">{product.name}</h4>
                <div className="flex items-center mt-1">
                    <StarIcon c="text-yellow-500" />
                    <span className="text-gray-600 text-xs sm:text-sm ml-1">{product.rating ? product.rating : 0} ({ product.reviews && product.reviews.length ? product.reviews.length : 0} reviews)</span>
                </div>
                {product.discount > 0 ? (
                    <div className="flex items-baseline gap-2 mt-1">
                        <p className="text-red-600 font-bold text-base sm:text-lg">${((parseFloat(product.price) * (1 - product.discount / 100))).toFixed(2)}</p>
                        <p className="text-gray-500 line-through text-xs sm:text-base">${parseFloat(product.price).toFixed(2)}</p>
                    </div>
                ) : (
                    <p className="text-gray-600 mt-1 text-base sm:text-lg">${parseFloat(product.price).toFixed(2)}</p>
                )}
            </div>
        </div>
    );
};

export default ProductCard; 