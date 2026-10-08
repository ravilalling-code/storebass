'use client';

import React from 'react';
import { motion } from 'motion/react';

const WAYS = [
  {
    badge: 'Entrega Inmediata',
    badgeColor: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    time: '24 a 48h',
    title: 'Compra en stock',
    desc: 'El producto ya está en Lima. Pagas y coordinamos la entrega.',
    checks: [
      'Entrega inmediata en 24–48 h en Lima y envíos a provincias.',
      'Pagas al recibir, opción contraentrega en artículos seleccionados.',
      'Producto verificado e inspeccionado físicamente.',
    ],
    checkColor: 'text-emerald-500',
    cta: { label: 'Ver productos en stock', href: '#catalogo', style: 'secondary' },
    featured: false,
  },
  {
    badge: 'Más Elegido',
    badgeColor: 'bg-amber-500 text-slate-950',
    time: 'Llega 29 Oct',
    title: 'Reserva del próximo viaje',
    desc: 'Eliges del catálogo, ves la fecha de llegada y reservas tu cupo.',
    checks: [
      'Aseguras el precio oficial de USA antes de que se agote.',
      'Fecha de llegada garantizada: Lima, 29 de Octubre.',
      'Separas con 50% y cancelas el saldo al recibirlo.',
    ],
    checkColor: 'text-amber-400',
    cta: { label: 'Reservar mi cupo', href: '#catalogo', style: 'primary' },
    featured: true,
  },
  {
    badge: 'Cualquier Tienda USA',
    badgeColor: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
    time: 'A pedido',
    title: 'Pide por link',
    desc: 'Pegas el link de cualquier tienda de USA y te cotizo precio y fecha.',
    checks: [
      'Compro en Amazon, Walmart, Best Buy, Target, Nike y más.',
      'Precio cerrado en soles y fecha de entrega antes de pagar.',
      'Cotización en minutos directo a tu WhatsApp.',
    ],
    checkColor: 'text-emerald-500',
    cta: { label: 'Pedir por link', href: '#pedir-link', style: 'secondary' },
    featured: false,
  },
];

const ease = [0.16, 1, 0.3, 1] as const;

export function HowToBuy() {
  return (
    <section id="como-comprar" className="max-w-7xl mx-auto px-4 sm:px-6 py-16">

      {/* Header: izquierda alineada, sin eyebrow (taste-skill: no eyebrow every section) */}
      <div className="mb-12 max-w-lg">
        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-display tracking-tight">
          Tres formas de comprar
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-3 leading-relaxed">
          Transparencia total: precio en soles, fecha clara y producto original de USA.
        </p>
      </div>

      {/* Cards con scroll-reveal stagger (taste-skill 5.C) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {WAYS.map((way, i) => (
          <motion.div
            key={way.title}
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
            transition={{ duration: 0.55, delay: i * 0.08, ease }}
            className={`rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative ${
              way.featured
                ? 'bg-slate-950 text-white border-2 border-amber-500 shadow-2xl md:-translate-y-2 z-10'
                : 'bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-card-subtle hover:border-amber-500/40 transition-colors'
            }`}
          >
            {/* "Más Elegido" floating pill */}
            {way.featured && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider px-4 py-0.5 rounded-full shadow">
                Más Elegido · Próximo Viaje
              </div>
            )}

            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border ${way.badgeColor}`}>
                  {way.badge}
                </span>
                <span className={`text-xs font-bold ${way.featured ? 'text-amber-300' : 'text-slate-400 dark:text-slate-500'}`}>
                  {way.time}
                </span>
              </div>

              <h3 className={`text-xl font-black font-display ${way.featured ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                {way.title}
              </h3>
              <p className={`text-xs leading-relaxed ${way.featured ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'}`}>
                {way.desc}
              </p>

              <ul className={`space-y-2.5 pt-3 border-t text-xs ${
                way.featured ? 'border-slate-800 text-slate-200' : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300'
              }`}>
                {way.checks.map((c) => (
                  <li key={c} className="flex items-start gap-2">
                    <span className={`material-symbols-outlined text-base mt-0.5 flex-shrink-0 ${way.checkColor}`}>check</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href={way.cta.href}
              style={{ transition: 'transform 160ms cubic-bezier(0.23,1,0.32,1), background-color 150ms ease' }}
              className={`mt-6 w-full py-3 rounded-2xl text-xs font-bold text-center block active:scale-[0.97] ${
                way.cta.style === 'primary'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-md'
                  : way.featured
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
              }`}
            >
              {way.cta.label}
            </a>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

