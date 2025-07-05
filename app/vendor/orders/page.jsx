"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import { TrashIcon } from '@/components/ui/Icons';
import { mockOrders } from '@/lib/data';
import CustomImage from '@/components/ui/CustomImage';
import { getVendorOrders } from '@/lib/services/userService';

// Mock orders data
const initialOrders = [
  { id: 101, customer: "Jane Doe", total: 1299.99, status: "Pending" },
  { id: 102, customer: "John Smith", total: 249.0, status: "Shipped" },
  { id: 103, customer: "Alice Johnson", total: 499.0, status: "Delivered" },
];

// Add EyeIcon for view if not present
const EyeIcon = ({ c }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={c}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

export default function VendorOrders() {
  const { isVendor, user } = useContext(AppContext);
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [viewOrder, setViewOrder] = useState(null);
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    if (!isVendor) router.replace("/");
    else {
      getVendorOrders(user.token).then(setOrders);
    }
  }, [isVendor, router, user]);

  const handleDelete = (id) => {
    setOrders(orders => orders.filter(o => o.id !== id));
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-4 sm:mb-6">Orders</h1>
      <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-xs sm:text-sm text-slate-500">
              <th className="p-2 sm:p-4">Order ID</th>
              <th className="p-2 sm:p-4">Customer</th>
              <th className="p-2 sm:p-4">Total</th>
              <th className="p-2 sm:p-4">Status</th>
              <th className="p-2 sm:p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <>
                <tr key={o.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                  <td className="p-2 sm:p-4 cursor-pointer text-xs sm:text-sm" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>{o.id}</td>
                  <td className="p-2 sm:p-4 cursor-pointer text-xs sm:text-sm" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>{o.customer}</td>
                  <td className="p-2 sm:p-4 cursor-pointer text-xs sm:text-sm" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>${o.total.toFixed(2)}</td>
                  <td className="p-2 sm:p-4 cursor-pointer text-xs sm:text-sm" onClick={() => setExpandedOrderId(expandedOrderId === o.id ? null : o.id)}>{o.status}</td>
                  <td className="p-2 sm:p-4 flex gap-1 sm:gap-2">
                    <button title="View" onClick={() => setViewOrder(o)} className="text-sky-600 hover:text-sky-800"><EyeIcon c="w-4 h-4 sm:w-5 sm:h-5" /></button>
                    <button title="Delete" onClick={() => handleDelete(o.id)} className="text-red-600 hover:text-red-800"><TrashIcon c="w-4 h-4 sm:w-5 sm:h-5" /></button>
                  </td>
                </tr>
                {expandedOrderId === o.id && (
                  <tr>
                    <td colSpan={5} className="bg-slate-50 px-4 sm:px-8 py-3 sm:py-4">
                      <div className="space-y-2">
                        {o.items.map(item => (
                          <div key={item.product.id} className="flex items-center gap-2 sm:gap-4 pl-2 sm:pl-4 py-2 border-b last:border-b-0">
                            <CustomImage src={item.product.imageUrl} alt={item.product.name} width={40} height={40} className="rounded object-cover border flex-shrink-0" />
                            <div className="flex flex-col text-xs text-gray-700 min-w-0 flex-1">
                              <span className="font-semibold truncate">{item.product.name}</span>
                              <span>Quantity: {item.quantity}</span>
                              <span>Unit Price: ${parseFloat(item.product.price).toFixed(2)}</span>
                              {item.product.discountPrice && <span>Discounted: ${parseFloat(item.product.discountPrice).toFixed(2)}</span>}
                            </div>
                            <span className="ml-auto text-xs sm:text-sm font-medium">Total: ${(parseFloat(item.product.price) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      {viewOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-4 sm:p-8 rounded-lg shadow-lg max-w-md w-full relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-black text-xl sm:text-2xl" onClick={() => setViewOrder(null)}>&times;</button>
            <h2 className="text-lg sm:text-2xl font-bold mb-3 sm:mb-4">Order #{viewOrder.id}</h2>
            <p className="text-sm sm:text-base"><b>Customer:</b> {viewOrder.customer}</p>
            <p className="text-sm sm:text-base"><b>Total:</b> ${viewOrder.total.toFixed(2)}</p>
            <p className="text-sm sm:text-base"><b>Status:</b> {viewOrder.status}</p>
            <div className="mt-4 sm:mt-6 text-right">
              <button className="px-3 sm:px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700 font-semibold text-sm sm:text-base" onClick={() => setViewOrder(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 