'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { count, toggleCart } = useCart();
  const [searchVal, setSearchVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchVal);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (term: string) => {
    setSearchVal(term);
    if (onSearch) onSearch(term);
    setShowSuggestions(false);
  };

  return (
    <header className="sticky top-0 left-0 w-full z-40 glass-surface border-b border-slate-200/80 dark:border-darkBorder shadow-sm">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6">
        {/* Fila Principal: Logo, Buscador Central, Acciones */}
        <div className="h-14 sm:h-[70px] flex items-center justify-between gap-2.5 lg:gap-8">
          {/* Logo STORE BASS */}
          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group flex-shrink-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl overflow-hidden border border-amber-500/40 shadow-md group-hover:scale-105 transition-transform duration-200 bg-slate-900 flex-shrink-0 flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/Storebass.jpg" alt="STORE BASS Logo" className="w-full h-full object-cover" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-xl font-black tracking-tight text-slate-900 dark:text-white font-display">
                  STORE <span className="text-amber-500">BASS</span>
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[9px] font-black uppercase">
                  Personal Shopper
                </span>
              </div>
              <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 dark:text-slate-400 hidden xs:inline">
                Comprador que viaja a USA
              </span>
            </div>
          </Link>

          {/* Buscador Central (Desktop) */}
          <div className="flex-1 max-w-lg hidden md:block relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchVal}
                onChange={e => {
                  setSearchVal(e.target.value);
                  setShowSuggestions(e.target.value.length > 1);
                  if (onSearch) onSearch(e.target.value);
                }}
                onFocus={() => setShowSuggestions(searchVal.length > 1)}
                placeholder="Busca un producto del catálogo o marca de USA"
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-11 pr-20 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                search
              </span>
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors"
              >
                Buscar
              </button>
            </form>

            {/* Dropdown Sugerencias */}
            {showSuggestions && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-2xl shadow-xl p-2 z-50 animate-pop">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  Sugerencias del catálogo
                </div>
                <div className="space-y-1">
                  {['iPhone 16 Pro Max', 'Lattafa Khamrah', 'Sony WH-1000XM5', 'Dior Sauvage', 'Stanley Quencher'].map(
                    sug => (
                      <button
                        key={sug}
                        onClick={() => handleSuggestionClick(sug)}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-xs hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 flex items-center justify-between"
                      >
                        <span>{sug}</span>
                        <span className="material-symbols-outlined text-xs text-slate-400">arrow_outward</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Acciones Derecha */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">

            {/* Seguimiento de pedido */}
            <a
              href="#seguimiento"
              title="Seguimiento de tu pedido"
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group"
            >
              <span className="material-symbols-outlined text-lg text-amber-500 group-hover:scale-110 transition-transform" style={{fontVariationSettings:'"FILL" 1'}}>flight_takeoff</span>
              <span>Seguimiento</span>
            </a>

            {/* Ícono de Login */}
            <Link
              href="/admin"
              title="Iniciar Sesión"
              aria-label="Iniciar Sesión"
              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-darkElevated text-slate-700 dark:text-slate-300 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-all active:scale-[0.97]"
            >
              <span className="material-symbols-outlined text-xl">person</span>
            </Link>

            {/* Tema Claro / Oscuro */}
            <button
              onClick={toggleTheme}
              aria-label="Cambiar tema claro u oscuro"
              className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-darkElevated text-slate-600 dark:text-slate-300 flex items-center justify-center hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'dark' ? (
                <span className="material-symbols-outlined text-lg">light_mode</span>
              ) : (
                <span className="material-symbols-outlined text-lg">dark_mode</span>
              )}
            </button>

            {/* Botón Carrito de Compras */}
            <button
              onClick={toggleCart}
              aria-label="Carrito de compras"
              title="Carrito de compras"
              className="relative w-10 h-10 rounded-2xl bg-slate-100 dark:bg-darkElevated text-slate-700 dark:text-slate-200 hover:text-amber-500 hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95"
            >
              <span className="material-symbols-outlined text-xl text-amber-500">shopping_cart</span>
              <span
                id="header-list-badge"
                className="absolute -top-1.5 -right-1.5 bg-amber-500 text-slate-950 text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center transition-transform"
              >
                {count}
              </span>
            </button>
          </div>
        </div>

        {/* Buscador para Dispositivos Móviles */}
        <div className="py-2.5 md:hidden border-t border-slate-200/60 dark:border-darkBorder/60">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchVal}
              onChange={e => {
                setSearchVal(e.target.value);
                if (onSearch) onSearch(e.target.value);
              }}
              placeholder="Buscar producto o marca de USA..."
              className="w-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-16 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 transition-colors"
            />
            <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">
              search
            </span>
            <button
              type="submit"
              className="absolute right-1 top-1/2 -translate-y-1/2 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-bold"
            >
              Buscar
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
