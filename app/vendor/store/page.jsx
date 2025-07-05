"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";

// Mock store info
const mockStore = {
  name: 'Armut Modern Designs',
  description: 'A modern furniture store.',
  address: '123 Main St, Cityville',
};

export default function VendorStore() {
  const { isVendor } = useContext(AppContext);
  const router = useRouter();
  const [form, setForm] = useState(mockStore);
  useEffect(() => { if (!isVendor) router.replace("/"); }, [isVendor, router]);

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const handleSubmit = e => { e.preventDefault(); alert('Store info updated! (mock)'); };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">My Store</h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-sm space-y-4">
        <div>
          <label className="block font-semibold mb-1">Store Name</label>
          <input name="name" value={form.name} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full p-2 border rounded" rows={4} />
        </div>
        <div>
          <label className="block font-semibold mb-1">Address</label>
          <input name="address" value={form.address} onChange={handleChange} className="w-full p-2 border rounded" required />
        </div>
        <button type="submit" className="w-full py-2 bg-sky-600 text-white rounded hover:bg-sky-700 font-semibold">Save</button>
      </form>
    </div>
  );
} 