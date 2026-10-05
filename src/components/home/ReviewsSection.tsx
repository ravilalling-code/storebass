import React from 'react';
import Image from 'next/image';

const REVIEWS = [
  {
    rating: 5,
    time: 'Hace 1 semana',
    text: '"Le pedí un iPhone 16 Pro por link de Best Buy. Me respondió al toque con el precio en soles y me llegó exactamente el día que prometió a su regreso de Miami, 100% sellado."',
    name: 'Diego R.',
    location: 'San Borja, Lima • iPhone 16 Pro',
    image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
  },
  {
    rating: 5,
    time: 'Hace 2 semanas',
    text: '"Compré dos perfumes Lattafa que estaban en stock en Lima y me los entregaron al día siguiente por motorizado. Pagué contraentrega, todo original con batch code verificado."',
    name: 'Mariana S.',
    location: 'Miraflores, Lima • Perfumes Lattafa',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
  },
  {
    rating: 5,
    time: 'Hace 3 semanas',
    text: '"Viajó a USA y me trajo unas zapatillas Nike y maquillaje de Sephora para mi esposa que no se consiguen en Perú. Me mandaba fotos en vivo mientras compraba. ¡Excelente servicio!"',
    name: 'Carlos M.',
    location: 'Arequipa • Nike & Sephora',
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
  },
];

export function ReviewsSection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto mb-9">
        <div className="inline-flex items-center gap-1 text-amber-500 text-sm font-black mb-1">
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span>★</span>
          <span className="text-slate-900 dark:text-white ml-1">4.9 / 5.0</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
          Más de 350 compras entregadas
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Clientes en Lima y provincias que reciben sus artículos originales de Estados Unidos.
        </p>
      </div>

      {/* 3 Review Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {REVIEWS.map((rev, index) => (
          <div
            key={index}
            className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder rounded-3xl p-5 shadow-card-subtle flex flex-col justify-between space-y-4"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex text-amber-400 text-xs">★★★★★</div>
                <span className="text-[10px] text-slate-400">{rev.time}</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
                {rev.text}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden relative flex-shrink-0">
                <Image
                  src={rev.image}
                  alt={rev.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
              <div>
                <h4 className="text-xs font-black text-slate-900 dark:text-white">{rev.name}</h4>
                <p className="text-[10px] text-slate-400">{rev.location}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
