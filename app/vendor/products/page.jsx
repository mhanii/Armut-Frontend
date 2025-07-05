"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import Link from "next/link";
import { getProductsForVendor } from "@/lib/services/productService";
import { getCategories } from "@/lib/services/categoryService";
import { PencilIcon, TrashIcon } from '@/components/ui/Icons';

export default function VendorProducts() {
  const { isVendor, user } = useContext(AppContext);
  const router = useRouter();
  const [vendorProducts, setVendorProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isVendor) router.replace("/");
    else {
      setLoading(true);
      setError(null);
      
      // Fetch both products and categories
      Promise.all([
        getProductsForVendor()
          .then(response => {
            // Ensure we always have an array
            const products = Array.isArray(response) ? response : 
                            (response?.results ? response.results : 
                            (response?.data ? response.data : []));
            return products;
          })
          .catch(err => {
            console.error('Error fetching vendor products:', err);
            throw new Error('Failed to load products');
          }),
        getCategories()
          .then(categories => categories || [])
          .catch(err => {
            console.error('Error fetching categories:', err);
            return [];
          })
      ])
        .then(([products, categories]) => {
          setVendorProducts(products);
          setCategories(categories);
        })
        .catch(err => {
          setError(err.message || 'Failed to load data');
          setVendorProducts([]);
          setCategories([]);
        })
        .finally(() => setLoading(false));
    }
  }, [isVendor, router]);

  // Helper function to get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return 'Unknown';
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Unknown';
  };

  // Helper function to get product image
  const getProductImage = (product) => {
    // Try different possible image fields
    if (product.images && product.images.length > 0) {
      return product.images[0].imageUrl || product.images[0].url;
    }
    if (product.imageUrl) {
      return product.imageUrl;
    }
    if (product.image) {
      return product.image;
    }
    return 'https://via.placeholder.com/48';
  };

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Your Products</h1>
          <Link href="/vendor/products/add-product" className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 font-semibold shadow">
            + Add Product
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-slate-800">Your Products</h1>
          <Link href="/vendor/products/add-product" className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 font-semibold shadow">
            + Add Product
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center text-red-600">
            <p className="text-lg font-semibold">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Your Products</h1>
        <Link href="/vendor/products/add-product" className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 font-semibold shadow">
          + Add Product
        </Link>
      </div>
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-sm text-slate-500">
              <th className="p-4">Image</th>
              <th className="p-4">Product</th>
              <th className="p-4">Category</th>
              <th className="p-4">Price</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(vendorProducts) && vendorProducts.length > 0 ? (
              vendorProducts.map((p) => (
                <tr key={p.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                  <td className="p-4">
                    <img 
                      src={getProductImage(p)} 
                      className="w-12 h-12 object-cover rounded" 
                      alt={p.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/48';
                      }}
                    />
                  </td>
                  <td className="p-4 font-medium">{p.name}</td>
                  <td className="p-4">{getCategoryName(p.category)}</td>
                  <td className="p-4">${(parseFloat(p.price) || 0).toFixed(2)}</td>
                  <td className="p-4">{p.stock || p.quantity || 0}</td>
                  <td className="p-4 flex gap-2">
                    <Link href={`/vendor/products/edit-product/${p.id}`} className="text-sky-600 hover:text-sky-800 p-2" title="Edit">
                      <PencilIcon c="w-5 h-5" />
                    </Link>
                    <button className="text-red-600 hover:text-red-800 p-2" title="Delete">
                      <TrashIcon c="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-500">
                  No products found. <Link href="/vendor/products/add-product" className="text-sky-600 hover:text-sky-800">Add your first product</Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 