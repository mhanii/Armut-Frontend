import { getCategories } from '@/lib/services/categoryService';
import ProductResults from '@/components/ProductResults';

export const metadata = {
  title: 'Products | Armut',
  description: 'Browse our collection of furniture and home accessories.',
};

export default async function ProductsPage() {
  const categories = await getCategories();
    return (
        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-6">Our Collection</h2>
      {/* Filters and search bar */}
      <ProductResults categories={categories} />
        </div>
    );
} 