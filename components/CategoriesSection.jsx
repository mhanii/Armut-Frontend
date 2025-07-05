import Link from 'next/link';
import CustomImage from './ui/CustomImage';

const CategoriesSection = ({ categories }) => {
    if (!categories || categories.length === 0) {
        return (
            <div className="bg-white py-8 sm:py-12">
                <div className="container mx-auto px-4 sm:px-6">
                    <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">Shop by Category</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="rounded-lg overflow-hidden h-32 sm:h-64 bg-gray-200 animate-glow-opacity" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className="bg-white py-8 sm:py-12">
            <div className="container mx-auto px-4 sm:px-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">Shop by Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                    {categories.map(c => (
                        <Link key={c.name} href={`/products?category=${encodeURIComponent(c.name)}`} className="relative rounded-lg overflow-hidden cursor-pointer group h-32 sm:h-64 block">
                            <CustomImage 
                                src={c.imageUrl} 
                                alt={c.name}
                                fill
                                sizes="(max-width: 768px) 50vw, 25vw"
                                style={{objectFit: "cover"}}
                                className="transform group-hover:scale-110 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <h4 className="text-white text-base sm:text-xl font-bold">{c.name}</h4>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CategoriesSection; 