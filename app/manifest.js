import { SITE } from '@/lib/site.js';

export default function manifest() {
  return {
    name: 'Armut — Handcrafted Turkish Furniture',
    short_name: 'Armut',
    description: 'Solid hardwood furniture handcrafted in Türkiye, delivered and assembled at your home.',
    start_url: '/',
    id: SITE + '/',
    display: 'standalone',
    background_color: '#f4f0e9',
    theme_color: '#231d17',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
