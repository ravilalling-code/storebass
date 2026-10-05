'use client';

import React from 'react';
import { useCart } from '@/context/CartContext';

export function ToastContainer() {
  const { toasts, removeToast } = useCart();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center justify-between gap-3 bg-slate-900/95 dark:bg-white text-white dark:text-slate-900 p-3.5 rounded-2xl shadow-xl border border-slate-700 dark:border-slate-200 animate-pop transition-all"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="material-symbols-outlined text-emerald-400 dark:text-emerald-600 text-xl flex-shrink-0">
              check_circle
            </span>
            <div className="min-w-0">
              <h5 className="text-xs font-bold truncate leading-snug">{toast.title}</h5>
              <p className="text-[11px] text-slate-300 dark:text-slate-600 truncate">{toast.message}</p>
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 text-slate-400 hover:text-white dark:hover:text-slate-950 transition-colors flex-shrink-0"
            aria-label="Cerrar notificación"
          >
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      ))}
    </div>
  );
}
