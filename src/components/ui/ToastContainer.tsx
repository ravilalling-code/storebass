'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';

export function ToastContainer() {
  const { toasts, removeToast } = useCart();

  if (toasts.length === 0) return null;

  return (
    <aside
      aria-live="polite"
      aria-label="Notificaciones"
      className="fixed top-20 right-4 sm:right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full"
    >
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            animation: 'toastEnter 220ms cubic-bezier(0.23, 1, 0.32, 1) forwards',
          }}
          className="pointer-events-auto flex items-center justify-between gap-3 bg-slate-950/95 dark:bg-white text-white dark:text-slate-950 p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-800 dark:border-slate-200/80 backdrop-blur-lg transition-transform duration-160 ease-out"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-emerald-400 dark:text-emerald-600 text-xl flex-shrink-0">
              check_circle
            </span>
            <div className="min-w-0">
              <h5 className="text-xs font-bold truncate leading-tight">{toast.title}</h5>
              {toast.message && (
                <p className="text-[11px] text-slate-300 dark:text-slate-600 truncate mt-0.5">
                  {toast.message}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-900 active:scale-[0.95] transition-all flex-shrink-0 rounded-lg"
            aria-label="Cerrar notificación"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </aside>
  );
}
