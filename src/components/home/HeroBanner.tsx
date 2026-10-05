'use client';

import React from 'react';

interface HeroBannerProps {
  onSelectCategory?: (category: string) => void;
}

export function HeroBanner({ onSelectCategory }: HeroBannerProps) {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-8">
      {/* Container Hero de Alto Impacto */}
      <div className="relative rounded-3xl overflow-hidden bg-slate-950 text-white border border-slate-800/80 shadow-2xl p-6 sm:p-10 lg:p-14">
        {/* Glows ambientales sutiles calibrados */}
        <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-amber-500/15 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-blue-600/10 blur-3xl pointer-events-none"></div>

        {/* Fotografía de ambiente en USA con scrim */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80"
          alt="Personal Shopper en USA"
          className="hidden lg:block absolute right-0 top-0 w-5/12 h-full object-cover object-center opacity-20 pointer-events-none select-none"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Columna Izquierda: Mensaje Central */}
          <div className="lg:col-span-7 space-y-5">
            {/* Eyebrow de Marca */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-amber-400 text-[11px] font-black uppercase tracking-wider">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>Comprador que viaja a USA</span>
            </div>

            {/* Titular Principal: Máximo 2 líneas */}
            <h1 className="text-3xl sm:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.08] font-display">
              Voy a USA. Dime qué quieres y te lo traigo.
            </h1>

            {/* Subtítulo Conciso: Menos de 20 palabras */}
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-lg">
              Compro tus encargos en tiendas oficiales de USA. Precios garantizados en soles con fecha de entrega clara.
            </p>

            {/* Dos CTAs con Tactile Feedback */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <a
                href="#catalogo"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 sm:px-8 py-3.5 rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 inline-flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <span>Explorar catálogo del viaje</span>
                <span className="material-symbols-outlined text-base">arrow_downward</span>
              </a>

              <a
                href="#pedir-link"
                className="bg-slate-900/90 hover:bg-slate-800 text-white border border-slate-700/80 font-bold px-6 sm:px-7 py-3.5 rounded-2xl text-xs sm:text-sm inline-flex items-center gap-2 transition-all active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-base text-amber-400">link</span>
                <span>Pedir por link</span>
              </a>
            </div>
          </div>

          {/* Columna Derecha: Tarjeta de Vuelo / Boarding Pass del Viaje */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-3xl bg-slate-900/90 border border-amber-500/40 p-6 shadow-2xl space-y-4 backdrop-blur-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    JT
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-white font-display">Próximo Vuelo Confirmado</h3>
                    <p className="text-[10px] text-slate-400">Johan Tovar · Shopper Personal</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40">
                  Cupos Abiertos
                </span>
              </div>

              {/* Trazado de Ruta Lima - Miami - Lima */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Vuelo de Ida</span>
                  <div className="text-sm font-extrabold text-white">20 de Octubre</div>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-amber-400">flight_takeoff</span>
                    <span>Lima → Miami Hub</span>
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-950/70 border border-amber-500/30 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400">Entrega en Lima</span>
                  <div className="text-sm font-black text-amber-400">29 de Octubre</div>
                  <span className="text-[10px] text-slate-300 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs text-emerald-400">flight_land</span>
                    <span>En mis manos a Lima</span>
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800/80 flex items-center gap-2 text-[11px] text-slate-300">
                <span className="material-symbols-outlined text-base text-emerald-400 flex-shrink-0">verified</span>
                <span>Precios con aduanas, impuestos de USA y flete incluidos.</span>
              </div>

              <a
                href="#pedir-link"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md shadow-amber-500/20"
              >
                <span>Reservar cupo para este viaje</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
