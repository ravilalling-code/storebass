'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface ProductCardProps {
  product: Product;
  badge?: string;
  badgeColor?: string;
}

export function ProductCard({ product, badge, badgeColor }: ProductCardProps) {
  const { addToCart } = useCart();
  const [animating, setAnimating] = useState(false);

  const handleAdd = () => {
    addToCart(product.name, product.price);
    setAnimating(true);
    setTimeout(() => setAnimating(false), 900);
  };

  const isSoldOut = product.delivery?.toLowerCase().includes('agotado');

  return (
    <div className="product-item bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder rounded-3xl p-4 shadow-card-subtle flex flex-col justify-between group hover:border-amber-500/40 transition-all">
      <div>
        <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square mb-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.img}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
              isSoldOut ? 'grayscale group-hover:grayscale-0' : ''
            }`}
          />
          {badge && (
            <span
              className={`absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-white text-[10px] font-black uppercase tracking-wider shadow-sm ${
                badgeColor || 'bg-rose-600'
              }`}
            >
              {badge}
            </span>
          )}
        </div>

        <span className="text-[11px] font-bold text-slate-400 uppercase">{product.category}</span>
        <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 mt-0.5">
          {product.name}
        </h3>

        <div className="mt-2.5 flex items-baseline gap-2">
          {product.regularPrice && product.regularPrice > product.price && (
            <span className="text-slate-400 text-xs line-through">
              S/ {product.regularPrice.toFixed(2)}
            </span>
          )}
          <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
            S/ {product.price.toFixed(2)}
          </span>
        </div>

        <div className="mt-2 space-y-1">
          {product.delivery?.toLowerCase().includes('stock') ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>En stock en Lima</span>
            </span>
          ) : isSoldOut ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-500/15 text-slate-500 dark:text-slate-400 border border-slate-500/30">
              <span>Agotado</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
              <span className="material-symbols-outlined text-[11px]">flight_land</span>
              <span>Llega el 29 de Octubre</span>
            </span>
          )}

          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="material-symbols-outlined text-xs text-slate-400">schedule</span>
            <span className="truncate">{product.delivery}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        {isSoldOut ? (
          <a
            href="https://wa.me/51960759244?text=Hola%20Johan,%20deseo%20que%20me%20avises%20cuando%20tengas%20disponible:%20"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-500 hover:text-slate-950 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-sm">notifications</span>
            <span>Avísame del próximo viaje</span>
          </a>
        ) : (
          <button
            onClick={handleAdd}
            className={`w-full py-2.5 font-bold rounded-xl text-xs transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 ${
              animating
                ? 'bg-emerald-500 text-white scale-95'
                : 'bg-slate-900 dark:bg-white text-white dark:text-slate-950 hover:bg-amber-500 dark:hover:bg-amber-400'
            }`}
          >
            <span className="material-symbols-outlined text-sm">
              {animating ? 'check_circle' : 'add_shopping_cart'}
            </span>
            <span>{animating ? '¡Agregado al carrito!' : 'Agregar al carrito'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
