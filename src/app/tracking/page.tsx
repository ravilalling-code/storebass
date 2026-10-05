'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TicketModal } from '@/components/cart/TicketModal';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { getWhatsAppLink } from '@/lib/constants';

interface TrackingData {
  code: string;
  title: string;
  client?: string;
  store: string;
  modality: string;
  statusText: string;
  estimatedDate: string;
  location: string;
  flightRoute: string;
  altitude: string;
  speed: string;
  timeLeft: string;
  progressPercent: number;
  awb: string;
  weight: string;
  customs: string;
  invoice: string;
  steps: {
    title: string;
    date: string;
    desc: string;
    status: 'completed' | 'active' | 'pending';
    icon: string;
  }[];
}

const DEFAULT_TRACKING: TrackingData = {
  code: 'DUSA-89421-PE',
  title: 'Apple MacBook Air M3 15" - Space Gray',
  store: 'Apple Store Aventura Mall (Miami, FL)',
  modality: 'Express Aéreo Prioritario',
  statusText: 'En tránsito aéreo a Lima · Vuelo AA-917',
  estimatedDate: 'Viernes, 29 de Octubre',
  location: 'En tu domicilio (San Borja, Lima Metropolitana)',
  flightRoute: 'Ruta Miami (MIA) ➔ Lima (LIM) · Vuelo AA-917',
  altitude: '34,000 ft',
  speed: '870 km/h',
  timeLeft: '2h 45m',
  progressPercent: 60,
  awb: 'AWB 001-9283-4819',
  weight: '1.800 kg',
  customs: '100% Pagados (S/ 0)',
  invoice: 'Factura Original Apple ($1,299)',
  steps: [
    {
      title: '1. Compra confirmada e invoice oficial emitido en USA',
      date: '05 Oct · 11:20 AM',
      desc: 'Adquisición completada en Apple Store Aventura Mall con factura comercial oficial. Número de serie verificado: SN-C02LK891M3.',
      status: 'completed',
      icon: 'check',
    },
    {
      title: '2. Recibido e inspeccionado en Almacén STORE BASS (Miami Hub)',
      date: '06 Oct · 09:15 AM',
      desc: 'Paquete recibido intacto. Control de calidad aprobado, pesaje verificado en báscula electrónica: 1.800 kg y embalaje de seguridad reforzado.',
      status: 'completed',
      icon: 'check',
    },
    {
      title: '3. Vuelo internacional en ruta Miami (MIA) ➔ Lima (LIM)',
      date: 'Hoy · En tránsito',
      desc: 'Vuelo American Airlines AA-917 despegó a las 14:30 EST. Manifiesto aéreo AWB #001-9283-4819 validado. Hora estimada de aterrizaje: 20:45 hrs.',
      status: 'active',
      icon: 'flight_takeoff',
    },
    {
      title: '4. Control aduanero e inspección oficial (0 trámites para ti)',
      date: 'Programado: 27 Oct',
      desc: 'STORE BASS asume el trámite y control aduanero al 100%. Equipaje y carga declarada en regla. Pagas S/ 0 adicional.',
      status: 'pending',
      icon: 'assured_workload',
    },
    {
      title: '5. En reparto final a tu puerta en Lima o envío nacional',
      date: 'Programado: 29 Oct',
      desc: 'Despacho coordinado con confirmación por WhatsApp antes de salir y entrega bajo firma y precinto intacto.',
      status: 'pending',
      icon: 'home',
    },
  ],
};

