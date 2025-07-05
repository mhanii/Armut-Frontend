"use client";

import React, { useState, useEffect } from 'react';
import { getProducts } from '@/lib/services/productService';
import ProductCard from './ProductCard';
import { AppContext } from '@/context/AppContext';

const ProductResults = ({ categories }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filteredAndSorted, setFilteredAndSorted] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategories, setSelectedCategories] = useState([]); // array of category ids
    const [sort, setSort] = useState('relevance');
    const [page, setPage] = useState(1);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const productsPerPage = 10;
    const { onAddToCart } = React.useContext(AppContext);

    // Fetch products from backend when filters change
    useEffect(() => {
        setLoading(true);
        setError(null);
        const params = {};
        if (selectedCategories.length > 0) {
            params.category = selectedCategories.join(',');
        }
        if (minPrice) params.price_min = minPrice;
        if (maxPrice) params.price_max = maxPrice;
        getProducts(params)
            .then(data => {
                let results = Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : []);
                setProducts(results);
                setLoading(false);
            })
            .catch(err => {
                setError('Failed to load products. Please try again later.');
                setProducts([]);
                setLoading(false);
            });
        setPage(1);
    }, [selectedCategories, minPrice, maxPrice, categories]);

    useEffect(() => {
        if (!Array.isArray(products)) {
            setFilteredAndSorted([]);
            return;
        }
        let temp = [...products];
        if (searchTerm) {
            temp = temp.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        switch (sort) {
            case 'price-asc':
                temp.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                temp.sort((a, b) => b.price - a.price);
                break;
            case 'date-asc':
                temp.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
                break;
            case 'date-desc':
                temp.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                break;
            default:
                break;
        }
        setFilteredAndSorted(temp);
        setPage(1);
    }, [searchTerm, products, sort]);

    const totalPages = Math.ceil(filteredAndSorted.length / productsPerPage);
    const paginatedProducts = filteredAndSorted.slice((page - 1) * productsPerPage, page * productsPerPage);

    // Handle category checkbox change
    const handleCategoryChange = (id) => {
        setSelectedCategories(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    // Sidebar content as a component for reuse
    const SidebarContent = (
        <aside className="w-full md:w-64 min-w-[200px] bg-white rounded-lg shadow-sm p-4 sm:p-6 h-fit mb-4 md:mb-0">
            <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Filter by Category</h3>
            <div className="flex flex-col gap-2 mb-4 sm:mb-6">
                {Array.isArray(categories) && categories.map(cat => (
                    <label key={cat.id} className="flex items-center gap-2 cursor-pointer text-xs sm:text-base">
                        <input
                            type="checkbox"
                            checked={selectedCategories.includes(cat.id)}
                            onChange={() => handleCategoryChange(cat.id)}
                            className="accent-brand"
                        />
                        <span>{cat.name}</span>
                    </label>
                ))}
            </div>
            <h3 className="font-bold text-base sm:text-lg mb-1 sm:mb-2">Price</h3>
            <div className="flex flex-col gap-2">
                <input
                    type="number"
                    min="0"
                    placeholder="Min Price"
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-brand focus:outline-none text-xs sm:text-base"
                    value={minPrice}
                    onChange={e => setMinPrice(e.target.value)}
                />
                <input
                    type="number"
                    min="0"
                    placeholder="Max Price"
                    className="p-2 border rounded-lg focus:ring-2 focus:ring-brand focus:outline-none text-xs sm:text-base"
                    value={maxPrice}
                    onChange={e => setMaxPrice(e.target.value)}
                />
            </div>
        </aside>
    );

    return (
        <div className="flex flex-col md:flex-row gap-8">
            {/* Mobile filter toggle button */}
            <div className="md:hidden mb-4 flex justify-end">
                <button
                    onClick={() => setShowMobileFilters(true)}
                    className="px-4 py-2 bg-gray-200 rounded-lg font-semibold shadow-sm border border-gray-300 text-xs sm:text-base"
                >
                    Show Filters
                </button>
            </div>
            {/* Sidebar for desktop */}
            <div className="hidden md:block">{SidebarContent}</div>
            {/* Mobile filter panel */}
            {showMobileFilters && (
                <div className="fixed inset-0 z-40 flex">
                    <div className="fixed inset-0 bg-black/40" onClick={() => setShowMobileFilters(false)} />
                    <div className="relative bg-white w-80 max-w-full h-full shadow-lg p-4 sm:p-6 z-50 animate-slide-in-left">
                        <div className="flex justify-between items-center mb-3 sm:mb-4">
                            <h3 className="font-bold text-base sm:text-lg">Filters</h3>
                            <button
                                onClick={() => setShowMobileFilters(false)}
                                className="text-gray-500 hover:text-gray-900 text-xl sm:text-2xl font-bold"
                                aria-label="Close filters"
                            >
                                &times;
                            </button>
                        </div>
                        {SidebarContent}
                    </div>
                </div>
            )}
            {/* Divider for mobile */}
            <div className="block md:hidden border-b border-gray-200 mb-4" />
            {/* Main content */}
            <div className="flex-1">
                <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <input
                        type="text"
                        placeholder="Search for products..."
                        className="w-full p-2 sm:p-3 border rounded-lg focus:ring-2 focus:ring-brand focus:outline-none text-xs sm:text-base"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <select onChange={(e) => setSort(e.target.value)} value={sort} className="p-2 border rounded-lg min-w-[120px] sm:min-w-[180px] text-xs sm:text-base">
                        <option value="relevance">Relevance</option>
                        <option value="price-asc">Price: Low to High</option>
                        <option value="price-desc">Price: High to Low</option>
                        <option value="date-desc">Newest</option>
                        <option value="date-asc">Oldest</option>
                    </select>
                </div>
                {error ? (
                    <div className="text-center text-red-500 py-8 sm:py-12 text-xs sm:text-base">{error}</div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-8">
                        {loading ? (
                            Array.from({ length: productsPerPage }).map((_, i) => (
                                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                                    <div className="relative h-32 sm:h-64 bg-gray-200" />
                                    <div className="p-2 sm:p-4">
                                        <div className="h-4 sm:h-6 w-3/4 mb-1 sm:mb-2 rounded bg-gray-200" />
                                        <div className="h-3 sm:h-4 w-1/2 mb-1 sm:mb-2 rounded bg-gray-200" />
                                        <div className="h-4 sm:h-6 w-1/4 mt-1 sm:mt-2 rounded bg-gray-200" />
                                    </div>
                                </div>
                            ))
                        ) : paginatedProducts.length > 0 ? (
                            paginatedProducts.map(p => <ProductCard key={p.id} product={p} />)
                        ) : (
                            <p className="col-span-full text-center text-gray-500 text-xs sm:text-base">No products found.</p>
                        )}
                    </div>
                )}
                {totalPages > 1 && !loading && !error && (
                    <div className="mt-8 sm:mt-12 flex justify-center items-center gap-2 sm:gap-4">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 sm:px-4 py-2 bg-white rounded-lg disabled:opacity-50 text-xs sm:text-base">
                            Previous
                        </button>
                        <span className="text-xs sm:text-base">Page {page} of {totalPages}</span>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 sm:px-4 py-2 bg-white rounded-lg disabled:opacity-50 text-xs sm:text-base">
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductResults; 