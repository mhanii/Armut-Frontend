"use client";
import React, { useState, useEffect } from 'react';
import CustomImage from './ui/CustomImage';

const PLACEHOLDER_IMAGE = '/placeholder-product.png';

const ProductImageSlider = ({ imagesByColor, availableColors, productName }) => {
    const [selectedColorId, setSelectedColorId] = useState(
        availableColors.length > 0 ? availableColors[0].id : null
    );
    const imagesToShow = selectedColorId && imagesByColor[selectedColorId] ? imagesByColor[selectedColorId] : [];
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        setCurrent(0);
    }, [selectedColorId]);

    return (
        <>
            {/* Image slider with darker background and border radius */}
            <div className="relative h-[400px] mb-4 bg-gray-200 rounded-xl flex items-center justify-center">
                {imagesToShow.length > 0 ? (
                    <div className="relative w-full h-full">
                        <CustomImage
                            src={imagesToShow[current].imageUrl}
                            alt={imagesToShow[current].color?.name || productName}
                            fill
                            style={{ objectFit: 'cover' }}
                            className="rounded-lg shadow-lg"
                        />
                        {imagesToShow.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {imagesToShow.map((img, idx) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setCurrent(idx)}
                                        className={`w-3 h-3 rounded-full ${current === idx ? 'bg-blue-500' : 'bg-gray-300'}`}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                ) : (
                    <CustomImage src={PLACEHOLDER_IMAGE} alt={productName} fill style={{ objectFit: 'cover' }} className="rounded-lg shadow-lg" />
                )}
            </div>
            {/* Color selector below the image, with bold label */}
            {availableColors.length > 0 && (
                <div className="mb-4 flex items-center gap-4">
                    <span className="text-gray-700 font-bold whitespace-nowrap">Available Colors</span>
                    <div className="flex gap-2">
                        {availableColors.map(color => (
                            <button
                                key={color.id}
                                onClick={() => setSelectedColorId(color.id)}
                                className={`w-8 h-8 rounded-full border-2 ${selectedColorId === color.id ? 'border-blue-500 scale-110' : 'border-transparent'} transition-all`}
                                style={{ backgroundColor: color.hex_code }}
                                title={color.name}
                            />
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default ProductImageSlider; 