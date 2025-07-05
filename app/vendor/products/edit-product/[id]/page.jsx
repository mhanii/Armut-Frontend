"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import { getProductsForVendor } from "@/lib/services/productService";
import { XIcon } from '@/components/ui/Icons';
import ImageUpload from '@/components/ui/ImageUpload';

export default function EditProductPage() {
  const { isVendor, user } = useContext(AppContext);
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const [product, setProduct] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#000000');
  const [newImageColor, setNewImageColor] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    if (!isVendor) router.replace("/");
    else {
      getProductsForVendor().then(products => {
        const found = products.find(p => String(p.id) === String(id));
        let safeProduct = found ? { ...found } : null;
        if (safeProduct) {
          if (!safeProduct.deliveryOptions || typeof safeProduct.deliveryOptions !== 'object') {
            safeProduct.deliveryOptions = { standard: 0, express: 0 };
          } else {
            safeProduct.deliveryOptions = {
              standard: safeProduct.deliveryOptions.standard ?? 0,
              express: safeProduct.deliveryOptions.express ?? 0
            };
          }
          if (!safeProduct.customizationOptions || typeof safeProduct.customizationOptions !== 'object') {
            safeProduct.customizationOptions = { colors: [] };
          } else if (!Array.isArray(safeProduct.customizationOptions.colors)) {
            safeProduct.customizationOptions.colors = [];
          }
          if (!Array.isArray(safeProduct.images)) {
            safeProduct.images = [];
          }
        }
        setProduct(safeProduct);
        setForm(safeProduct ? { ...safeProduct } : null);
        setLoading(false);
      });
    }
  }, [isVendor, router, id]);

  useEffect(() => {
    return () => {
      if (form && form.images) {
        form.images.forEach(image => {
          if (image.url && image.url.startsWith('blob:')) {
            URL.revokeObjectURL(image.url);
          }
        });
      }
    };
  }, [form?.images]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
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
  const handleAddImage = () => {
    if (!imageFile) {
      alert('Please select an image file.');
      return;
    }
    if (!newImageColor) {
      alert('Please select a color to assign to the image.');
      return;
    }
    const newImage = {
      color: newImageColor,
      url: imagePreview
    };
    setForm(prev => ({ ...prev, images: [...prev.images, newImage] }));
    setNewImageColor('');
    setImageFile(null);
    setImagePreview(null);
  };
  const handleRemoveImage = (urlToRemove) => {
    if (urlToRemove.startsWith('blob:')) {
      URL.revokeObjectURL(urlToRemove);
    }
    const newImages = form.images.filter(img => img.url !== urlToRemove);
    setForm(prev => ({ ...prev, images: newImages }));
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    alert('Product updated! (mock)');
    setIsLoading(false);
    router.push('/vendor/products');
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!form) return <div className="p-8">Product not found.</div>;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Edit Product</h1>
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Core Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-600">Name</label><input type="text" name="name" value={form.name} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required /></div>
                <div><label className="block text-sm font-medium text-slate-600">Category</label><select name="category" value={form.category} onChange={handleChange} className="mt-1 w-full p-2 border rounded bg-white"><option>Living Room</option><option>Dining</option><option>Bedroom</option><option>Storage</option></select></div>
                <div><label className="block text-sm font-medium text-slate-600">Stock</label><input type="number" name="stock" value={form.stock} onChange={handleChange} className="mt-1 w-full p-2 border rounded" /></div>
              </div>
              <div className="mt-4"><label className="block text-sm font-medium text-slate-600">Description</label><textarea name="description" value={form.description} onChange={handleChange} rows="4" className="mt-1 w-full p-2 border rounded"></textarea></div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Pricing & Delivery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-slate-600">Price ($)</label><input type="number" step="0.01" name="price" value={form.price} onChange={handleChange} className="mt-1 w-full p-2 border rounded" required /></div>
                <div><label className="block text-sm font-medium text-slate-600">Discount Price ($)</label><input type="number" step="0.01" name="discountPrice" value={form.discountPrice} onChange={handleChange} className="mt-1 w-full p-2 border rounded" /></div>
                <div><label className="block text-sm font-medium text-slate-600">Standard Delivery ($)</label><input type="number" step="0.01" name="standard" value={form.deliveryOptions.standard} onChange={handleDeliveryChange} className="mt-1 w-full p-2 border rounded" /></div>
                <div><label className="block text-sm font-medium text-slate-600">Express Delivery ($)</label><input type="number" step="0.01" name="express" value={form.deliveryOptions.express} onChange={handleDeliveryChange} className="mt-1 w-full p-2 border rounded" /></div>
              </div>
            </div>
          </div>
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Custom Colors</h2>
              <div className="flex items-end gap-2 mb-4">
                <div className="flex-grow"><label className="text-sm font-medium text-slate-600">Name</label><input type="text" placeholder="e.g. Navy Blue" value={newColorName} onChange={e => setNewColorName(e.target.value)} className="w-full mt-1 p-2 border rounded" /></div>
                <div><label className="text-sm font-medium text-slate-600">Hex</label><input type="color" value={newColorHex} onChange={e => setNewColorHex(e.target.value)} className="w-12 h-10 mt-1 p-1 border rounded" /></div>
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
              <ImageUpload
                images={form.images}
                colors={form.customizationOptions.colors}
                newImageColor={newImageColor}
                setNewImageColor={setNewImageColor}
                onAddImage={handleAddImage}
                onRemoveImage={handleRemoveImage}
                imagePreview={imagePreview}
                setImagePreview={setImagePreview}
                imageFile={imageFile}
                setImageFile={setImageFile}
                dragActive={dragActive}
                setDragActive={setDragActive}
                label="Product Images"
                addButtonLabel="Add Image"
              />

            <div className="bg-white p-6 rounded-lg shadow-sm flex items-center justify-end space-x-4">
              <button type="submit" disabled={isLoading} className="w-full py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 font-semibold disabled:bg-sky-300">{isLoading ? 'Saving...' : 'Save'}</button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
} 