import { OrderConfirmation } from '@/components/store/OrderConfirmation.jsx';

// Confirmation is a page, not a modal. It has a URL you can reload, bookmark,
// or forward to whoever is paying, and closing a tab no longer takes the order
// number with it. Nothing here is public, so it stays out of the index.
export const metadata = { title: 'Order confirmed', robots: { index: false, follow: false } };

export default function OrderConfirmedPage({ searchParams }) {
  const ids = String(searchParams?.ids || '')
    .split(',')
    .map(n => Number(n.trim()))
    .filter(n => Number.isInteger(n) && n > 0);
  return <OrderConfirmation ids={ids} />;
}
