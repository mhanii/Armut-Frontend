"use client";
import { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppContext } from "@/context/AppContext";
import { getProductsForVendor } from "@/lib/services/productService";
import { getVendorOrders } from "@/lib/services/userService";

export default function VendorDashboard() {
  const { isVendor, user } = useContext(AppContext);
  const router = useRouter();
  const [vendorProducts, setVendorProducts] = useState([]);
  const [vendorOrders, setVendorOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isVendor) router.replace("/");
    else {
      // Fetch both products and orders
      Promise.all([
        getProductsForVendor(user.token).then(setVendorProducts),
        getVendorOrders(user.token).then(setVendorOrders)
      ]).finally(() => setLoading(false));
    }
  }, [isVendor, router, user]);

  // Calculate real stats from vendor orders
  const calculateStats = () => {
    if (!vendorOrders.length) {
      return [
        { label: "Total Products", value: vendorProducts.length },
        { label: "Total Sales (30d)", value: "$0.00" },
        { label: "New Orders (24h)", value: 0 },
      ];
    }

    // Calculate total sales (sum of all order totals)
    const totalSales = vendorOrders.reduce((sum, order) => {
      return sum + parseFloat(order.total || 0);
    }, 0);

    // Calculate orders in last 24 hours
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentOrders = vendorOrders.filter(order => {
      const orderDate = new Date(order.created_at);
      return orderDate >= oneDayAgo;
    });

    return [
      { label: "Total Products", value: vendorProducts.length },
      { label: "Total Sales", value: `$${totalSales.toFixed(2)}` },
      { label: "New Orders (24h)", value: recentOrders.length },
    ];
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Vendor Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="w-20 h-8 bg-gray-200 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg shadow-sm">
          <h3 className="text-xl font-bold p-6 border-b border-slate-200">Product Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50">
                <tr className="text-sm font-semibold text-slate-600">
                  <th className="p-4">Product</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Price</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => (
                  <tr key={i} className="border-b border-slate-200 last:border-0">
                    <td className="p-4">
                      <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="w-12 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="w-16 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                    <td className="p-4">
                      <div className="w-20 h-4 bg-gray-200 rounded animate-pulse"></div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Vendor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {stats.map((s) => (
          <div key={s.label} className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold text-slate-500">{s.label}</h3>
            <p className="text-4xl font-bold mt-2">{s.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-sm">
        <h3 className="text-xl font-bold p-6 border-b border-slate-200">Product Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr className="text-sm font-semibold text-slate-600">
                <th className="p-4">Product</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Rating</th>
                <th className="p-4">Price</th>
              </tr>
            </thead>
            <tbody>
              {vendorProducts.map((p) => (
                <tr key={p.id} className="border-b border-slate-200 last:border-0 hover:bg-slate-50">
                  <td className="p-4 font-medium text-slate-800">{p.name}</td>
                  <td className="p-4 text-slate-700">{p.stock}</td>
                  <td className="p-4 text-slate-700">{p.rating}</td>
                  <td className="p-4 text-slate-700">${p.price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 