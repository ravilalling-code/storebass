import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers/Providers';
import { CatalogAdminV2 } from '@/components/admin/CatalogAdminV2';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://storebass.vercel.app'),
  title: 'STORE BASS — Shopper & Courier | Comprador que viaja a USA',
  description: 'Tienda Online peruana de artículos originales importados de USA. Voy a USA, dime qué quieres y te lo traigo con precio final garantizado y aduanas incluidas.',
  keywords: ['StoreBass', 'Shopper USA', 'Courier Peru', 'Compras en USA', 'Personal Shopper Lima', 'Importaciones USA'],
  authors: [{ name: 'Johan Tovar', url: 'https://wa.me/51960759244' }],
  icons: { icon: '/Storebass.jpg', apple: '/Storebass.jpg' },
  openGraph: {
    title: 'STORE BASS — Shopper & Courier Perú',
    description: 'Voy a USA. Dime qué quieres y te lo traigo. Elige de mi catálogo o pega el link de lo que buscas.',
    images: ['/Storebass.jpg'],
    locale: 'es_PE',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          (function() {
            try {
              var saved = localStorage.getItem('storebass_theme');
              if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) document.documentElement.classList.add('dark');
              else document.documentElement.classList.remove('dark');
            } catch(e) {}
          })();
        ` }} />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=block" />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans bg-slate-50 dark:bg-darkBg text-slate-800 dark:text-slate-100 antialiased min-h-screen selection:bg-amber-500 selection:text-slate-950 transition-colors duration-200`}>
        <Providers>
          {children}
          <CatalogAdminV2 />
        </Providers>
      </body>
    </html>
  );
}
