'use client';

import React from 'react';
import Link from 'next/link';

const HeroSlider = ({ banners }) => {
    const [current, setCurrent] = React.useState(0);

    React.useEffect(() => {
        if (!banners) return;
        const timer = setTimeout(() => {
            setCurrent(prev => (prev + 1) % banners.length);
        }, 5000);
        return () => clearTimeout(timer);
    }, [current, banners]);

    if (!banners || banners.length === 0) {
        return (
            <div className="h-[60vh] bg-gray-200 animate-glow-opacity" />
        );
    }

    return (
        <div className="hero-slider">
            {banners.map((b, i) => (
                <div 
                    key={b.id} 
                    className="slide" 
                    style={{ backgroundImage: `url(${b.imageUrl})`, opacity: i === current ? 1 : 0 }}
                >
                    <div className="w-full h-full flex items-center justify-center bg-black/40">
                        <div className="text-center text-white p-4">
                            <h2 className="text-4xl md:text-5xl font-bold mb-4">{b.title}</h2>
                            <p className="text-lg mb-8">{b.subtitle}</p>
                            <Link href="/products" className="bg-white text-gray-900 font-bold py-3 px-8 rounded-full hover:bg-gray-200">
                                Shop Now
                            </Link>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default HeroSlider; 