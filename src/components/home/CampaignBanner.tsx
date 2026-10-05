'use client';

import React, { useState, useEffect } from 'react';
import { AdBanner } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

const DEFAULT_ADS: AdBanner[] = [
  {
    id: 1,
    title: 'Viaje Octubre: Compras en Vivo desde Miami',
    subtitle: 'Te envío fotos y precios en directo desde tiendas oficiales de USA.',
    tag: 'Campaña Oficial',
    btn_text: 'Pedir por link',
    link: '#pedir-link',
    img: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80',
    active: true,
  },
  {
    id: 2,
    title: 'Ofertas Sephora & Ulta Beauty',
    subtitle: 'Las marcas de skincare y maquillaje más buscadas con precio final garantizado.',
    tag: 'Belleza USA',
    btn_text: 'Ver catálogo',
    link: '#catalogo',
    img: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    active: true,
  },
  {
    id: 3,
    title: 'Apple Store & Best Buy: Cupos Limitados',
    subtitle: 'Trae tu iPhone, MacBook o AirPods con recibo y garantía original de USA.',
    tag: 'Tecnología',
    btn_text: 'Reservar cupo',
    link: '#pedir-link',
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80',
    active: true,
  },
];

export function CampaignBanner() {
  const [ads, setAds] = useState<AdBanner[]>(DEFAULT_ADS);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('ads')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          setAds(data);
        }
      } catch (err) {
        console.warn('Error al cargar banners de Supabase:', err);
      }
    };

    fetchAds();
  }, []);

  const displayedAds = expanded ? ads : ads.slice(0, 3);

  return (
    <section id="seccion-publicidad" className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-500 uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">campaign</span>
            <span>Campañas & Promociones de Temporada</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            Banners y Publicidad Oficial
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Campañas activas gestionadas directamente por Johan Tovar para este viaje a USA.
          </p>
        </div>
        {ads.length > 3 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="px-4 py-2.5 rounded-2xl bg-white dark:bg-darkCard text-slate-800 dark:text-slate-200 text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-all flex items-center gap-1.5 shadow-card-subtle border border-slate-200/80 dark:border-darkBorder"
          >
            <span className="material-symbols-outlined text-base">visibility</span>
            <span>{expanded ? 'Ver menos' : 'Ver más publicidad'}</span>
          </button>
        )}
      </div>

      {/* Grilla Dinámica de Campañas Activas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayedAds.map((ad, idx) => (
          <div
            key={ad.id || idx}
            className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 group hover:border-amber-500/50 shadow-xl transition-all flex flex-col justify-between min-h-[220px] p-6 text-white"
          >
            {/* Imagen de Fondo */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={ad.img}
              alt={ad.title}
              className="absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 group-hover:scale-105 transition-all duration-300 pointer-events-none"
            />
            <div className="relative z-10 space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                {ad.tag || 'Campaña Oficial'}
              </span>
              <h3 className="text-lg font-black leading-snug">{ad.title}</h3>
              {ad.subtitle && (
                <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">{ad.subtitle}</p>
              )}
            </div>

            <div className="relative z-10 pt-4">
              <a
                href={ad.link || '#catalogo'}
                className="inline-flex items-center gap-1.5 text-xs font-black text-amber-400 hover:text-amber-300 transition-colors"
              >
                <span>{ad.btn_text || ad.btnText || 'Ver productos'}</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
