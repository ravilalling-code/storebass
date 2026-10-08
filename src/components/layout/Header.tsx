'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTheme } from '@/context/ThemeContext';
import { useCart } from '@/context/CartContext';
import { INITIAL_PRODUCTS } from '@/data/initialCatalog';
import { Product } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export function Header({ onSearch }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { count, toggleCart } = useCart();
  const [searchVal, setSearchVal] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showMobileSuggestions, setShowMobileSuggestions] = useState(false);
  const [catalogProducts, setCatalogProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  const desktopSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);

  // Sincronización en vivo con productos de Supabase Cloud y caché local
  useEffect(() => {
    const loadCatalog = async () => {
      // 1. Respaldo local
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('storebass_products');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCatalogProducts(parsed);
            }
          } catch {}
        }
      }

      // 2. Consulta a Supabase Cloud
      const supabase = getSupabaseBrowserClient();
      if (!supabase) return;

      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('display_order', { ascending: true })
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          const mapped: Product[] = data.map((p: any) => ({
            id: p.id,
            name: p.name,
            category: p.category,
            regularPrice: Number(p.regular_price ?? p.regularPrice ?? p.price * 1.15),
            price: Number(p.offer_active && p.offer_price ? p.offer_price : p.price),
            offer_price: p.offer_price == null ? null : Number(p.offer_price),
            delivery: p.delivery,
            img: p.img,
            active: p.active ?? true,
          }));
          setCatalogProducts(mapped);
          if (typeof window !== 'undefined') {
            localStorage.setItem('storebass_products', JSON.stringify(mapped));
          }
        }
      } catch (err) {
        console.warn('[Header] Error cargando productos sincronizados para búsqueda:', err);
      }
    };

    void loadCatalog();
    window.addEventListener('storebass_products_updated', loadCatalog);
    return () => window.removeEventListener('storebass_products_updated', loadCatalog);
  }, []);

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node)) {
        setShowMobileSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrado de sugerencias en tiempo real
  const getSuggestions = (query: string): Product[] => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Si el input está enfocado pero vacío, mostrar los 5 productos más destacados
      return catalogProducts.slice(0, 5);
    }
    return catalogProducts
      .filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
      .slice(0, 6);
  };

  const filteredSuggestions = getSuggestions(searchVal);

  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(searchVal);
    setShowSuggestions(false);
    setShowMobileSuggestions(false);
    setTimeout(scrollToCatalog, 50);
  };

  const handleSelectProduct = (product: Product) => {
    setSearchVal(product.name);
    if (onSearch) onSearch(product.name);
    setShowSuggestions(false);
    setShowMobileSuggestions(false);
    setTimeout(scrollToCatalog, 50);
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

          {/* Buscador Central Sincronizado (Desktop) */}
          <div ref={desktopSearchRef} className="flex-1 max-w-lg hidden md:block relative">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearchVal(val);
                  setShowSuggestions(true);
                  if (onSearch) onSearch(val);
                }}
                onFocus={() => setShowSuggestions(true)}
                placeholder="Busca un producto del catálogo o marca de USA..."
                className="w-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl pl-11 pr-20 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all placeholder:text-slate-400"
              />
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg pointer-events-none">
                search
              </span>
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95"
              >
                Buscar
              </button>
            </form>

            {/* Dropdown Sugerencias en Vivo */}
            {showSuggestions && (
              <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-2xl shadow-2xl p-2 z-50 animate-pop overflow-hidden">
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {searchVal.trim() ? `Productos que coinciden (${filteredSuggestions.length})` : 'Productos destacados del catálogo'}
                  </span>
                  <span className="text-[10px] text-amber-500 font-bold">En tiempo real</span>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-1 no-scrollbar">
                  {filteredSuggestions.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      No hay productos exactos. Presiona <strong className="text-amber-500">Buscar</strong> para filtrar todo el catálogo o pide por link.
                    </div>
                  ) : (
                    filteredSuggestions.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleSelectProduct(product)}
                        className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors flex items-center justify-between gap-3 group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.img}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-amber-500 transition-colors">
                              {product.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-medium">{product.category}</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                                {product.delivery?.toLowerCase().includes('stock') ? 'Stock Lima' : 'Llega 29 Oct'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            S/ {product.price.toFixed(2)}
                          </span>
                          <span className="material-symbols-outlined text-xs text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all">
                            arrow_forward
                          </span>
                        </div>
                      </button>
                    ))
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
              <span
                className="material-symbols-outlined text-lg text-amber-500 group-hover:scale-110 transition-transform"
                style={{ fontVariationSettings: '"FILL" 1' }}
              >
                flight_takeoff
              </span>
              <span>Seguimiento</span>
            </a>

            {/* Ícono de Login / Admin */}
            <Link
              href="/admin"
              title="Panel Administrativo"
              aria-label="Panel Administrativo"
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

        {/* Buscador Sincronizado para Dispositivos Móviles */}
        <div ref={mobileSearchRef} className="py-2.5 md:hidden border-t border-slate-200/60 dark:border-darkBorder/60 relative">
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={searchVal}
              onChange={(e) => {
                const val = e.target.value;
                setSearchVal(val);
                setShowMobileSuggestions(true);
                if (onSearch) onSearch(val);
              }}
              onFocus={() => setShowMobileSuggestions(true)}
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

          {/* Dropdown de Sugerencias en Móvil */}
          {showMobileSuggestions && (
            <div className="absolute top-full left-0 w-full mt-1 bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-2xl shadow-2xl p-2 z-50 animate-pop overflow-hidden">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 border-b border-slate-100 dark:border-slate-800 mb-1">
                {searchVal.trim() ? `Resultados (${filteredSuggestions.length})` : 'Productos recomendados'}
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1 no-scrollbar">
                {filteredSuggestions.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-400">
                    No hay productos exactos. Pulsa Buscar para filtrar todo el catálogo.
                  </div>
                ) : (
                  filteredSuggestions.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleSelectProduct(product)}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/70 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 border border-slate-200/60 dark:border-slate-700/60">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={product.img} alt={product.name} className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{product.name}</div>
                          <div className="text-[10px] text-slate-400 truncate">{product.category}</div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-amber-500 flex-shrink-0">
                        S/ {product.price.toFixed(2)}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
