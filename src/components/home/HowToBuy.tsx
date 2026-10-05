import React from 'react';

export function HowToBuy() {
  return (
    <section id="como-comprar" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center max-w-xl mx-auto mb-10">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display">
          Tres formas de comprar
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
          Te traigo tus compras de Estados Unidos a Perú con total transparencia, fecha clara y precio final en soles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {/* 1. Compra en stock */}
        <div className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-card-subtle group hover:border-amber-500/40 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                Entrega Inmediata
              </span>
              <span className="text-xs text-slate-400 font-bold">24 a 48h</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">Compra en stock</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              El producto ya está en Lima. Pagas y coordinamos la entrega.
            </p>

            <ul className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">check</span>
                <span>Entrega inmediata en 24 a 48 horas en Lima y envíos a provincia.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">check</span>
                <span>Pagas al recibir con opción contraentrega en artículos seleccionados.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">check</span>
                <span>Producto verificado e inspeccionado físicamente listo para ti.</span>
              </li>
            </ul>
          </div>
          <a
            href="#catalogo"
            className="mt-6 w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl text-xs transition-all active:scale-[0.98] text-center block"
          >
            Ver productos en stock
          </a>
        </div>

        {/* 2. Reserva del próximo viaje (DESTACADA) */}
        <div className="bg-slate-950 text-white border-2 border-amber-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative md:-translate-y-2 z-10">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-sm">
            Más Elegido • Próximo Viaje
          </div>
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400">Viaje Confirmado</span>
              <span className="text-xs text-amber-300 font-bold">Llega 29 de Octubre</span>
            </div>
            <h3 className="text-xl font-black text-white font-display">Reserva del próximo viaje</h3>
            <p className="text-xs text-slate-300">Eliges del catálogo, ves la fecha de llegada y reservas tu cupo.</p>

            <ul className="space-y-2.5 pt-3 border-t border-slate-800 text-xs text-slate-200">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-base">check</span>
                <span>Aseguras el precio oficial de oferta de USA antes de que se agote.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-base">check</span>
                <span>Fecha de llegada garantizada a Lima en mi regreso (29 de Octubre).</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400 text-base">check</span>
                <span>Separas tu cupo con solo el 50% y cancelas el saldo al recibirlo.</span>
              </li>
            </ul>
          </div>
          <a
            href="#catalogo"
            className="mt-6 w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-md transition-all active:scale-[0.98] text-center block"
          >
            Reservar mi cupo
          </a>
        </div>

        {/* 3. Pide por link */}
        <div className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-card-subtle group hover:border-amber-500/40 transition-all">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30">
                Cualquier Tienda USA
              </span>
              <span className="text-xs text-slate-400 font-bold">A pedido</span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">Pide por link</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pegas el link de cualquier tienda de USA y te cotizo el precio y la fecha de llegada.
            </p>

            <ul className="space-y-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">check</span>
                <span>Compro en Amazon, Walmart, Best Buy, Target, Nike y más.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">check</span>
                <span>Precio cerrado en Soles y fecha de entrega antes de pagar.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">check</span>
                <span>Te respondo con la cotización en minutos a tu WhatsApp.</span>
              </li>
            </ul>
          </div>
          <a
            href="#pedir-link"
            className="mt-6 w-full py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-bold rounded-2xl text-xs transition-all active:scale-[0.98] text-center block"
          >
            Pedir por link
          </a>
        </div>
      </div>
    </section>
  );
}
