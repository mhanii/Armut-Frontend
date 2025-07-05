'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

const CustomImage = (props) => {
    const { src, fallbackSrc = 'https://placehold.co/600x400/eee/ccc?text=Image+Not+Found', ...rest } = props;
    const [imgSrc, setImgSrc] = useState(src);

    useEffect(() => {
        setImgSrc(src);
    }, [src]);

    return (
        <Image
            {...rest}
            src={imgSrc}
            onError={() => {
                setImgSrc(fallbackSrc);
            }}
        />
    );
};

export default CustomImage; 