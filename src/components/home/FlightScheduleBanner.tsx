'use client';

import React, { useState, useEffect } from 'react';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export function FlightScheduleBanner() {
  const [tripData, setTripData] = useState({
    dateIda: '20 de Octubre', dateRegreso: '29 de Octubre', status: 'Cupos Abiertos',
    departure: 'Lima', arrival: 'Miami', deadlineLima: '', deadlineUsa: '', phone: '51960759244',
  });
  const formatDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(value + 'T12:00:00').toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' }) : value;

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let disposed = false;
    const loadTripConfig = async () => {
      const { data, error } = await supabase.from('trip_config').select('*').eq('id', 1).single();
      if (disposed || error || !data) return;
      setTripData({ dateIda: data.date_ida || '', dateRegreso: data.date_regreso || '', status: data.status || 'Cupos Abiertos',
        departure: data.departure_place || 'Lima', arrival: data.arrival_place || 'Miami',
        deadlineLima: data.order_deadline_lima || '', deadlineUsa: data.order_deadline_usa || '', phone: data.phone_digits || '51960759244' });
    };
    void loadTripConfig();
    const channel = supabase.channel('public-trip').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trip_config' }, () => { void loadTripConfig(); }).subscribe();
    window.addEventListener('storebass_trip_settings_updated', loadTripConfig);
    window.addEventListener('focus', loadTripConfig);
    return () => { disposed = true; void supabase.removeChannel(channel); window.removeEventListener('storebass_trip_settings_updated', loadTripConfig); window.removeEventListener('focus', loadTripConfig); };
  }, []);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 py-2 sm:py-4">
      {/* Boarding Pass / Tarjeta de Vuelo Confirmado en diseño apaisado */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 shadow-2xl p-6 sm:p-8 backdrop-blur-xl">
        {/* Glows ambientales sutiles */}
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          {/* Header y Datos del Shopper */}
          <div className="space-y-3 lg:max-w-xs">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{tripData.status}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20">
                Viaje Oficial
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black text-white font-display flex items-center gap-2">
                <span>Próximo Vuelo Confirmado</span>
                <span className="material-symbols-outlined text-amber-400 text-xl">flight</span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Johan Tovar · Shopper Personal encargado de viajar y traer tus compras en su equipaje.
              </p>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-slate-300">
              <span className="material-symbols-outlined text-base text-emerald-400">verified</span>
              <span>Precios con aduanas, flete y tax incluidos</span>
            </div>
          </div>

          {/* Trayecto Boarding Pass (Lima -> Miami -> Lima) */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* Vuelo Ida */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2 relative group hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <span>Vuelo de Salida</span>
                <span className="material-symbols-outlined text-sm text-amber-400">flight_takeoff</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {formatDate(tripData.dateIda)}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-bold text-amber-400">{tripData.departure}</span>
                <span className="text-slate-500">→</span>
                <span className="font-bold text-white">{tripData.arrival}</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Inicio de compras en {tripData.arrival}.
              </p>
            </div>

            {/* Vuelo Regreso / Entrega */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-amber-500/40 space-y-2 relative group hover:border-amber-500/60 transition-colors">
              <div className="flex items-center justify-between text-[11px] text-amber-400 font-bold uppercase tracking-wider">
                <span>Regreso a {tripData.departure}</span>
                <span className="material-symbols-outlined text-sm text-emerald-400">flight_land</span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                {formatDate(tripData.dateRegreso)}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <span className="font-bold text-white">{tripData.arrival}</span>
                <span className="text-slate-500">→</span>
                <span className="font-bold text-emerald-400">{tripData.departure}</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Entregas desde el {formatDate(tripData.dateRegreso)}.
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-2 lg:max-w-44">
            <p><span className="block font-bold text-amber-400">Pedidos en Lima hasta</span>{tripData.deadlineLima ? formatDate(tripData.deadlineLima) : 'Por confirmar'}</p>
            <p><span className="block font-bold text-amber-400">Pedidos en USA hasta</span>{tripData.deadlineUsa ? formatDate(tripData.deadlineUsa) : 'Por confirmar'}</p>
          </div>
          {/* Acciones del Vuelo */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 lg:w-56 flex-shrink-0">
            <a
              href="#pedir-link"
              className="py-3 px-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 transition-transform active:scale-[0.97] shadow-lg shadow-amber-500/20 text-center"
            >
              <span>Reservar cupo para el viaje</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </a>

            <a
              href={`https://wa.me/${tripData.phone}?text=${encodeURIComponent(
                `✈️ *STORE BASS — RESERVA DE CUPO PARA VIAJE A USA* 🇺🇸🇵🇪\n─────────────────────────\n👋 ¡Hola Johan Tovar! Quiero consultar y reservar mi cupo para el viaje confirmado:\n\n🛫 *SALIDA:* ${formatDate(tripData.dateIda)} (${tripData.departure} ➔ ${tripData.arrival})\n🛬 *ENTREGA:* ${formatDate(tripData.dateRegreso)} (${tripData.arrival} ➔ ${tripData.departure})\n\n¿Aún tienes espacio en tu equipaje para mis compras? ¡Muchas gracias! 🙌`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.97] text-center"
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Consultar cupo por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
