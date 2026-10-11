import { StoreProvider } from '@/components/store/StoreProvider.jsx';

export default function StoreLayout({ children }) {
  return <StoreProvider>{children}</StoreProvider>;
}
