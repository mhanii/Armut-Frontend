import { useRef } from 'react';
import CustomImage from './CustomImage';

export default function ImageUpload({
  images = [],
  colors = [],
  newImageColor = '',
  setNewImageColor = () => {},
  onAddImage = () => {},
  onRemoveImage = () => {},
  imagePreview = null,
  setImagePreview = () => {},
  imageFile = null,
  setImageFile = () => {},
  dragActive = false,
  setDragActive = () => {},
  label = 'Product Images',
  addButtonLabel = 'Add Image',
}) {
  const fileInputRef = useRef();

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

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">{label}</h2>
      <div className="space-y-3 mb-6">
        {images.map((img) => (
          <div key={img.url} className="flex items-center justify-between gap-3 bg-slate-50 p-2 rounded-md">
            <CustomImage src={img.url} alt="Preview" width={64} height={64} className="w-16 h-16 object-cover rounded" />
            <div className="flex-grow text-sm overflow-hidden">
              <p className="font-semibold">{img.color}</p>
              <p className="text-slate-500 truncate text-xs">{img.url.startsWith('blob:') ? 'Local file preview' : img.url}</p>
            </div>
            <button type="button" onClick={() => onRemoveImage(img.url)} className="p-2 text-slate-400 hover:text-red-600 rounded-full hover:bg-red-100">✕</button>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t pt-4">
        <h3 className="font-semibold text-slate-700">Add New Image</h3>
        <div className="mb-2">
          <label className="text-sm font-medium text-slate-600">1. Assign to Color</label>
          <select value={newImageColor} onChange={e => setNewImageColor(e.target.value)} className="w-full mt-1 p-2 border rounded bg-white">
            <option value="">Select a color...</option>
            {colors.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div
          className={`relative border-2 ${dragActive ? 'border-sky-500 bg-sky-50' : 'border-dashed border-slate-300'} rounded-md p-2 flex flex-col items-center justify-center cursor-pointer transition-all-fast`}
          onDrop={handleImageDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{ minHeight: '60px' }}
        >
          {imagePreview ? (
            <>
              <CustomImage src={imagePreview} alt="Preview" width={120} height={120} className="mb-2 rounded object-cover" />
              <button type="button" className="text-xs text-red-500 underline mb-2" onClick={e => { e.stopPropagation(); setImagePreview(null); setImageFile(null); }}>Remove</button>
            </>
          ) : (
            <span className="text-slate-500 text-sm">Drag & drop an image here, or click to select</span>
          )}
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
        </div>
        <button type="button" onClick={onAddImage} className="mt-2 px-4 py-2 bg-sky-500 text-white rounded-md hover:bg-sky-600 disabled:bg-gray-400" disabled={!imagePreview || !newImageColor}>{addButtonLabel}</button>
      </div>
    </div>
  );
} 