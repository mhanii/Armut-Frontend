import { Suspense } from 'react';
import { ResetPasswordView } from '@/components/store/ResetPasswordView.jsx';

export const metadata = { title: 'Choose a New Password', robots: { index: false } };

// useSearchParams needs a Suspense boundary or the whole route opts out of
// static rendering at build time.
export default function ResetPasswordPage() {
  return <Suspense><ResetPasswordView /></Suspense>;
}