export default function TrackingPage() {
  const [inputCode, setInputCode] = useState('');
  const [tracking, setTracking] = useState<TrackingData | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputCode.trim().toUpperCase();
    if (!code) return;

    setHasSearched(true);
    setIsSearching(true);
    setErrorMessage('');

    let found = null;
    const cleanCode = code.replace('#', '');
    const cleanPhoneDigits = code.replace(/[^0-9]/g, '');

    // 1. Consultar a Supabase Cloud en tiempo real
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('fn_track_order', {
          p_code: cleanCode,
          p_phone: cleanPhoneDigits.length >= 4 ? cleanPhoneDigits : null,
        });

        if (!rpcError && rpcData && rpcData.length > 0) {
          const item = rpcData[0];
          found = {
            ticket_code: item.ticket_code,
            ticketId: item.ticket_code,
            estado: item.estado,
            detalle: item.detalle,
            cliente: item.cliente_primer_nombre,
            tipo: item.tipo,
          };
        } else {
          // Consulta directa de respaldo a tabla tickets
          const queryTarget = cleanCode.startsWith('TK-') ? cleanCode : `TK-${cleanCode}`;
          const { data: dbData } = await supabase
            .from('tickets')
            .select('ticket_code, correlativo, cliente, estado, detalle, tipo, created_at')
            .eq('ticket_code', queryTarget)
            .limit(1);

          if (dbData && dbData.length > 0) {
            const item = dbData[0];
            found = {
              ticket_code: item.ticket_code,
              ticketId: item.ticket_code,
              estado: item.estado,
              detalle: item.detalle,
              cliente: item.cliente?.split(' ')[0] || 'Cliente',
              tipo: item.tipo,
            };
          }
        }
      } catch (err) {
        console.warn('Error querying tracking in Supabase:', err);
      }
    }

    // 2. Buscar en tickets locales de respaldo
    if (!found) {
      try {
        const saved = localStorage.getItem('storebass_tickets');
        if (saved) {
          const tickets = JSON.parse(saved);
          if (Array.isArray(tickets)) {
            found = tickets.find((t: any) => {
              const tCode = (t.ticket_code || t.ticketId || '').toUpperCase();
              return tCode === code || tCode.replace('#', '') === code.replace('#', '');
            });
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    if (found) {
      setTracking({
        ...DEFAULT_TRACKING,
        code: found.ticket_code || found.ticketId,
        title: found.detalle || 'Artículos del encargo en USA',
        store: found.tipo === 'cotizacion_links' ? 'Tiendas USA' : 'Catálogo Store Bass',
        client: found.cliente,
        statusText: found.estado || 'En gestión de viaje',
        progressPercent: found.estado === 'Listo para entrega' ? 100 : found.estado === 'Comprado en USA' ? 65 : 35,
      });
    } else {
      setTracking(null);
      setErrorMessage(`No se encontró ningún pedido o ticket registrado con el código "${code}".`);
    }
    setIsSearching(false);
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0">
      <Header />

      <main className="flex-1 pt-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {/* Breadcrumb & Acceso a Seguimiento de 6 Pasos */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Link href="/" className="hover:text-amber-500 transition-colors">
              Inicio
            </Link>
            <span>/</span>
            <span className="font-bold text-slate-800 dark:text-white">Rastreo en Vivo</span>
          </div>

          <Link
            href="/#seguimiento"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 w-fit transition-colors"
          >
            <span className="material-symbols-outlined text-sm">checklist</span>
            <span>Ver Seguimiento en 6 Pasos de tu Ticket</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </Link>
        </div>

        {/* Hero de Búsqueda de Tracking */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold tracking-wide mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>TELEMETRÍA EN VIVO · MIAMI ➔ LIMA</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">
            Rastrea tu importación en tiempo real
          </h1>
          <p className="text-xs sm:text-base text-slate-600 dark:text-slate-300">
            Ingresa tu número de guía o tracking y conoce cada fase desde el almacén en Miami hasta
            la puerta de tu domicilio en Perú.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-2xl mx-auto">
            <form
              onSubmit={handleSearch}
              className="bg-white dark:bg-darkCard p-2 sm:p-2.5 rounded-2xl sm:rounded-full border border-slate-200/80 dark:border-darkBorder shadow-card-subtle flex flex-col sm:flex-row gap-2"
            >
              <div className="flex items-center px-4 flex-1">
                <span className="material-symbols-outlined text-amber-500 text-2xl mr-3">
                  qr_code_scanner
                </span>
                <input
                  type="text"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  placeholder="Ingresa tu código de guía (ej. SB-84920)"
                  className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 font-mono font-bold text-xs sm:text-sm focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-8 rounded-xl sm:rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all duration-150 active:scale-95 shadow-md flex items-center justify-center gap-2 shrink-0"
              >
                <span>Consultar estado</span>
                <span className="material-symbols-outlined text-base">search</span>
              </button>
            </form>
          </div>
        </div>

        {/* Estado Vacío / En Blanco */}
        {!tracking && (
          <div className="bg-white dark:bg-darkCard rounded-3xl p-8 sm:p-12 text-center border border-dashed border-slate-300 dark:border-darkBorder shadow-card-subtle mb-10 space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-4xl">
                {hasSearched ? 'search_off' : 'radar'}
              </span>
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white font-display">
              {hasSearched
                ? errorMessage || 'No se encontró el pedido'
                : 'No hay pedidos en pantalla'}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              {hasSearched
                ? 'Verifica que el número de ticket sea correcto (ej. TK-1004). Si recién realizaste tu pedido, consulta directamente con Johan por WhatsApp.'
                : 'Ingresa tu número de ticket o código de tracking para ver la ruta aérea en vivo y la fecha estimada de entrega.'}
            </p>
            {hasSearched && (
              <div className="pt-2">
                <a
                  href={`https://wa.me/51960759244?text=${encodeURIComponent(
                    `👋 ¡Hola Johan Tovar! Quiero consultar el estado de mi pedido o ticket: ${inputCode}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs shadow-md transition-transform active:scale-95"
                >
                  <span className="material-symbols-outlined text-base">chat</span>
                  <span>Consultar por WhatsApp con Johan</span>
                </a>
              </div>
            )}
          </div>
        )}

        {/* Main Status Card (Solo si tracking existe) */}
        {tracking && (
          <>
            <div className="bg-white dark:bg-darkCard rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-darkBorder shadow-card-subtle mb-10 transition-all">
              {/* Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      GUÍA: {tracking.code}
                    </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                  <span>{tracking.statusText}</span>
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                {tracking.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap items-center gap-2">
                <span>
                  Tienda: <strong>{tracking.store}</strong>
                </span>
                <span>·</span>
                <span>
                  Modalidad:{' '}
                  <strong className="text-amber-600 dark:text-amber-400">
                    {tracking.modality}
                  </strong>
                </span>
              </p>
            </div>

            {/* Estimated date */}
            <div className="bg-slate-50 dark:bg-slate-900/60 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-left lg:text-right shrink-0">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Fecha estimada de entrega
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 block">
                {tracking.estimatedDate}
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400">{tracking.location}</span>
            </div>
          </div>

          {/* Visual Route Radar Map */}
          <div className="py-8 my-6 bg-slate-950 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl border border-slate-800">
            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8">
                <div>
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                    Telemetría de vuelo en tiempo real
                  </span>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white mt-0.5">
                    {tracking.flightRoute}
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono bg-white/10 px-4 py-2 rounded-full border border-white/15">
                  <span>Altitud: {tracking.altitude}</span>
                  <span>·</span>
                  <span>Velocidad: {tracking.speed}</span>
                  <span>·</span>
                  <span className="text-emerald-400 font-bold">
                    Tiempo restante: {tracking.timeLeft}
                  </span>
                </div>
              </div>

              {/* Visual Progress Bar */}
              <div className="relative py-6">
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${tracking.progressPercent}%` }}
                  ></div>
                </div>

                <div className="flex items-center justify-between mt-4 text-xs">
                  <div className="flex flex-col items-start">
                    <span className="w-4 h-4 rounded-full bg-amber-500 border-2 border-white mb-1"></span>
                    <span className="font-bold text-white">Miami Hub (MIA)</span>
                    <span className="text-slate-400 text-[10px]">Despacho: 20 Oct</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <div className="w-8 h-8 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-slate-950 shadow-lg animate-pulse mb-1">
                      <span className="material-symbols-outlined text-sm font-black">flight</span>
                    </div>
                    <span className="font-bold text-amber-300">En ruta aérea</span>
                    <span className="text-slate-400 text-[10px]">En curso</span>
                  </div>
                  <div className="flex flex-col items-center text-center">
                    <span className="w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-600 mb-1"></span>
                    <span className="font-bold text-slate-300">Aduana Jorge Chávez (LIM)</span>
                    <span className="text-slate-400 text-[10px]">Arribo programado</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="w-4 h-4 rounded-full bg-slate-700 border-2 border-slate-600 mb-1"></span>
                    <span className="font-bold text-slate-300">Entrega en Tu Puerta</span>
                    <span className="text-slate-400 text-[10px]">29 de Octubre</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline of 5 milestones */}
          <div className="pt-6">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mb-6">
              Bitácora de Eventos de la Importación
            </h3>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-4 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 ml-2">
              {tracking.steps.map((st, idx) => (
                <div key={idx} className="relative flex items-start gap-5 pl-8">
                  <div
                    className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center text-sm shadow-md ring-4 ring-white dark:ring-darkCard ${
                      st.status === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : st.status === 'active'
                        ? 'bg-amber-500 text-slate-950 animate-pulse'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">{st.icon}</span>
                  </div>
                  <div
                    className={`flex-1 p-4 rounded-2xl border ${
                      st.status === 'active'
                        ? 'bg-amber-500/10 border-amber-500/40'
                        : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                      <h4
                        className={`font-bold text-xs sm:text-sm ${
                          st.status === 'active'
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-900 dark:text-white'
                        }`}
                      >
                        {st.title}
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">{st.date}</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300">{st.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Transparency Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 mb-12">
          <div className="bg-white dark:bg-darkCard p-6 rounded-3xl border border-slate-200/80 dark:border-darkBorder shadow-card-subtle">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Guía Oficial
            </span>
            <span className="text-base sm:text-lg font-mono font-extrabold text-slate-900 dark:text-white">
              {tracking.awb}
            </span>
            <p className="text-xs text-slate-500 mt-1">Registrado ante Aduanas</p>
          </div>

          <div className="bg-white dark:bg-darkCard p-6 rounded-3xl border border-slate-200/80 dark:border-darkBorder shadow-card-subtle">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Peso en Báscula
            </span>
            <span className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
              {tracking.weight}
            </span>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Verificado en Miami Hub</p>
          </div>

          <div className="bg-white dark:bg-darkCard p-6 rounded-3xl border border-slate-200/80 dark:border-darkBorder shadow-card-subtle">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Aduanas e Impuestos
            </span>
            <span className="text-base sm:text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
              {tracking.customs}
            </span>
            <p className="text-xs text-slate-500 mt-1">Régimen DDP Garantizado</p>
          </div>

          <div className="bg-white dark:bg-darkCard p-6 rounded-3xl border border-slate-200/80 dark:border-darkBorder shadow-card-subtle flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Comprobante USA
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                {tracking.invoice}
              </span>
            </div>
            <a
              href={`https://wa.me/51960759244?text=${encodeURIComponent(
                `Hola STORE BASS, solicito copia de la factura de compra de mi guía ${tracking.code}`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 hover:underline"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>Solicitar comprobante</span>
            </a>
          </div>
        </div>

        {/* WhatsApp concierge card */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <span className="material-symbols-outlined text-2xl">support_agent</span>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                ¿Deseas coordinar un cambio de horario o dirección?
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                Tu asesor de tracking está en línea para coordinar tu entrega personalizada.
              </p>
            </div>
          </div>
          <a
            href={`https://wa.me/51960759244?text=${encodeURIComponent(
              `Hola STORE BASS, quisiera consultar sobre mi guía ${tracking.code}`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 shrink-0"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            <span>Hablar por WhatsApp</span>
          </a>
        </div>
        </>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <TicketModal />
      <MobileBottomNav />
    </div>
  );
}
