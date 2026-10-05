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
  { name: 'Juguetes', slug: 'Juguetes' },
  { name: 'Deportes', slug: 'Deportes' },
  { name: 'Hogar', slug: 'Hogar' },
  { name: 'Mascotas', slug: 'Mascotas' },
  { name: 'Autos', slug: 'Autos' },
];

interface CategoryPillsProps {
  activeCategory?: string;
  onSelectCategory?: (category: string) => void;
}

export function CategoryPills({
  activeCategory = 'todos',
  onSelectCategory,
}: CategoryPillsProps) {
  const handleClick = (e: React.MouseEvent, catSlug: string) => {
    if (onSelectCategory) {
      e.preventDefault();
      onSelectCategory(catSlug);
    }
  };

  return (
    <div className="border-t border-slate-200/60 dark:border-darkBorder/60 py-2 flex items-center justify-between gap-4 overflow-x-auto text-xs font-semibold text-slate-600 dark:text-slate-300 no-scrollbar">
      <div className="flex items-center gap-2 flex-shrink-0">
        {CATEGORIES.map(cat => {
          const isActive = activeCategory.toLowerCase() === cat.slug.toLowerCase();
          return (
            <a
              key={cat.slug}
              href="#catalogo"
              onClick={e => handleClick(e, cat.slug)}
              className={`px-3 py-1 rounded-full transition-colors ${
                isActive
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold'
                  : 'hover:bg-slate-200 dark:hover:bg-slate-800'
              }`}
            >
              {cat.name}
            </a>
          );
        })}
      </div>

      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Destacado: En stock */}
        <a
          href="#en-stock-hoy"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-xs font-black hover:bg-emerald-500/25 transition-all"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>En stock en Lima</span>
        </a>

        {/* Destacado: Pide por link */}
        <a
          href="#pedir-link"
          className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-black hover:bg-amber-500/25 transition-all"
        >
          <span className="material-symbols-outlined text-sm">link</span>
          <span>Pide por link</span>
        </a>
      </div>
    </div>
  );
}
