'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AdBanner } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

export const INITIAL_TRENDS: AdBanner[] = [];

export function TrendsCarousel() {
  const [trends, setTrends] = useState<AdBanner[]>(INITIAL_TRENDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const carouselTrackRef = useRef<HTMLDivElement>(null);

  // Solo permitir imágenes reales cargadas por el usuario/sistema (excluir URLs de prueba de Unsplash)
  const sanitizeBanners = (items: AdBanner[]) =>
    items.filter(
      (item) =>
        item.active !== false &&
        Boolean(item.img) &&
        !item.img.includes('images.unsplash.com')
    );

  // Carga de tendencias desde Supabase con fallback a localStorage
  const loadTrends = async () => {
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
      console.warn('Error cargando carrusel de tendencias:', err);
    }
  };

  useEffect(() => {
    loadTrends();

    const handleUpdate = () => loadTrends();
    window.addEventListener('storebass_ads_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('storebass_ads_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  // Auto-avance suave cada 5 segundos si no hay mouse encima
  useEffect(() => {
    if (isPaused || trends.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % trends.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isPaused, trends.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + trends.length) % trends.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % trends.length);
  };

  if (!trends || trends.length === 0) return null;

  const currentTrend = trends[currentIndex];

  return (
    <section id="tendencias" className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Cabecera de Sección */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-500 uppercase tracking-wider mb-1">
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            <span>Lo más pedido & lanzamientos de USA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
            Tendencias y Novedades
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Imágenes de los productos y marcas más virales que puedo traerte en mi viaje del 20 al 29 de Octubre.
          </p>
        </div>

        {/* Controles de Navegación Emil Kowalski Tactile */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-400 bg-slate-100 dark:bg-darkCard px-3 py-1.5 rounded-xl border border-slate-200 dark:border-darkBorder">
            {currentIndex + 1} de {trends.length}
          </span>
          <button
            onClick={handlePrev}
            aria-label="Tendencia anterior"
            className="w-9 h-9 rounded-xl bg-white dark:bg-darkCard text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center border border-slate-200 dark:border-darkBorder transition-transform active:scale-90 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <button
            onClick={handleNext}
            aria-label="Tendencia siguiente"
            className="w-9 h-9 rounded-xl bg-white dark:bg-darkCard text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center border border-slate-200 dark:border-darkBorder transition-transform active:scale-90 shadow-sm"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Carrusel Principal Hero Card */}
      <div
        className="relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl min-h-[360px] sm:min-h-[420px] flex flex-col justify-end p-6 sm:p-10 text-white group"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        ref={carouselTrackRef}
      >
        {/* Diapositivas de fondo con fundido suave */}
        {trends.map((item, idx) => (
          <div
            key={item.id || idx}
            className={`absolute inset-0 transition-opacity duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${
              idx === currentIndex ? 'opacity-100 z-0' : 'opacity-0 -z-10'
            }`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.img}
              alt={item.title}
              className="w-full h-full object-cover object-center transform scale-100 group-hover:scale-105 transition-transform duration-1000 ease-out"
            />
            {/* Gradiente cinemático de alto contraste */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/75 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-transparent to-slate-950/30" />
          </div>
        ))}

        {/* Contenido en Primer Plano */}
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 text-[11px] font-black uppercase tracking-wider shadow-md">
              {currentTrend.tag || 'Tendencia USA'}
            </span>
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] font-bold">
              Viaje 20 - 29 Octubre
            </span>
          </div>

          <h3 className="text-2xl sm:text-4xl font-black text-white font-display tracking-tight leading-tight">
            {currentTrend.title}
          </h3>

          {currentTrend.subtitle && (
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed max-w-xl">
              {currentTrend.subtitle}
            </p>
          )}

          {/* Botones de Acción */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <a
              href={currentTrend.link || '#pedir-link'}
              className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 transition-transform active:scale-[0.98]"
            >
              <span>{currentTrend.btn_text || currentTrend.btnText || 'Pedir este artículo'}</span>
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </a>

            <a
              href={`https://wa.me/51960759244?text=${encodeURIComponent(
                `👋 *STORE BASS — CONSULTA DE TENDENCIA* 🇺🇸✈️\n─────────────────────────\n¡Hola Johan! Vi esta novedad en tu carrusel de tendencias:\n\n⭐ *${currentTrend.title}*\n\n¿Me podrías dar información o cotización para traerlo en tu viaje? ¡Muchas gracias!`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm shadow-lg shadow-emerald-500/20 inline-flex items-center gap-2 transition-transform active:scale-[0.98]"
            >
              <WhatsAppIcon className="w-4 h-4 text-white" />
              <span>Consultar por WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Barra de Progreso y Miniaturas / Dots */}
        <div className="relative z-10 flex items-center justify-between pt-6 mt-6 border-t border-white/10">
          <div className="flex items-center gap-2">
            {trends.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Ver diapositiva ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? 'w-8 bg-amber-400' : 'w-2.5 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-semibold hidden sm:flex items-center gap-1.5">
            <span className="material-symbols-outlined text-xs text-amber-400">verified</span>
            <span>Gestionado desde el CRM por Johan Tovar</span>
          </div>
        </div>
      </div>
    </section>
  );
}
