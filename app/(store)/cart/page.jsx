import { CartView } from '@/components/store/CartView.jsx';

export const metadata = { title: 'Your Cart', robots: { index: false } };

export default function CartPage() {
  return <CartView />;
}
