import React from 'react';

export function TrustBanner() {
  const pillars = [
    {
      icon: 'verified',
      title: 'Comprado por mí en USA',
      desc: 'En tiendas oficiales autorizadas',
    },
    {
      icon: 'payments',
      title: 'Precio final garantizado',
      desc: 'En soles, sin cobros sorpresa',
    },
    {
      icon: 'timeline',
      title: 'Seguimiento paso a paso',
      desc: 'Desde la compra hasta tu puerta',
    },
    {
      icon: 'chat',
      title: 'Atención personalizada',
      desc: 'Hablas directamente con Johan',
    },
  ];

  const stores = [
    { name: 'Apple', tag: 'Store Oficial USA' },
    { name: 'Amazon', tag: 'Prime USA' },
    { name: 'Best Buy', tag: 'Tecnología' },
    { name: 'Sephora', tag: 'Perfumería' },
    { name: 'Nike', tag: 'Sneakers USA' },
    { name: 'Walmart', tag: 'Precios USA' },
    { name: 'Macy’s', tag: 'Moda y Lujo' },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-4 space-y-4">
      {/* 1. Cuatro Pilares de Confianza */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-card-subtle">
        {pillars.map((p, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-2xl">{p.icon}</span>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                {p.title}
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 2. Tiendas Oficiales de USA (Social Proof Ticker) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-100/70 dark:bg-darkElevated/40 border border-slate-200/60 dark:border-darkBorder/60 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
          <span className="material-symbols-outlined text-amber-500 text-base">storefront</span>
          <span>Tiendas oficiales donde compro tus encargos:</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
          {stores.map((s) => (
            <div
              key={s.name}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder text-slate-800 dark:text-slate-200 text-xs font-black shadow-2xs"
            >
              <span className="text-[11px]">{s.name}</span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">· {s.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
