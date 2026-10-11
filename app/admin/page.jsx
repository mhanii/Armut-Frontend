import { AdminConsole } from '@/components/admin/AdminConsole.jsx';

export const metadata = {
  title: 'Admin Console',
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}
