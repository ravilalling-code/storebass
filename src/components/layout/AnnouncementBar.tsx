'use client';

import React, { useState, useEffect } from 'react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

const DEFAULT_ANNOUNCEMENTS = [
  'Próximo viaje: voy el 20 de Octubre y regreso el 29 de Octubre',
  'Reserva ahora lo que llega en mi regreso a Lima',
  'Productos en stock disponibles para entrega hoy en Lima',
];

export function AnnouncementBar() {
  const [index, setIndex] = useState(0);
  const [fade, setFade] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setIndex(prev => (prev + 1) % DEFAULT_ANNOUNCEMENTS.length);
        setFade(true);
      }, 300);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-950 text-white text-[11px] font-semibold py-2 px-4 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
          <div
            className={`truncate transition-opacity duration-300 ${
              fade ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {index === 0 ? (
              <>
                Próximo viaje: voy el <strong className="text-amber-400">20 de Octubre</strong> y regreso el{' '}
                <strong className="text-amber-400">29 de Octubre</strong>
              </>
            ) : (
              <span>{DEFAULT_ANNOUNCEMENTS[index]}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4 flex-shrink-0 text-slate-400">
          <a
            href="https://wa.me/51960759244"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-amber-400 transition-colors flex items-center gap-1.5"
          >
            <WhatsAppIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="hidden sm:inline">WhatsApp:</span> <span>960 759 244</span>
          </a>
        </div>
      </div>
    </div>
  );
}
