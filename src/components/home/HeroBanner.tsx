'use client';

import React, { useState, useEffect, useRef } from 'react';

interface HeroBannerProps {
  onSelectCategory?: (category: string) => void;
}

interface ShowcaseSlide {
  id: number;
  tag: string;
  tagColor: string;
  title: string;
  description: string;
  image: string;
  actionText: string;
  actionHref: string;
  categorySlug?: string;
}

const SHOWCASE_SLIDES: ShowcaseSlide[] = [
  {
    id: 1,
    tag: 'Tendencias & Outlets USA',
    tagColor: 'bg-amber-500 text-slate-950',
    title: 'Sawgrass Mills & Outlets de Miami',
    description: 'Ropa de marcas top, zapatillas y ofertas directas desde Florida sin intermediarios.',
    image: 'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=900&q=80',
    actionText: 'Pedir por link',
    actionHref: '#pedir-link',
  },
  {
    id: 2,
    tag: 'Tecnología Apple USA',
    tagColor: 'bg-blue-600 text-white',
    title: 'Apple Store Lincoln Rd & Fifth Ave',
    description: 'iPhone 16 Pro, MacBook M3 y AirPods con recibo de compra y garantía oficial Apple.',
    image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80',
    actionText: 'Ver Apple en catálogo',
    actionHref: '#catalogo',
    categorySlug: 'Apple',
  },
  {
    id: 3,
    tag: 'Belleza & Skincare',
    tagColor: 'bg-rose-500 text-white',
    title: 'Sephora & Ulta Beauty USA',
    description: 'Las fórmulas virales de TikTok, perfumes de lujo y cosmética que no llega a Perú.',
    image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80',
    actionText: 'Ver Perfumes y Belleza',
    actionHref: '#catalogo',
    categorySlug: 'Belleza',
  },
  {
    id: 4,
    tag: 'Sneakers Exclusivos',
    tagColor: 'bg-emerald-500 text-white',
    title: 'Nike, Jordan & New Balance USA',
    description: 'Colorways y tallas exclusivas del mercado estadounidense traídos en equipaje.',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=900&q=80',
    actionText: 'Ver Zapatillas',
    actionHref: '#catalogo',
    categorySlug: 'Zapatillas',
  },
];

export function HeroBanner({ onSelectCategory }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotación de publicidad / fotos cada 4.5 segundos (pausa si el usuario tiene el mouse encima)
  useEffect(() => {
    if (isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
    }, 4500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + SHOWCASE_SLIDES.length) % SHOWCASE_SLIDES.length);
  };

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % SHOWCASE_SLIDES.length);
  };

  const activeItem = SHOWCASE_SLIDES[currentSlide];

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

          {/* Columna Derecha: Showcase Animado Interactivo de Fotos y Publicidad de USA */}
          <div
            className="lg:col-span-5"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl p-5 text-white min-h-[340px] flex flex-col justify-between group">
              {/* Imagen de fondo de la diapositiva activa con transición suave Emil Kowalski */}
              <div className="absolute inset-0 overflow-hidden">
                {SHOWCASE_SLIDES.map((slide, idx) => (
                  <div
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] ${
                      idx === currentSlide ? 'opacity-100 z-0' : 'opacity-0 -z-10'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover opacity-30 transform scale-105 transition-transform duration-1000 ease-out"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                  </div>
                ))}
              </div>

              {/* Contenido superior de la Diapositiva */}
              <div className="relative z-10 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-sm transition-colors duration-200 ${activeItem.tagColor}`}
                  >
                    {activeItem.tag}
                  </span>

                  {/* Contador de Slide */}
                  <span className="text-[11px] font-bold text-slate-400 bg-slate-950/60 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-slate-800">
                    {currentSlide + 1} / {SHOWCASE_SLIDES.length}
                  </span>
                </div>

                <div className="transition-all duration-200 ease-out">
                  <h3 className="text-lg sm:text-xl font-black text-white font-display leading-snug">
                    {activeItem.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    {activeItem.description}
                  </p>
                </div>
              </div>

              {/* Controles Inferiores: Botón de Acción, Flechas y Dots */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between gap-3">
                <a
                  href={activeItem.actionHref}
                  onClick={() => {
                    if (activeItem.categorySlug && onSelectCategory) {
                      onSelectCategory(activeItem.categorySlug);
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-white text-slate-950 hover:bg-amber-400 font-black text-xs inline-flex items-center gap-1.5 transition-transform active:scale-95 shadow-md"
                >
                  <span>{activeItem.actionText}</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </a>

                {/* Flechas de Navegación Manual con retroalimentación táctil */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrev}
                    aria-label="Foto anterior"
                    className="w-8 h-8 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-center transition-transform active:scale-90"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_left</span>
                  </button>
                  <button
                    onClick={handleNext}
                    aria-label="Foto siguiente"
                    className="w-8 h-8 rounded-xl bg-slate-950/80 hover:bg-slate-800 border border-slate-700/80 text-white flex items-center justify-center transition-transform active:scale-90"
                  >
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* Dots / Barras de Progreso Inferiores */}
              <div className="relative z-10 flex items-center gap-1.5 mt-2">
                {SHOWCASE_SLIDES.map((slide, idx) => (
                  <button
                    key={slide.id}
                    onClick={() => setCurrentSlide(idx)}
                    aria-label={`Ir a foto ${idx + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-200 ${
                      idx === currentSlide
                        ? 'w-6 bg-amber-400'
                        : 'w-2 bg-slate-700 hover:bg-slate-500'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
