'use client';

import React from 'react';

const CATEGORIES = [
  { name: 'Todos', slug: 'todos', isFilter: true },
  { name: 'Tecnología', slug: 'Tecnología' },
  { name: 'Apple', slug: 'Apple' },
  { name: 'Perfumes', slug: 'Perfumes' },
  { name: 'Belleza', slug: 'Belleza' },
  { name: 'Relojes', slug: 'Relojes' },
  { name: 'Moda', slug: 'Moda' },
  { name: 'Zapatillas', slug: 'Zapatillas' },
  { name: 'Suplementos', slug: 'Suplementos' },
  { name: 'Hogar', slug: 'Hogar' },
];

interface CategoryPillsProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export function CategoryPills({
  activeCategory = 'todos',
  onSelectCategory,
}: CategoryPillsProps) {
  const scrollToCatalog = () => {
    const el = document.getElementById('catalogo');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleClick = (e: React.MouseEvent, catSlug: string) => {
    e.preventDefault();
    if (onSelectCategory) {
      onSelectCategory(catSlug);
    }
    // Pequeño delay para que React actualice el estado antes del scroll
    setTimeout(scrollToCatalog, 80);
  };

  return (
    <div className="border-b border-slate-200/60 dark:border-darkBorder/60 bg-white/70 dark:bg-darkCard/70 backdrop-blur-md sticky top-14 sm:top-[70px] z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4 overflow-x-auto text-xs font-semibold text-slate-600 dark:text-slate-300 no-scrollbar">
        {/* Pills de Categorías */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory.toLowerCase() === cat.slug.toLowerCase();
            return (
              <a
                key={cat.slug}
                href="#catalogo"
                onClick={e => handleClick(e, cat.slug)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-[0.98] ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100/80 dark:bg-darkElevated hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {cat.name}
              </a>
            );
          })}
        </div>

        {/* Accesos Directos a Stock y Link */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <a
            href="#catalogo"
            onClick={e => handleClick(e, 'stock')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-extrabold transition-all active:scale-[0.98] ${
              activeCategory === 'stock'
                ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Stock Lima</span>
          </a>

          <a
            href="#pedir-link"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-extrabold hover:bg-amber-500/25 active:scale-[0.98] transition-all"
          >
            <span className="material-symbols-outlined text-sm">link</span>
            <span>Pedir Link</span>
          </a>
        </div>
      </div>
    </div>
  );
}
