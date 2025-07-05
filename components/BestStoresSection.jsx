import Link from 'next/link';
import { StarIcon } from '@/components/ui/Icons';
import CustomImage from './ui/CustomImage';

const BestStoresSection = ({ stores }) => {
    return (
        <div className="bg-[#f0ebe5] py-8 sm:py-12">
            <div className="container mx-auto px-4 sm:px-6">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-center mb-6 sm:mb-8">Visit Our Top Stores</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
                    {stores.map(st => (
                        <Link 
                            key={st.id} 
                            href={`/stores/${st.id}`}
                            className="bg-white p-4 sm:p-6 rounded-lg shadow-sm cursor-pointer hover:shadow-lg transition-shadow block"
                        >
                            <div className="relative h-32 sm:h-48 mb-3 sm:mb-4">
                                <CustomImage 
                                    src={st.imageUrl} 
                                    alt={st.name} 
                                    fill 
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    style={{objectFit: 'cover'}} 
                                    className="rounded-lg"
                                />
                            </div>
                            <h4 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">{st.name}</h4>
                            <div className="flex items-center">
                                <StarIcon c="text-yellow-500 w-5 h-5 mr-1" />
                                <span className="font-bold text-sm sm:text-base">{st.rating}</span>
                                <span className="text-gray-500 ml-1 text-xs sm:text-sm">/ 5.0</span>
                            </div>
                            <p className="mt-1 sm:mt-2 text-gray-600 text-xs sm:text-base">{st.address}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BestStoresSection; 