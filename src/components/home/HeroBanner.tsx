'use client';

import React from 'react';

interface HeroBannerProps {
  onSelectCategory?: (category: string) => void;
}

export function HeroBanner({ onSelectCategory }: HeroBannerProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-10">
      {/* Banner de Alto Impacto para Escritorio y Móvil */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800 shadow-2xl p-7 sm:p-12 lg:p-16">
        {/* Fondo e Iluminación Sutil */}
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>

        {/* Imagen de Fondo para Escritorio */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80"
          alt="Comprador Personal USA"
          className="hidden md:block absolute right-0 top-0 w-1/2 h-full object-cover object-center opacity-30 pointer-events-none"
        />

        {/* Imagen para Móvil */}
        <div className="md:hidden absolute inset-0 -z-0 opacity-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1512436991641-6745cdb1723f?auto=format&fit=crop&w=800&q=80"
            alt="Compras en USA"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Columna Izquierda: Titular y Subtítulo */}
          <div className="lg:col-span-8 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-400 text-xs font-black uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span>Servicio de Personal Shopper</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight font-display">
              Voy a USA. Dime qué quieres y te lo traigo.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl">
              Elige de mi catálogo o pega el link de lo que buscas. Ves el precio y la fecha de llegada antes de pagar.
            </p>

            {/* Dos botones de acción */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#catalogo"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 sm:px-8 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 transform hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <span>Ver catálogo del viaje</span>
                <span className="material-symbols-outlined text-base">arrow_downward</span>
              </a>
              <a
                href="#pedir-link"
                className="bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700 font-bold px-6 sm:px-7 py-3.5 rounded-2xl text-xs sm:text-sm inline-flex items-center gap-2 transition-all"
              >
                <span className="material-symbols-outlined text-base text-amber-400">link</span>
                <span>Pedir por link</span>
              </a>
            </div>

            {/* Chips de Categorías Rápidas */}
            <div className="pt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Búsquedas del viaje:</span>
              <div className="inline-flex flex-wrap items-center gap-2">
                {['Apple', 'Perfumes', 'Belleza', 'Relojes'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => onSelectCategory && onSelectCategory(cat)}
                    className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] font-semibold transition-colors"
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <button
                onClick={() => onSelectCategory && onSelectCategory('stock')}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 transition-colors"
              >
                En stock Lima
              </button>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta Próximo viaje */}
          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className="w-full max-w-sm rounded-3xl bg-slate-900/95 border-2 border-amber-500/50 p-6 shadow-2xl space-y-4 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-400 text-xl">luggage</span>
                  <h3 className="text-sm font-black text-white font-display">Próximo viaje</h3>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40">
                  Pedidos abiertos
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 font-medium">Fecha de ida:</span>
                  <span className="font-extrabold text-white">20 de Octubre</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 font-medium">Fecha de regreso:</span>
                  <span className="font-black text-amber-400 text-sm">29 de Octubre</span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <span className="text-slate-400 font-medium">Estado del viaje:</span>
                  <span className="font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                    <span>Recibiendo pedidos</span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-snug pt-1">
                Todos los pedidos recibidos antes de la fecha de ida vienen conmigo y se entregan a mi regreso.
              </p>

              <a
                href="#pedir-link"
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
              >
                <span>Hacer un pedido para este viaje</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
