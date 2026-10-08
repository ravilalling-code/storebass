'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdBanner } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { INITIAL_TRENDS } from './TrendsCarousel';

interface HeroBannerProps {
  onSelectCategory?: (category: string) => void;
}

export function HeroBanner({ onSelectCategory: _onSelectCategory }: HeroBannerProps) {
  const [trends, setTrends] = useState<AdBanner[]>(INITIAL_TRENDS);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Helper para purgar imágenes obsoletas de carteras
  const sanitizeBanners = (items: AdBanner[]) =>
    items.filter(
      (item) =>
        item.active !== false &&
        !item.img?.includes('photo-1544816155-12df9643f363') &&
        !item.img?.includes('photo-1555529669-e69e7aa0ba9a')
    );

  const loadTrendsData = async () => {
    try {
      const stored = localStorage.getItem('storebass_ads');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizeBanners(parsed);
          if (sanitized.length > 0) setTrends(sanitized);
        }
      }

      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const cleanData = sanitizeBanners(data);
        if (cleanData.length > 0) {
          setTrends(cleanData);
          localStorage.setItem('storebass_ads', JSON.stringify(cleanData));
        }
      }
    } catch (err) {
      console.warn('[HeroBanner] Error al cargar tendencias desde Supabase:', err);
    }
  };

  useEffect(() => {
    loadTrendsData();
    const handleUpdate = () => loadTrendsData();
    window.addEventListener('storebass_ads_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('storebass_ads_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (isPaused || trends.length <= 1) return;
    timerRef.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % trends.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, trends.length]);

  useEffect(() => {
    if (currentSlide >= trends.length) setCurrentSlide(0);
  }, [currentSlide, trends.length]);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800/80 shadow-2xl p-6 sm:p-10 lg:p-12">
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-float" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="animate-fade-up stagger-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-400 text-[11px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Comprador que viaja a USA</span>
            </div>
            <h1 className="animate-fade-up stagger-2 text-3xl sm:text-5xl lg:text-[52px] font-black text-white tracking-tight leading-[1.08] font-display">
              Voy a USA. <span className="text-amber-400">Dime qué quieres</span> y te lo traigo.
            </h1>
            <p className="animate-fade-up stagger-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              Compro tus encargos en tiendas oficiales de USA. Precios garantizados en soles con fecha de entrega clara en Lima.
            </p>
            <div className="animate-fade-up stagger-4 flex flex-wrap items-center gap-3 pt-2">
              <a href="#catalogo" className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 sm:px-8 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/25 inline-flex items-center gap-2 active:scale-[0.97]">
                <span>Explorar catálogo del viaje</span>
                <span className="material-symbols-outlined text-base">arrow_downward</span>
              </a>
              <a href="#pedir-link" className="bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 font-bold px-6 sm:px-7 py-3.5 rounded-2xl text-xs sm:text-sm inline-flex items-center gap-2 active:scale-[0.97]">
                <span className="material-symbols-outlined text-base text-amber-400">link</span>
                <span>Pedir por link</span>
              </a>
            </div>
            <div className="animate-fade-up stagger-5 pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs text-amber-400">shield_lock</span>Garantía de compra oficial</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs text-blue-400">local_shipping</span>Entrega en Lima y todo Perú</span>
            </div>
          </div>

          <div className="lg:col-span-5 card-3d" onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)}>
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl bg-slate-900 aspect-[4/5] sm:aspect-[5/4] lg:aspect-[4/5]">
              {trends.map((slide, idx) => (
                <div key={slide.id || idx} className="absolute inset-0" aria-hidden={idx !== currentSlide} style={{opacity: idx === currentSlide ? 1 : 0, transition: 'opacity 700ms cubic-bezier(0.23,1,0.32,1)', zIndex: idx === currentSlide ? 1 : 0}}>
                  {/* Imagen completa del carrusel: sin badge, texto, CTA, contador ni flechas. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={slide.img} alt={slide.title || `Imagen ${idx + 1}`} className="w-full h-full object-contain object-center bg-slate-900" loading={idx === 0 ? 'eager' : 'lazy'} decoding="async" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
