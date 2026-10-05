'use client';

import React, { useState } from 'react';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { INITIAL_PRODUCTS } from '@/data/initialCatalog';
import { Product } from '@/lib/types';

export function FeaturedOffers() {
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const offerProducts = INITIAL_PRODUCTS.slice(0, 4);

  const badges = [
    { badge: 'Oferta -29%', color: 'bg-rose-600' },
    { badge: 'Oferta -18%', color: 'bg-rose-600' },
    { badge: 'Oferta -30%', color: 'bg-rose-600' },
    { badge: 'Sin cupos', color: 'bg-slate-800' },
  ];

  return (
    <section id="ofertas" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-7 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-rose-500 uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">local_fire_department</span>
            <span>Descuentos encontrados en tiendas de USA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            Ofertas de este viaje
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Precios especiales de oportunidad que encontré en tiendas oficiales para traer en mi regreso.
          </p>
        </div>
        <a href="#catalogo" className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1">
          <span>Ver catálogo completo</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </a>
      </div>

      {/* Grilla de 4 Tarjetas de Ofertas en 2 columnas móvil / 4 columnas desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {offerProducts.map((prod, idx) => (
          <ProductCard
            key={prod.id}
            product={prod}
            badge={badges[idx]?.badge}
            badgeColor={badges[idx]?.color}
            onOpenDetail={setSelectedProductForModal}
          />
        ))}
      </div>

      {/* Modal de Detalle de Producto de Oferta */}
      <ProductDetailModal
        product={selectedProductForModal}
        isOpen={!!selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
      />
    </section>
  );
}
