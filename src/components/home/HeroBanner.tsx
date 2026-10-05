'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdBanner } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { INITIAL_TRENDS } from './TrendsCarousel';

interface HeroBannerProps {
  onSelectCategory?: (category: string) => void;
}

export function HeroBanner({ onSelectCategory }: HeroBannerProps) {
  const [trends, setTrends] = useState<AdBanner[]>(INITIAL_TRENDS);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Carga dinámica de imágenes de Tendencias desde Supabase y localStorage (administrable desde el CRM)
  const loadTrendsData = async () => {
    try {
      const stored = localStorage.getItem('storebass_ads');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const activeOnly = parsed.filter((item: AdBanner) => item.active !== false);
          if (activeOnly.length > 0) setTrends(activeOnly);
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
        setTrends(data);
        localStorage.setItem('storebass_ads', JSON.stringify(data));
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

  // Auto-rotación cada 5 segundos con micro-blur (Emil: blur masks crossfade imperfections)
  const goToSlide = (getNext: (prev: number) => number) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentSlide(getNext);
      setIsTransitioning(false);
    }, 80);
  };

  useEffect(() => {
    if (isPaused || trends.length <= 1) return;
    timerRef.current = setInterval(() => {
      goToSlide((prev: number) => (prev + 1) % trends.length);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isPaused, trends.length]);

  const handlePrev = () => goToSlide((p: number) => (p - 1 + trends.length) % trends.length);
  const handleNext = () => goToSlide((p: number) => (p + 1) % trends.length);

  const activeSlide = trends[currentSlide] || trends[0] || INITIAL_TRENDS[0];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
      {/* Contenedor Principal Hero con diseño de alto impacto */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800/80 shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Glows ambientales */}
        <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none animate-float" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />
        {/* Textura de ruido sutil */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{backgroundImage:'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.75\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")'}} />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Columna Izquierda: Mensaje Central "Voy a USA" */}
          <div className="lg:col-span-7 space-y-5">
            {/* Eyebrow — stagger-1 */}
            <div className="animate-fade-up stagger-1 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-400 text-[11px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Comprador que viaja a USA</span>
            </div>

            {/* Titular — stagger-2 */}
            <h1 className="animate-fade-up stagger-2 text-3xl sm:text-5xl lg:text-[52px] font-black text-white tracking-tight leading-[1.08] font-display">
              Voy a USA.{' '}<span className="text-amber-400">Dime qué quieres</span>{' '}y te lo traigo.
            </h1>

            {/* Subtítulo — stagger-3 */}
            <p className="animate-fade-up stagger-3 text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              Compro tus encargos en tiendas oficiales de USA. Precios garantizados en soles con fecha de entrega clara en Lima.
            </p>

            {/* CTAs — stagger-4, Emil: 160ms ease-out, scale(0.97) active */}
            <div className="animate-fade-up stagger-4 flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#catalogo"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 sm:px-8 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/25 inline-flex items-center gap-2 active:scale-[0.97] hover:shadow-xl hover:shadow-amber-500/35"
                style={{transition:'transform 160ms cubic-bezier(0.23,1,0.32,1),box-shadow 200ms ease,background-color 150ms ease'}}
              >
                <span>Explorar catálogo del viaje</span>
                <span className="material-symbols-outlined text-base">arrow_downward</span>
              </a>
              <a
                href="#pedir-link"
                className="bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 font-bold px-6 sm:px-7 py-3.5 rounded-2xl text-xs sm:text-sm inline-flex items-center gap-2 active:scale-[0.97]"
                style={{transition:'transform 160ms cubic-bezier(0.23,1,0.32,1),background-color 150ms ease'}}
              >
                <span className="material-symbols-outlined text-base text-amber-400">link</span>
                <span>Pedir por link</span>
              </a>
            </div>

            {/* Trust pills — stagger-5 */}
            <div className="animate-fade-up stagger-5 pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-semibold">
              {[
                {icon:'shield_lock',color:'text-amber-400',label:'Garantía de compra oficial'},
                {icon:'local_shipping',color:'text-blue-400',label:'Entrega en Lima y todo Perú'},
              ].map((t,i) => (
                <span key={i} className="flex items-center gap-1">
                  <span className={`material-symbols-outlined text-xs ${t.color}`}>{t.icon}</span>
                  <span>{t.label}</span>
                </span>
              ))}
            </div>
          </div>

          {/* ── Columna Derecha: Carrusel 3D (Emil: 3D transforms for depth) */}
          <div
            className="lg:col-span-5 card-3d"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Contenedor de la Imagen Clara con bordes redondeados y marco limpio sin cajas oscuras que tapen la foto */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl min-h-[380px] sm:min-h-[420px] flex flex-col justify-between group bg-slate-900">
              {/* Slides — crossfade + micro-blur (Emil: blur masks overlapping states) */}
              <div className="absolute inset-0 overflow-hidden">
                {trends.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className="absolute inset-0"
                    style={{
                      opacity: idx === currentSlide ? 1 : 0,
                      filter: isTransitioning && idx === currentSlide ? 'blur(4px)' : 'blur(0px)',
                      transition: 'opacity 600ms cubic-bezier(0.23,1,0.32,1), filter 150ms ease-out',
                      zIndex: idx === currentSlide ? 1 : 0,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.img}
                      alt={slide.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105"
                      style={{transition:'transform 1200ms cubic-bezier(0.23,1,0.32,1)'}}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/25 to-transparent pointer-events-none" />
                  </div>
                ))}
              </div>

              {/* Insignias Superiores Flotantes Translúcidas */}
              <div className="relative z-10 p-4 flex items-center justify-between">
                <span className="px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/15 text-amber-400 text-[10px] font-black uppercase tracking-wider shadow-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                  <span>{activeSlide.tag || 'Tendencias & Novedades'}</span>
                </span>

                <span className="text-[11px] font-bold text-white bg-slate-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/15 shadow-lg">
                  {currentSlide + 1} / {trends.length}
                </span>
              </div>

              {/* Info card — key re-monta para animate-pop por slide (Emil: popIn from scale 0.95) */}
              <div
                key={currentSlide}
                className="relative z-10 m-3 p-4 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/15 shadow-2xl space-y-3 animate-pop"
              >
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white font-display leading-tight truncate">
                    {activeSlide.title}
                  </h3>
                  {activeSlide.subtitle && (
                    <p className="text-xs text-slate-300 mt-0.5 line-clamp-1 leading-snug">
                      {activeSlide.subtitle}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
                  <a
                    href={activeSlide.link || '#catalogo'}
                    onClick={() => {
                      if (onSelectCategory && activeSlide.tag) onSelectCategory(activeSlide.tag);
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 active:scale-[0.97] shadow-md hover:shadow-lg hover:shadow-amber-500/30"
                    style={{transition:'transform 160ms cubic-bezier(0.23,1,0.32,1),box-shadow 200ms ease,background-color 150ms ease'}}
                  >
                    <span>{activeSlide.btn_text || (activeSlide as any).btnText || 'Ver novedad'}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>

                  {/* Flechas — Emil: 160ms ease-out, scale(0.90) active */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrev}
                      aria-label="Imagen anterior"
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 text-white flex items-center justify-center active:scale-[0.90]"
                      style={{transition:'transform 160ms cubic-bezier(0.23,1,0.32,1),background-color 150ms ease'}}
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button
                      onClick={handleNext}
                      aria-label="Imagen siguiente"
                      className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 hover:border-white/30 text-white flex items-center justify-center active:scale-[0.90]"
                      style={{transition:'transform 160ms cubic-bezier(0.23,1,0.32,1),background-color 150ms ease'}}
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Dots — Emil: animated width pill (not just opacity) */}
                <div className="flex items-center gap-1.5 pt-1">
                  {trends.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => goToSlide(() => idx)}
                      aria-label={`Ir a imagen ${idx + 1}`}
                      className={`h-1.5 rounded-full ${idx === currentSlide ? 'bg-amber-400' : 'bg-white/30 hover:bg-white/60'}`}
                      style={{
                        width: idx === currentSlide ? '24px' : '8px',
                        transition: 'width 300ms cubic-bezier(0.23,1,0.32,1), background-color 200ms ease',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
