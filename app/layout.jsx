import { Inter } from 'next/font/google';
import { AppProvider } from '@/context/AppProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import GlobalElements from '@/components/GlobalElements';
import '@/styles/globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Armut - Modern Furniture Store',
  description: 'A modern furniture store built with Next.js',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
            <GlobalElements />
          </div>
        </AppProvider>
      </body>
    </html>
  );
} 