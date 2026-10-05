import React from 'react';

export function TrustBanner() {
  const pillars = [
    {
      icon: 'verified',
      title: 'Productos originales comprados por mí en USA',
      desc: 'Comprados en tiendas oficiales',
    },
    {
      icon: 'payments',
      title: 'Precio y fecha de llegada antes de pagar',
      desc: 'En soles, sin cobros sorpresa',
    },
    {
      icon: 'timeline',
      title: 'Seguimiento de tu pedido paso a paso',
      desc: 'En tiempo real hasta tu puerta',
    },
    {
      icon: 'chat',
      title: 'Atención directa por WhatsApp',
      desc: 'Hablas conmigo directamente',
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-card-subtle">
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
    </section>
  );
}
