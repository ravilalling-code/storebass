'use client';

import React from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export function MobileBottomNav() {
  const { count, toggleCart } = useCart();

  const defaultWaUrl = `https://wa.me/51960759244?text=${encodeURIComponent(
    `👋 *STORE BASS — PERSONAL SHOPPER USA* 🇺🇸✈️🇵🇪\n─────────────────────────\n¡Hola Johan Tovar! Te escribo desde la tienda web Store Bass. Deseo hacerte una consulta sobre compras en tiendas de USA para el viaje del 20 al 29 de Octubre. 🙌`
  )}`;

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 w-full z-40 bg-white/95 dark:bg-darkCard/95 backdrop-blur-lg border-t border-slate-200/90 dark:border-darkBorder px-2 pt-1.5 pb-[max(8px,env(safe-area-inset-bottom))] shadow-2xl flex items-center justify-around text-[10px] font-bold text-slate-600 dark:text-slate-400">
      <Link href="/" className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-amber-500 active:scale-90 transition-all">
        <span className="material-symbols-outlined text-xl">home</span>
        <span>Inicio</span>
      </Link>
      <a href="#catalogo" className="flex flex-col items-center gap-0.5 py-1 px-2.5 hover:text-amber-500 active:scale-90 transition-all">
        <span className="material-symbols-outlined text-xl">storefront</span>
        <span>Catálogo</span>
      </a>
      <a href="#pedir-link" className="flex flex-col items-center gap-0.5 py-1 px-2.5 hover:text-amber-500 active:scale-90 transition-all">
        <span className="material-symbols-outlined text-xl">add_link</span>
        <span>Pedir Link</span>
      </a>
      <button
        onClick={toggleCart}
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 hover:text-amber-500 active:scale-90 transition-all relative"
      >
        <span className="material-symbols-outlined text-xl">shopping_cart</span>
        <span className="absolute top-0 right-1.5 bg-amber-500 text-slate-950 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center">
          {count}
        </span>
        <span>Carrito</span>
      </button>
      <a
        href={defaultWaUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Habla por WhatsApp"
        className="flex flex-col items-center gap-0.5 py-1 px-2.5 text-emerald-500 hover:text-emerald-400 active:scale-90 transition-all"
      >
        <WhatsAppIcon className="w-5 h-5 text-emerald-500" />
        <span>WhatsApp</span>
      </a>
    </nav>
  );
}
