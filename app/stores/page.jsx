'use client';

import React from 'react';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { StarIcon } from '@/components/ui/Icons';

const StoresPage = () => {
    const [stores, setStores] = React.useState([]);

    React.useEffect(() => {
        api.getStores().then(setStores);
    }, []);

    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Our Stores</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
                {stores.map(st => (
                    <Link key={st.id} href={`/stores/${st.id}`} className="bg-white rounded-lg shadow-sm overflow-hidden group cursor-pointer block">
                        <div className="relative h-32 sm:h-48 w-full">
                            <Image 
                                src={st.imageUrl} 
                                alt={st.name}
                                fill
                                style={{objectFit:"cover"}}
                                className="group-hover:scale-105 transition-transform"
                            />
                        </div>
                        <div className="p-3 sm:p-4">
                            <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">{st.name}</h3>
                            <div className="flex items-center mb-1 sm:mb-2">
                                <StarIcon c="text-yellow-500 w-5 h-5 mr-1" />
                                <span className="font-bold text-sm sm:text-base">{st.rating}</span>
                            </div>
                            <p className="text-gray-600 text-xs sm:text-base">{st.address}</p>
                            <p className="text-xs sm:text-sm text-gray-500 mt-1">{st.hours}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default StoresPage; 