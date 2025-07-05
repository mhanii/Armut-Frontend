"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import { XIcon } from '@/components/ui/Icons';
import CustomImage from '@/components/ui/CustomImage';
import ImageUpload from '@/components/ui/ImageUpload';
import { createProduct } from '@/lib/services/productService';
import { getCategories } from '@/lib/services/categoryService';

export default function VendorAddProduct() {
  const { isVendor, user, showToast } = useContext(AppContext);
  const router = useRouter();
  useEffect(() => { if (!isVendor) router.replace("/"); }, [isVendor, router]);

  const [form, setForm] = useState({
    name: '',
    price: '',
    discount: '',
    description: '',
    category: '',
    quantity: 0,
    deliveryOptions: { standard: 50, express: 90 },
    customizationOptions: { colors: [] }
  });
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newImageColor, setNewImageColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [productImages, setProductImages] = useState([]); // Array of {file, color} objects

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const fetchedCategories = await getCategories();
        setCategories(fetchedCategories);
        // Set default category if available
        if (fetchedCategories.length > 0 && !form.category) {
          setForm(prev => ({ ...prev, category: fetchedCategories[0].id }));
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
        showToast('Failed to load categories', 'error');
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    
    if (!form.price || parseFloat(form.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    if (form.discount && parseFloat(form.discount) >= 100) {
      newErrors.discount = 'Discount percentage cannot be 100% or more';
    }
    
    if (!form.description.trim()) {
      newErrors.description = 'Product description is required';
    }
    
    if (!form.category) {
      newErrors.category = 'Category is required';
    }
    
    if (form.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }
    
    if (productImages.length === 0) {
      newErrors.images = 'At least one product image is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const handleDeliveryChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, deliveryOptions: { ...prev.deliveryOptions, [name]: parseFloat(value) } }));
  };
  
  const addColor = () => {
    if (newColorName && newColorHex) {
      const newColors = [...form.customizationOptions.colors, { name: newColorName, hex: newColorHex }];
      setForm(prev => ({ ...prev, customizationOptions: { ...prev.customizationOptions, colors: newColors } }));
      setNewColorName('');
      setNewColorHex('#000000');
    }
  };
  
  const removeColor = (colorNameToRemove) => {
    const newColors = form.customizationOptions.colors.filter(c => c.name !== colorNameToRemove);
    setForm(prev => ({ ...prev, customizationOptions: { ...prev.customizationOptions, colors: newColors } }));
  };
  
  const handleImageDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };
  
  const handleAddImage = () => {
    if (!imageFile) {
      showToast('Please select an image file.', 'error');
      return;
    }
    if (!newImageColor) {
      showToast('Please select a color to assign to the image.', 'error');
      return;
    }
    
    const newImage = {
      file: imageFile,
      color: newImageColor,
      preview: imagePreview
    };
    
    setProductImages(prev => [...prev, newImage]);
    setNewImageColor('');
    setImageFile(null);
    setImagePreview(null);
    
    // Clear image error when user adds an image
    if (errors.images) {
      setErrors(prev => ({ ...prev, images: '' }));
    }
  };
  
  const handleRemoveImage = (indexToRemove) => {
    const imageToRemove = productImages[indexToRemove];
    if (imageToRemove.preview.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setProductImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };
  
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showToast('Please fix the errors in the form.', 'error');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create FormData for multipart/form-data submission
      const formData = new FormData();
      
      // Add basic product data
      formData.append('name', form.name.trim());
      formData.append('price', parseFloat(form.price));
      if (form.discount) {
        formData.append('discount', parseFloat(form.discount));
      }
      formData.append('description', form.description.trim());
      formData.append('category', form.category);
      formData.append('quantity', parseInt(form.quantity));
      
      // Add delivery options as JSON string
      formData.append('delivery_options', JSON.stringify(form.deliveryOptions));
      
      // Add customization options as JSON string
      formData.append('customization_options', JSON.stringify(form.customizationOptions));
      
      // Add images with their associated colors
      productImages.forEach((imageData, index) => {
        formData.append(`images[${index}]`, imageData.file);
        formData.append(`image_colors[${index}]`, imageData.color);
      });
      
      await createProduct(user.token, formData);
      showToast('Product added successfully!', 'success');
      router.push('/vendor/products');
    } catch (error) {
      console.error('Error creating product:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to create product';
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
      <form onSubmit={handleSubmit} encType="multipart/form-data">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Core Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={form.name} 
                    onChange={handleChange} 
                    className={`mt-1 w-full p-2 border rounded ${errors.name ? 'border-red-500' : ''}`} 
                    required 
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Category</label>
                  {categoriesLoading ? (
                    <div className="mt-1 w-full p-2 border rounded bg-gray-100 animate-pulse">
                      <div className="w-24 h-4 bg-gray-200 rounded"></div>
                    </div>
                  ) : (
                    <select 
                      name="category" 
                      value={form.category} 
                      onChange={handleChange} 
                      className={`mt-1 w-full p-2 border rounded bg-white ${errors.category ? 'border-red-500' : ''}`}
                    >
                      <option value="">Select a category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {errors.category && <p className="text-red-500 text-xs mt-1">{errors.category}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Stock</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    value={form.quantity} 
                    onChange={handleChange} 
                    className={`mt-1 w-full p-2 border rounded ${errors.quantity ? 'border-red-500' : ''}`} 
                  />
                  {errors.quantity && <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>}
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-600">Description</label>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  rows="4" 
                  className={`mt-1 w-full p-2 border rounded ${errors.description ? 'border-red-500' : ''}`}
                ></textarea>
                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description}</p>}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Pricing & Delivery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Price ($)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="price" 
                    value={form.price} 
                    onChange={handleChange} 
                    className={`mt-1 w-full p-2 border rounded ${errors.price ? 'border-red-500' : ''}`} 
                    required 
                  />
                  {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Discount Percentage (%)</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="discount" 
                    value={form.discount} 
                    onChange={handleChange} 
                    className={`mt-1 w-full p-2 border rounded ${errors.discount ? 'border-red-500' : ''}`} 
                  />
                  {errors.discount && <p className="text-red-500 text-xs mt-1">{errors.discount}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Standard Delivery ($)</label>
                  <input type="number" step="0.01" name="standard" value={form.deliveryOptions.standard} onChange={handleDeliveryChange} className="mt-1 w-full p-2 border rounded" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Express Delivery ($)</label>
                  <input type="number" step="0.01" name="express" value={form.deliveryOptions.express} onChange={handleDeliveryChange} className="mt-1 w-full p-2 border rounded" />
                </div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Custom Colors</h2>
              <div className="flex items-end gap-2 mb-4">
                <div className="flex-grow">
                  <label className="text-sm font-medium text-slate-600">Name</label>
                  <input type="text" placeholder="e.g. Navy Blue" value={newColorName} onChange={e => setNewColorName(e.target.value)} className="w-full mt-1 p-2 border rounded" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">Hex</label>
                  <input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="w-12 h-10 mt-1 p-1 border rounded" />
                </div>
                <button type="button" onClick={addColor} className="px-4 h-10 bg-sky-500 text-white rounded-md hover:bg-sky-600">Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {form.customizationOptions.colors.map(c => (
                  <div key={c.name} className="flex items-center gap-2 bg-slate-100 rounded-full pl-3 pr-1 py-1">
                    <div className="w-4 h-4 rounded-full border border-slate-300" style={{ backgroundColor: c.hex }}></div>
                    <span className="text-sm">{c.name}</span>
                    <button type="button" onClick={() => removeColor(c.name)} className="bg-slate-300 hover:bg-slate-400 rounded-full p-0.5"><XIcon /></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Product Images</h2>
              {/* Image Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  onDrop={handleImageDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <div className="space-y-2">
                    <div className="text-gray-600">Drop an image here or click to select</div>
                    {imagePreview && (
                      <div className="mt-4">
                        <img src={imagePreview} alt="Preview" className="max-w-full h-32 object-cover rounded" />
                      </div>
                    )}
                  </div>
                </label>
              </div>
              
              {/* Color Selection for Image */}
              {imageFile && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-slate-600 mb-2">Select Color for this Image</label>
                  <select 
                    value={newImageColor} 
                    onChange={(e) => setNewImageColor(e.target.value)}
                    className="w-full p-2 border rounded"
                  >
                    <option value="">Choose a color</option>
                    {form.customizationOptions.colors.map(color => (
                      <option key={color.name} value={color.name}>
                        {color.name}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={handleAddImage}
                    className="mt-2 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600"
                  >
                    Add Image
                  </button>
                </div>
              )}
              
              {/* Display Added Images */}
              {productImages.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-slate-600 mb-2">Added Images:</h4>
                  <div className="space-y-2">
                    {productImages.map((imageData, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                        <img src={imageData.preview} alt={`Product ${index + 1}`} className="w-12 h-12 object-cover rounded" />
                        <span className="text-sm flex-grow">Color: {imageData.color}</span>
                        <button 
                          type="button" 
                          onClick={() => handleRemoveImage(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <XIcon c="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {errors.images && <p className="text-red-500 text-xs mt-2">{errors.images}</p>}
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-end space-x-4">
              <button type="submit" disabled={isLoading} className="w-full py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 font-semibold disabled:bg-sky-300">
                {isLoading ? 'Saving...' : 'Add Product'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 