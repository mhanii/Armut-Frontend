import HeroSlider from '@/components/HeroSlider';
import { getBanners } from '@/lib/services/bannerService';
import CategoriesSection from '@/components/CategoriesSection';
import DiscountSection from '@/components/DiscountSection';
import FeaturedProducts from '@/components/FeaturedProducts';
import { getCategories } from '@/lib/services/categoryService';
import { getFeaturedProducts, getDiscountProducts } from '@/lib/services/productService';
import ClientOnly from '@/components/ui/ClientOnly';
import { useContext } from 'react';
import { AppContext } from '@/context/AppContext';

export const metadata = {
  title: 'Home | Armut',
  description: 'Discover the best furniture, stores, and deals at Armut. Shop now for exclusive discounts and top-rated products.',
  openGraph: {
    title: 'Home | Armut',
    description: 'Discover the best furniture, stores, and deals at Armut. Shop now for exclusive discounts and top-rated products.',
    url: 'https://yourdomain.com/',
    siteName: 'Armut',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Armut Home',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
};

export default async function HomePage() {
  const banners = await getBanners();
  const categories = await getCategories();
  let featured = await getFeaturedProducts();
  let discounted = await getDiscountProducts();
  // Extract .results if present
  featured = Array.isArray(featured) ? featured : (Array.isArray(featured?.results) ? featured.results : []);
  discounted = Array.isArray(discounted) ? discounted : (Array.isArray(discounted?.results) ? discounted.results : []);
  return (
    <>
      <HeroSlider banners={banners} />
      <CategoriesSection categories={categories} />
      <FeaturedProducts products={featured} />
      <DiscountSection discountedProducts={discounted} />
    </>
  );
}

function FeaturedProductsWrapper({ products }) {
  const { onAddToCart } = useContext(AppContext);
  return <FeaturedProducts products={products} onAddToCart={onAddToCart} />;
}

function DiscountSectionWrapper({ discountedProducts }) {
  const { onAddToCart } = useContext(AppContext);
  return <DiscountSection discountedProducts={discountedProducts} onAddToCart={onAddToCart} />;
} 