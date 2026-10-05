'use client';

import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-darkCard border-t border-slate-200/80 dark:border-darkBorder pt-12 pb-7">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {/* Col 1: Marca STORE BASS */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden border border-amber-500/40 shadow-sm bg-slate-900 flex-shrink-0 flex items-center justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/Storebass.jpg" alt="STORE BASS Logo" className="w-full h-full object-cover" />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white font-display">
                STORE <span className="text-amber-500">BASS</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Tu comprador personal en Estados Unidos. Compro directamente en tiendas oficiales de USA y te lo traigo a Perú con fecha clara y precio final en soles.
            </p>
          </div>

          {/* Col 2: Contacto WhatsApp */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Atención al Cliente
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-500 text-base">chat</span>
                <span className="font-medium">WhatsApp Oficial:</span>
              </li>
              <li>
                <a
                  href="https://wa.me/51960759244?text=Hola%20StoreBass,%20deseo%20hacer%20una%20consulta"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold transition-all"
                >
                  <span className="material-symbols-outlined text-sm">forum</span>
                  <span>+51 960 759 244</span>
                </a>
              </li>
              <li className="text-[11px] text-slate-400 pt-1">
                Atención directa y pedidos personalizados por chat con Johan Tovar.
              </li>
            </ul>
          </div>

          {/* Col 3: Ayuda */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
              Ayuda
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <li>
                <a href="#preguntas" className="hover:text-amber-500 transition-colors">
                  Preguntas frecuentes
                </a>
              </li>
              <li>
                <a href="#como-comprar" className="hover:text-amber-500 transition-colors">
                  Cómo funciona
                </a>
              </li>
              <li>
                <a href="#seguimiento" className="hover:text-amber-500 transition-colors">
                  Seguimiento de tu pedido
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-amber-500 transition-colors">
                  Administración
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Fila de Medios de Pago */}
        <div className="pt-6 border-t border-slate-200/60 dark:border-darkBorder/60 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-300">Medios de pago aceptados:</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">Yape</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">Plin</span>
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold">
              Transferencia BCP y BBVA
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Entregas en Lima y envíos a todo el Perú
          </div>
        </div>

        {/* Línea final */}
        <div className="mt-6 pt-4 border-t border-slate-200/40 dark:border-darkBorder/40 text-center text-[11px] text-slate-500">
          © 2026 STORE BASS. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
