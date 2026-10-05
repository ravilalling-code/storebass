import React, { useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getWhatsAppLink } from '@/lib/constants';

export function TrackingPreview() {
  const [orderCode, setOrderCode] = useState('');
  const [queriedCode, setQueriedCode] = useState('');
  const [foundTicket, setFoundTicket] = useState<any | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [viewMode, setViewMode] = useState<'timeline' | 'telemetry'>('timeline');

  const steps = [
    {
      num: 1,
      nameKey: 'Pendiente',
      title: 'Pedido recibido',
      desc: 'Ticket registrado y datos del producto verificados.',
    },
    {
      num: 2,
      nameKey: 'Cotizado',
      title: 'Cotizado',
      desc: 'Precio final en Soles y fecha enviado a tu WhatsApp.',
    },
    {
      num: 3,
      nameKey: 'Confirmado y pagado',
      title: 'Confirmado y pagado',
      desc: 'Cupo de viaje asignado con el adelanto acordado.',
    },
    {
      num: 4,
      nameKey: 'Comprado en USA',
      title: 'Comprado en USA',
      desc: 'Comprado en tienda física oficial y verificado.',
    },
    {
      num: 5,
      nameKey: 'En camino a Perú',
      title: 'En camino a Perú',
      desc: 'En equipaje de regreso. Llegada a Lima: 29 de Octubre.',
    },
    {
      num: 6,
      nameKey: 'Listo para entrega',
      title: 'Listo para entrega',
      desc: 'Despacho urbano en Lima o envío a provincia.',
    },
  ];

  const getStepNumberForStatus = (status?: string): number => {
    switch (status?.toLowerCase()) {
      case 'pendiente':
        return 1;
      case 'cotizado':
        return 2;
      case 'confirmado y pagado':
        return 3;
      case 'comprado en usa':
        return 4;
      case 'en camino a perú':
      case 'en camino a peru':
        return 5;
      case 'listo para entrega':
        return 6;
      default:
        return 1;
    }
  };

  const handleTrack = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = orderCode.trim().toUpperCase();
    if (!query) return;

    setQueriedCode(query);
    setHasSearched(true);
    setIsSearching(true);

    let match = null;
    const cleanQuery = query.replace('#', '');
    const cleanPhoneDigits = query.replace(/[^0-9]/g, '');

    // 1. Consultar a Supabase Cloud en tiempo real
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('fn_track_order', {
          p_code: cleanQuery,
          p_phone: cleanPhoneDigits.length >= 4 ? cleanPhoneDigits : null,
        });

        if (!rpcError && rpcData && rpcData.length > 0) {
          const item = rpcData[0];
          match = {
            ticket_code: item.ticket_code,
            ticketId: item.ticket_code,
            estado: item.estado,
            detalle: item.detalle,
            cliente: item.cliente_primer_nombre,
            fecha: item.fecha,
            tipo: item.tipo,
          };
        } else {
          // Consulta fallback directa a tabla tickets
          const queryTarget = cleanQuery.startsWith('TK-') ? cleanQuery : `TK-${cleanQuery}`;
          const { data: dbData } = await supabase
            .from('tickets')
            .select('ticket_code, correlativo, cliente, estado, detalle, tipo, created_at')
            .eq('ticket_code', queryTarget)
            .limit(1);

          if (dbData && dbData.length > 0) {
            const item = dbData[0];
            match = {
              ticket_code: item.ticket_code,
              ticketId: item.ticket_code,
              estado: item.estado,
              detalle: item.detalle,
              cliente: item.cliente?.split(' ')[0] || 'Cliente',
              fecha: item.created_at,
              tipo: item.tipo,
            };
          }
        }
      } catch (err) {
        console.warn('Error querying Supabase for tracking:', err);
      }
    }

    // 2. Fallback a tickets de localStorage
    if (!match) {
      try {
        const saved = localStorage.getItem('storebass_tickets');
        if (saved) {
          const tickets = JSON.parse(saved);
          if (Array.isArray(tickets)) {
            match = tickets.find((t: any) => {
              const tCode = (t.ticket_code || t.ticketId || '').toUpperCase();
              const cleanTCode = tCode.replace('#', '');
              const tPhone = (t.telefono || '').replace(/[^0-9]/g, '');
              return cleanTCode === cleanQuery || (cleanPhoneDigits.length >= 8 && tPhone.includes(cleanPhoneDigits));
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    setFoundTicket(match || null);
    setIsSearching(false);
  };

  const handleClear = () => {
    setOrderCode('');
    setQueriedCode('');
    setFoundTicket(null);
    setHasSearched(false);
  };

  const activeStep = foundTicket ? getStepNumberForStatus(foundTicket.estado) : 1;

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

          {/* Formulario de Búsqueda */}
          <form onSubmit={handleTrack} className="flex items-center gap-2 max-w-sm w-full">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                tag
              </span>
              <input
                type="text"
                value={orderCode}
                onChange={(e) => setOrderCode(e.target.value)}
                placeholder="Ingresa tu N° de Ticket (ej. TK-1004)"
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl pl-9 pr-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-colors flex-shrink-0 shadow-sm active:scale-95"
            >
              <span className="material-symbols-outlined text-sm">search</span>
              <span>Rastrear</span>
            </button>
            {hasSearched && (
              <button
                type="button"
                onClick={handleClear}
                aria-label="Limpiar búsqueda"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center text-xs transition-colors flex-shrink-0"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            )}
          </form>
        </div>

        {/* ESTADO 1: EN BLANCO (Sin búsqueda previa) */}
        {!hasSearched && (
          <div className="text-center py-12 px-4 space-y-3 bg-slate-50 dark:bg-darkElevated/30 rounded-3xl border border-dashed border-slate-300 dark:border-darkBorder">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">radar</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No hay pedidos en pantalla
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Ingresa el número de ticket que recibiste al registrar tu compra o cotización (ej. <strong>TK-1004</strong>) o tu número de WhatsApp para ver su estado en vivo.
            </p>
          </div>
        )}

        {/* ESTADO 2: BÚSQUEDA NO ENCONTRADA */}
        {hasSearched && !foundTicket && (
          <div className="text-center py-10 px-4 space-y-3 bg-slate-50 dark:bg-darkElevated/30 rounded-3xl border border-dashed border-slate-300 dark:border-darkBorder">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-2xl">search_off</span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              No encontramos ningún pedido registrado con el código &quot;{queriedCode}&quot;
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Verifica haber escrito correctamente tu ticket. Si acabas de pedirlo, contáctame directamente por WhatsApp.
            </p>
            <div className="pt-2">
              <a
                href={`https://wa.me/51960759244?text=${encodeURIComponent(
                  `👋 ¡Hola Johan Tovar! Deseo consultar sobre el estado de mi pedido o ticket: ${queriedCode}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl shadow-md transition-transform active:scale-95"
              >
                <span className="material-symbols-outlined text-sm">chat</span>
                <span>Consultar con Johan por WhatsApp</span>
              </a>
            </div>
          </div>
        )}

        {/* ESTADO 3: PEDIDO ENCONTRADO (Muestra Timeline Real o Telemetría) */}
        {hasSearched && foundTicket && (
          <div className="space-y-6 animate-pop">
            {/* Switcher de Vistas: 6 Pasos vs Telemetría en Vivo */}
            <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80">
                <button
                  type="button"
                  onClick={() => setViewMode('timeline')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'timeline'
                      ? 'bg-white dark:bg-darkCard text-amber-600 dark:text-amber-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">checklist</span>
                  <span>6 Pasos del Pedido</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('telemetry')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'telemetry'
                      ? 'bg-white dark:bg-darkCard text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm text-blue-500 animate-pulse">flight_takeoff</span>
                  <span>Telemetría de Vuelo en Vivo</span>
                </button>
              </div>

              <Link
                href="/tracking"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                <span className="material-symbols-outlined text-sm">radar</span>
                <span>Ver radar aéreo completo en /tracking</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>

            {/* VISTA 1: TELEMETRÍA EN VIVO (VUELO MIAMI ➔ LIMA) */}
            {viewMode === 'telemetry' ? (
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-blue-500/30 text-white space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Telemetría en Vivo · Miami (MIA) ➔ Lima (LIM)
                    </span>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-mono font-bold border border-blue-500/30 self-start sm:self-auto">
                    Manifiesto Aéreo AWB 001-9283-4819
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Vuelo / Ruta</span>
                    <span className="text-sm font-black text-amber-400">AA-917 (MIA ➔ LIM)</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Altitud Crucero</span>
                    <span className="text-sm font-black text-white">34,000 pies</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Velocidad</span>
                    <span className="text-sm font-black text-white">870 km/h</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Aduanas Perú</span>
                    <span className="text-sm font-black text-emerald-400">100% Pagadas (S/ 0)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 pt-2 gap-2">
                  <span className="text-center sm:text-left">Equipaje personal verificado e inspeccionado por Johan Tovar en Miami.</span>
                  <Link
                    href="/tracking"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 font-bold transition-colors"
                  >
                    <span>Abrir radar aéreo y mapa en vivo</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </Link>
                </div>
              </div>
            ) : (
              /* VISTA 2: LÍNEA DE 6 PASOS COMERCIALES */
              <div className="pt-2">
                <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                  {steps.map((step) => {
                    const isPassed = step.num < activeStep;
                    const isCurrent = step.num === activeStep;

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
            )}

            {/* Ficha resumida del pedido consultado */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-xl">luggage</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      Ticket #{foundTicket.ticket_code || foundTicket.ticketId}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
                      {foundTicket.estado || 'En gestión'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Cliente: <strong>{foundTicket.cliente}</strong> · Detalle: <strong>{foundTicket.detalle}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Link
                  href="/tracking"
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1 transition-colors"
                >
                  <span className="material-symbols-outlined text-sm text-blue-500">radar</span>
                  <span>Ver telemetría completa</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
                <a
                  href={`https://wa.me/51960759244?text=${encodeURIComponent(
                    `👋 ¡Hola Johan Tovar! Deseo consultar el estado de mi ticket #${foundTicket.ticket_code || foundTicket.ticketId} registrado a nombre de ${foundTicket.cliente}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm text-emerald-400">chat</span>
                  <span>Consultar con Johan</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Banner permanente de enlace cruzado entre ambos tipos de rastreo */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-gradient-to-r from-blue-600/10 via-amber-500/10 to-emerald-500/10 border border-blue-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-500 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-xl animate-pulse">radar</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 dark:text-white block">
                ¿Deseas ver la telemetría en tiempo real del vuelo internacional?
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Conoce la altitud, velocidad, manifiesto AWB y control aduanero en vivo en nuestra pantalla de radar.
              </span>
            </div>
          </div>
          <Link
            href="/tracking"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all whitespace-nowrap active:scale-95 flex-shrink-0"
          >
            <span className="material-symbols-outlined text-sm">flight_takeoff</span>
            <span>Rastreo en Vivo Miami ➔ Lima</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
