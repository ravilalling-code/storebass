'use client';

import React, { useEffect, useState } from 'react';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { Product } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function FeaturedOffers() {
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);
  const [offerProducts, setOfferProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadOffers = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data, error } = await supabase.from('products').select('*').eq('active', true).eq('offer_active', true).order('updated_at', { ascending: false }).limit(8);
      if (error) { console.warn('No se pudieron cargar ofertas:', error); return; }
      setOfferProducts((data || []).map((p: any) => ({ ...p, regularPrice: Number(p.regular_price ?? p.price), price: Number(p.offer_price ?? p.price), offer_price: p.offer_price == null ? null : Number(p.offer_price) })));
    };
    void loadOffers();
    window.addEventListener('storebass_products_updated', loadOffers);
    return () => window.removeEventListener('storebass_products_updated', loadOffers);
  }, []);

  if (offerProducts.length === 0) return null;

  return (
    <section id="ofertas" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-7 gap-2">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-rose-500 uppercase tracking-wider mb-1"><span className="material-symbols-outlined text-base">local_fire_department</span><span>Precios especiales activos</span></div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">Ofertas de este viaje</h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Solo aparecen productos cuya oferta fue activada desde el CRM.</p>
        </div>
        <a href="#catalogo" className="text-xs font-bold text-amber-500 hover:underline flex items-center gap-1"><span>Ver catálogo completo</span><span className="material-symbols-outlined text-sm">arrow_forward</span></a>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {offerProducts.map(prod => {
          const regular = Number(prod.regular_price ?? prod.regularPrice ?? prod.price);
          const discount = regular > prod.price ? Math.round((1 - prod.price / regular) * 100) : 0;
          return <ProductCard key={prod.id} product={prod} badge={discount > 0 ? `Oferta -${discount}%` : 'Oferta'} badgeColor="bg-rose-600" onOpenDetail={setSelectedProductForModal} />;
        })}
      </div>
      <ProductDetailModal product={selectedProductForModal} isOpen={!!selectedProductForModal} onClose={() => setSelectedProductForModal(null)} />
    </section>
  );
}
