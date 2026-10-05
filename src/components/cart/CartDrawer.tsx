'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';

export function CartDrawer() {
  const { isCartOpen, closeCart, items, removeFromCart, total, count, generateTicket } = useCart();
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Por favor ingresa tu Nombre y Celular WhatsApp para generar tu ticket correlativo.');
      return;
    }

    setLoading(true);
    try {
      await generateTicket({
        cliente: customerName.trim(),
        telefono: customerPhone.trim(),
        origen: 'Web',
        tipo: 'compra_lista',
        items,
        total,
      });
      closeCart();
    } catch (err) {
      console.error('Error generando ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isCartOpen) return null;

  return (
    <>
      {/* Overlay translúcido */}
      <div
        onClick={closeCart}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-opacity duration-200"
      />

      {/* Drawer Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md bg-white dark:bg-darkCard border-l border-slate-200 dark:border-darkBorder shadow-2xl z-50 flex flex-col justify-between animate-drawer"
      >
        {/* Cabecera del Drawer */}
        <div className="p-5 border-b border-slate-200 dark:border-darkBorder flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-500 text-xl">shopping_cart</span>
            <h3 className="text-sm font-black text-slate-900 dark:text-white font-display">
              Carrito de compras
            </h3>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl transition-colors"
            aria-label="Cerrar carrito"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Lista de Productos */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {count === 0 ? (
            <div className="text-center py-16 text-slate-400 space-y-2">
              <span className="material-symbols-outlined text-4xl">remove_shopping_cart</span>
              <p className="text-xs font-bold">Tu carrito está vacío</p>
              <p className="text-[11px] max-w-xs mx-auto">
                Agrega productos del catálogo para separarlos en mi próximo viaje o pedir entrega en Lima.
              </p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 transition-all hover:border-amber-500/40"
              >
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</h4>
                  <p className="text-xs font-black text-amber-500 mt-0.5">S/ {item.price.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => removeFromCart(idx)}
                  className="text-rose-500 p-1.5 hover:bg-rose-500/10 rounded-lg flex-shrink-0 transition-colors"
                  title="Eliminar producto"
                >
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer del Drawer y Formulario de Ticket */}
        <div className="p-5 border-t border-slate-200 dark:border-darkBorder bg-slate-50 dark:bg-slate-900/60 space-y-3">
          <div className="space-y-1 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Subtotal en soles:</span>
              <span className="font-bold text-slate-900 dark:text-white">S/ {total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-bold">
              <span>Precio final:</span>
              <span>Sin cobros ocultos</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-sm font-black text-slate-900 dark:text-white">
              <span>Total en soles:</span>
              <span className="text-base text-amber-500">S/ {total.toFixed(2)}</span>
            </div>
          </div>

          {count > 0 && (
            <>
              {/* Datos para el Ticket Correlativo */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Tus datos para generar tu Ticket correlativo:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Tu Nombre"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="Celular WhatsApp"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <button
                onClick={handleCheckout}
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">receipt_long</span>
                <span>{loading ? 'Generando Ticket...' : 'Confirmar y Generar Ticket'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
