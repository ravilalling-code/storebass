'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function TrackingPreview() {
  const [orderCode, setOrderCode] = useState('SB-84920');
  const [activeStep, setActiveStep] = useState(5);
  const [queriedCode, setQueriedCode] = useState('SB-84920');

  const handleTrack = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!orderCode.trim()) return;
    setQueriedCode(orderCode.trim().toUpperCase());
  };

  const steps = [
    {
      num: 1,
      title: 'Pedido recibido',
      desc: 'Enlace registrado y datos del producto verificados.',
    },
    {
      num: 2,
      title: 'Cotizado',
      desc: 'Precio final en Soles y fecha enviado a tu WhatsApp.',
    },
    {
      num: 3,
      title: 'Confirmado y pagado',
      desc: 'Cupo de viaje asignado con el adelanto acordado.',
    },
    {
      num: 4,
      title: 'Comprado en USA',
      desc: 'Comprado en tienda física oficial y verificado.',
    },
    {
      num: 5,
      title: 'En camino a Perú',
      desc: 'En mi equipaje de regreso. Llegada a Lima: 29 de Octubre.',
    },
    {
      num: 6,
      title: 'Listo para entrega',
      desc: 'Despacho urbano en Lima o envío a provincia.',
    },
  ];

  return (
    <section id="seguimiento" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder p-6 sm:p-10 shadow-card-subtle space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <span className="inline-block text-[11px] font-black text-amber-500 uppercase tracking-widest mb-1">
              En tiempo real
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
              Seguimiento de tu pedido
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Conoce el estado exacto de tu encargo en cada paso de mi viaje a USA.
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleTrack} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                tag
              </span>
              <input
                type="text"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="Ej. SB-84920"
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>Rastrea tu pedido</span>
            </button>
          </form>
        </div>

        {/* 6-step Timeline */}
        <div className="pt-2">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {steps.map((step) => {
              const isPassed = step.num < activeStep;
              const isCurrent = step.num === activeStep;
              const isUpcoming = step.num > activeStep;

              if (isCurrent) {
                return (
                  <div
                    key={step.num}
                    className="p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500 text-slate-900 dark:text-white space-y-2 text-center shadow-md relative scale-[1.02] transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center mx-auto shadow-sm animate-pulse">
                      <span className="material-symbols-outlined text-sm font-black">flight_takeoff</span>
                    </div>
                    <span className="block text-[10px] uppercase font-bold text-amber-500">
                      Paso {step.num} • Actual
                    </span>
                    <h4 className="text-xs font-black">{step.title}</h4>
                    <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-tight font-medium">
                      {step.desc}
                    </p>
                  </div>
                );
              }

              if (isPassed) {
                return (
                  <div
                    key={step.num}
                    className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-slate-900 dark:text-white space-y-2 text-center transition-all"
                  >
                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white font-black text-xs flex items-center justify-center mx-auto shadow-sm">
                      <span className="material-symbols-outlined text-sm">check</span>
                    </div>
                    <span className="block text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
                      Paso {step.num}
                    </span>
                    <h4 className="text-xs font-black">{step.title}</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {step.desc}
                    </p>
                  </div>
                );
              }

              return (
                <div
                  key={step.num}
                  className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-400 space-y-2 text-center transition-all"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center justify-center mx-auto">
                    {step.num}
                  </div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    Paso {step.num}
                  </span>
                  <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400">{step.title}</h4>
                  <p className="text-[10px] text-slate-400 leading-tight">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info card of consulted order */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl">luggage</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Pedido #{queriedCode}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                  En viaje de regreso
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Comprado en Best Buy Miami • Entrega programada a Lima: <strong>29 de Octubre</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/tracking"
              className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
            >
              <span>Ver seguimiento completo</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </Link>
            <a
              href={`https://wa.me/51960759244?text=${encodeURIComponent(
                `Hola STORE BASS, deseo consultar el estado de mi pedido ${queriedCode}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-sm text-emerald-400">chat</span>
              <span>Consultar conmigo</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
