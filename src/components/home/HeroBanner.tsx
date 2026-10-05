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

  // Auto-rotación del carrusel de imágenes claras cada 5 segundos
  useEffect(() => {
    if (isPaused || trends.length <= 1) return;

    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % trends.length);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, trends.length]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + trends.length) % trends.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % trends.length);
  };

  const activeSlide = trends[currentSlide] || trends[0] || INITIAL_TRENDS[0];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-2">
      {/* Contenedor Principal Hero con diseño de alto impacto */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800/80 shadow-2xl p-6 sm:p-10 lg:p-12">
        {/* Glows ambientales sutiles calibrados */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Columna Izquierda: Mensaje Central "Voy a USA" */}
          <div className="lg:col-span-7 space-y-5">
            {/* Eyebrow de Marca */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-400 text-[11px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Comprador que viaja a USA</span>
            </div>

            {/* Titular Principal */}
            <h1 className="text-3xl sm:text-5xl lg:text-[52px] font-black text-white tracking-tight leading-[1.08] font-display">
              Voy a USA. Dime qué quieres y te lo traigo.
            </h1>

            {/* Subtítulo */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              Compro tus encargos en tiendas oficiales de USA. Precios garantizados en soles con fecha de entrega clara en Lima.
            </p>

            {/* CTAs con retroalimentación táctil Emil Kowalski active:scale-[0.98] */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#catalogo"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 sm:px-8 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 transition-transform active:scale-[0.98]"
              >
                <span>Explorar catálogo del viaje</span>
                <span className="material-symbols-outlined text-base">arrow_downward</span>
              </a>

              <a
                href="#pedir-link"
                className="bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 font-bold px-6 sm:px-7 py-3.5 rounded-2xl text-xs sm:text-sm inline-flex items-center gap-2 transition-transform active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base text-amber-400">link</span>
                <span>Pedir por link</span>
              </a>
            </div>

            {/* Beneficios clave en micro-pills */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-emerald-400">verified</span>
                <span>Boleta / Recibo original</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-amber-400">shield_lock</span>
                <span>Garantía de compra oficial</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-xs text-blue-400">local_shipping</span>
                <span>Entrega en Lima y todo Perú</span>
              </span>
            </div>
          </div>

          {/* Columna Derecha: Carrusel de Imágenes Claras (Tendencias & Novedades desde el CRM) */}
          <div
            className="lg:col-span-5"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            {/* Contenedor de la Imagen Clara con bordes redondeados y marco limpio sin cajas oscuras que tapen la foto */}
            <div className="relative rounded-3xl overflow-hidden border border-slate-800/90 shadow-2xl min-h-[380px] sm:min-h-[420px] flex flex-col justify-between group bg-slate-900">
              {/* Carrusel de Diapositivas: Imágenes 100% Claras y Nítidas */}
              <div className="absolute inset-0 overflow-hidden">
                {trends.map((slide, idx) => (
                  <div
                    key={slide.id || idx}
                    className={`absolute inset-0 transition-opacity duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                      idx === currentSlide ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.img}
                      alt={slide.title}
                      className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
                    />
                    {/* Gradiente sutil y ligero solo en la base para mantener máxima claridad en la imagen */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent pointer-events-none" />
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

              {/* Tarjeta Flotante Inferior de Información y Controles (Elegante, sin tapar la foto) */}
              <div className="relative z-10 m-3 p-4 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-white/15 shadow-2xl space-y-3">
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
                      if (onSelectCategory && activeSlide.tag) {
                        onSelectCategory(activeSlide.tag);
                      }
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
                  >
                    <span>{activeSlide.btn_text || activeSlide.btnText || 'Ver novedad'}</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </a>

                  {/* Flechas de Navegación Manual Emil Kowalski Tactile */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handlePrev}
                      aria-label="Imagen anterior"
                      className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-transform active:scale-90"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_left</span>
                    </button>
                    <button
                      onClick={handleNext}
                      aria-label="Imagen siguiente"
                      className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-transform active:scale-90"
                    >
                      <span className="material-symbols-outlined text-sm">chevron_right</span>
                    </button>
                  </div>
                </div>

                {/* Barra de Progreso y Dots */}
                <div className="flex items-center gap-1.5 pt-1">
                  {trends.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      aria-label={`Ir a imagen ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentSlide
                          ? 'w-6 bg-amber-400'
                          : 'w-2 bg-white/30 hover:bg-white/60'
                      }`}
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
