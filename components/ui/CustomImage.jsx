'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const CustomImage = (props) => {
    const { src, fallbackSrc = 'https://placehold.co/600x400/eee/ccc?text=Image+Not+Found', ...rest } = props;
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
    }, [src]);

    // Check if the image is from an external domain that might not support Next.js optimization
    const isExternalImage = src && (
        src.startsWith('http://') || 
        src.startsWith('https://') ||
        src.includes('armut-backend.onrender.com') ||
        src.includes('localhost:8000')
    );

    return (
        <Image
            {...rest}
            src={imgSrc}
            unoptimized={isExternalImage} // Disable optimization for external images
            onError={() => {
                setImgSrc(fallbackSrc);
            }}
        />
    );
};

export default CustomImage; 