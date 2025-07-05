import { getProductById, getProducts } from '@/lib/services/productService';
import CustomImage from '@/components/ui/CustomImage';
import { StarIcon } from '@/components/ui/Icons';
import ProductCard from '@/components/ProductCard';
import Link from 'next/link';
import ProductImageSlider from '@/components/ProductImageSlider';
import AddToCartAndBuyNow from '@/components/AddToCartAndBuyNow';

const PLACEHOLDER_IMAGE = '/placeholder-product.png';

export default async function ProductDetailPage({ params }) {
    const productId = parseInt(params.id);
    const product = await getProductById(productId);
    if (!product) return <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">Product not found.</div>;

    // Fetch all products for related products
    let allProducts = await getProducts();
    allProducts = Array.isArray(allProducts) ? allProducts : (Array.isArray(allProducts?.results) ? allProducts.results : []);
    const relatedProducts = allProducts.filter(rp => rp.category === product.category && rp.id !== product.id).slice(0, 4);

    // Group images by color id
    const imagesByColor = {};
    if (Array.isArray(product.images)) {
        for (const img of product.images) {
            if (img.color && img.color.id) {
                if (!imagesByColor[img.color.id]) imagesByColor[img.color.id] = [];
                imagesByColor[img.color.id].push(img);
            }
        }
    }
    // Get available colors with images
    const availableColors = Array.isArray(product.colors)
        ? product.colors.filter(c => imagesByColor[c.id] && imagesByColor[c.id].length > 0)
        : [];

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <Link href="/products" className="mb-4 sm:mb-6 inline-block text-gray-600 hover:text-gray-900 text-sm sm:text-base">&larr; Back to Products</Link>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12 items-stretch">
                <div className="flex flex-col h-full">
                    <ProductImageSlider
                        imagesByColor={imagesByColor}
                        availableColors={availableColors}
                        productName={product.name}
                    />
                </div>
                <div className="flex flex-col h-full justify-between">
                    <div>
                        <h2 className="text-xl sm:text-2xl md:text-4xl font-bold mb-2">{product.name}</h2>
                        <div className="flex items-center mb-2 sm:mb-4">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => <StarIcon key={i} c={i < Math.round(product.rating) ? 'text-yellow-500' : 'text-gray-300'} />)}
                            </div>
                            <span className="ml-2 text-gray-600 text-xs sm:text-base">({product.reviews?.length || 0} reviews)</span>
                        </div>
                        {product.category && typeof product.category === 'object' && product.category.name && (
                            <div className="mb-1 sm:mb-2 text-gray-700 text-xs sm:text-base">Category: <span className="font-semibold">{product.category.name}</span></div>
                        )}
                        {product.shipping_price && (
                            <div className="mb-1 sm:mb-2 text-gray-700 text-xs sm:text-base">Shipping: <span className="font-semibold">${parseFloat(product.shipping_price).toFixed(2)}</span></div>
                        )}
                        {product.discount > 0 ? (
                            <div className="flex items-baseline gap-2 mb-2 sm:mb-4">
                                <p className="text-red-600 font-bold text-xl sm:text-3xl">${(parseFloat(product.price) * (1 - product.discount / 100)).toFixed(2)}</p>
                                <p className="text-gray-500 line-through text-base sm:text-xl">${parseFloat(product.price).toFixed(2)}</p>
                            </div>
                        ) : (
                            <p className="text-xl sm:text-3xl text-brand mb-2 sm:mb-4">${parseFloat(product.price).toFixed(2)}</p>
                        )}
                        <p className="leading-relaxed mb-4 sm:mb-6 text-sm sm:text-base">{product.description}</p>
                    </div>
                    {/* Buttons at the bottom, fill width, aligned with image height */}
                    <div className="mt-2 sm:mt-4">
                        <AddToCartAndBuyNow product={product} />
                    </div>
                </div>
            </div>
            <div className="mt-8 sm:mt-12">
                <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">Reviews</h3>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm space-y-4 sm:space-y-6">
                    {product.reviews && product.reviews.length > 0 ? product.reviews.map(review => (
                        <div key={review.id} className="border-b pb-3 sm:pb-4 last:border-0 last:pb-0">
                            <div className="flex items-center mb-1">
                                 {[...Array(5)].map((_, i) => <StarIcon key={i} c={i < review.rating ? 'text-yellow-500' : 'text-gray-300'} />)}
                                 <p className="ml-2 sm:ml-4 font-semibold text-xs sm:text-base">{review.author}</p>
                            </div>
                            <p className="text-gray-600 text-xs sm:text-base">{review.comment}</p>
                        </div>
                    )) : <p className="text-xs sm:text-base">No reviews yet.</p>}
                </div>
            </div>
            {relatedProducts.length > 0 && (
                <div className="mt-8 sm:mt-12">
                     <h3 className="text-lg sm:text-2xl font-bold mb-2 sm:mb-4">You Might Also Like</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                        {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
                    </div>
                </div>
            )}
        </div>
    );
} 