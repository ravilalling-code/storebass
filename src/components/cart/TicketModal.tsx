'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';

export function TicketModal() {
  const { isTicketModalOpen, ticketData, closeTicketModal } = useCart();

  if (!isTicketModalOpen || !ticketData) return null;

  // Construir mensaje moderno de WhatsApp para Johan Tovar
  const ticketCode = ticketData.ticket_code || ticketData.ticketId;
  let rawMsg = `🛍️ *STORE BASS — PERSONAL SHOPPER USA* 🇺🇸✈️🇵🇪\n`;
  rawMsg += `─────────────────────────\n`;
  rawMsg += `🎫 *TICKET CONSECUTIVO:* #${ticketCode}\n`;
  rawMsg += `👤 *CLIENTE:* ${ticketData.cliente}\n`;
  rawMsg += `📱 *WHATSAPP:* ${ticketData.telefono}\n`;
  rawMsg += `📅 *FECHA:* ${ticketData.fecha || ''}\n`;
  rawMsg += `─────────────────────────\n`;

  if (ticketData.items && ticketData.items.length > 0 && ticketData.items[0].title) {
    rawMsg += `📦 *PRODUCTOS DEL PEDIDO:*\n`;
    ticketData.items.forEach(i => {
      rawMsg += `• ${i.title} — *S/ ${Number(i.price).toFixed(2)}*\n`;
    });
    rawMsg += `\n💰 *TOTAL EN SOLES:* S/ ${Number(ticketData.total || 0).toFixed(2)}\n`;
    rawMsg += `✈️ *VIAJE A USA:* Salida 20 Oct ➔ Entrega en Lima 29 Oct\n`;
    rawMsg += `🛡️ *GARANTÍA:* Tiendas oficiales USA con boleta/recibo original\n`;
    rawMsg += `─────────────────────────\n`;
    rawMsg += `👋 ¡Hola Johan Tovar! Acabo de registrar mi ticket en la web. Deseo coordinar la reserva de cupo y entrega para este viaje. 🙌`;
  } else {
    rawMsg += `🔗 *ENLACES / DETALLE A COTIZAR:*\n`;
    rawMsg += `${ticketData.detalle}\n\n`;
    rawMsg += `✈️ *VIAJE A USA:* Salida 20 Oct ➔ Entrega en Lima 29 Oct\n`;
    rawMsg += `─────────────────────────\n`;
    rawMsg += `👋 ¡Hola Johan Tovar! Deseo cotización exacta con precio final en soles y fecha de entrega para este viaje. ¡Muchas gracias! 🙌`;
  }

  const waUrl = `https://wa.me/51960759244?text=${encodeURIComponent(rawMsg)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md px-4">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto animate-pop">
        {/* Botón Cerrar */}
        <button
          onClick={closeTicketModal}
          className="absolute right-5 top-5 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all active:scale-[0.95]"
          aria-label="Cerrar voucher"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Encabezado Voucher Ticket */}
        <div className="text-center pb-5 border-b border-dashed border-slate-300 dark:border-slate-700">
          <div className="inline-flex items-center justify-center p-1 rounded-2xl bg-amber-500/10 border border-amber-500/30 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/Storebass.jpg" alt="STORE BASS Logo" className="w-12 h-12 rounded-xl object-cover" />
          </div>
          <div className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
            STORE <span className="text-amber-500">BASS</span>
          </div>
          <p className="text-[11px] uppercase tracking-widest font-extrabold text-slate-500 dark:text-slate-400">
            Comprobante Oficial de Compra & Encargo
          </p>

          {/* Badge Número Correlativo */}
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-600 dark:text-amber-400 font-mono font-black text-lg shadow-sm">
            <span className="material-symbols-outlined text-base">confirmation_number</span>
            <span>#{ticketData.ticket_code || ticketData.ticketId}</span>
          </div>
          <div className="text-[10px] text-slate-400 font-semibold mt-1">
            Número Correlativo Consecutivo Único
          </div>
        </div>

        {/* Cuerpo del Ticket */}
        <div className="py-5 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente:</span>
              <span className="font-extrabold text-slate-900 dark:text-white text-xs">{ticketData.cliente}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">WhatsApp:</span>
              <span className="font-bold text-slate-900 dark:text-white text-xs font-mono">{ticketData.telefono}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha y Hora:</span>
              <span className="text-slate-600 dark:text-slate-300">{ticketData.fecha}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Origen:</span>
              <span className="font-bold text-blue-500 dark:text-blue-400">🌐 Web StoreBass</span>
            </div>
          </div>

          {/* Detalle de Productos */}
          <div className="space-y-2">
            <span className="text-[11px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider">
              Detalle del Pedido:
            </span>
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 space-y-2 max-h-40 overflow-y-auto">
              {ticketData.items && ticketData.items.length > 0 ? (
                ticketData.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs pb-1.5 border-b border-slate-200/50 dark:border-slate-800 last:border-0">
                    <span className="font-semibold truncate text-slate-800 dark:text-slate-200 mr-2">{it.title}</span>
                    <span className="font-bold text-amber-500 flex-shrink-0">S/ {Number(it.price).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-line">
                  {ticketData.detalle}
                </div>
              )}
            </div>
          </div>

          {/* Total en Soles */}
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase block">
                Total en Soles:
              </span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                Precio final garantizado
              </span>
            </div>
            <div className="text-xl font-black text-amber-600 dark:text-amber-400">
              S/ {Number(ticketData.total || 0).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="space-y-3 pt-2">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.97]"
          >
            <span className="material-symbols-outlined text-lg">chat</span>
            <span>Continuar a WhatsApp con Ticket #{ticketData.ticket_code || ticketData.ticketId}</span>
          </a>

          <p className="text-[11px] text-slate-400 text-center leading-snug">
            Este ticket queda registrado en nuestro sistema. Haz clic arriba para coordinar el 50% de reserva o entrega con Johan Tovar.
          </p>
        </div>
      </div>
    </div>
  );
}
