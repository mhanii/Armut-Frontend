import { Suspense } from 'react';
import { VerifyEmailView } from '@/components/store/VerifyEmailView.jsx';

export const metadata = { title: 'Confirm Your Email', robots: { index: false } };

// useSearchParams needs a Suspense boundary or the whole route opts out of
// static rendering at build time.
export default function VerifyEmailPage() {
  return <Suspense><VerifyEmailView /></Suspense>;
}
