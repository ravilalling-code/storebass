'use client';

import React, { useState, useEffect } from 'react';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { INITIAL_PRODUCTS } from '@/data/initialCatalog';
import { Product } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface CatalogSectionProps {
  products?: Product[];
  activeCategoryFilter?: string;
  searchFilter?: string;
  onSelectCategory?: (category: string) => void;
}



export function CatalogSection({
  products = INITIAL_PRODUCTS,
  activeCategoryFilter = 'todos',
  searchFilter = '',
  onSelectCategory,
}: CatalogSectionProps) {
  const [currentProducts, setCurrentProducts] = useState<Product[]>(products);
  const [selectedCat, setSelectedCat] = useState(activeCategoryFilter);
  const [selectedDisp, setSelectedDisp] = useState('todos');
  const [selectedSort, setSelectedSort] = useState<'default' | 'price-asc' | 'price-desc'>('default');
  const [selectedProductForModal, setSelectedProductForModal] = useState<Product | null>(null);

  // Carga reactiva de productos desde Supabase Cloud con respaldo local
  useEffect(() => {
    const loadProducts = async () => {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        try {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('active', true)
            .order('created_at', { ascending: false });

          if (!error && data) {
            const mapped: Product[] = data.map((p: any) => ({
              id: p.id,
              name: p.name,
              description: p.description || '',
              category: p.category,
              regularPrice: Number(p.regular_price || p.regularPrice || p.price * 1.15),
              price: Number(p.price),
              delivery: p.delivery,
              img: p.img,
              active: p.active ?? true,
            }));
            setCurrentProducts(mapped);
            return;
          }
        } catch (e) {
          console.warn('Error fetching products from Supabase:', e);
        }
      }

      // Respaldo en localStorage si no hay conexión o aún no se han subido
      if (typeof window !== 'undefined') {
        const local = localStorage.getItem('storebass_products');
        if (local) {
          try {
            const parsed = JSON.parse(local);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setCurrentProducts(parsed);
              return;
            }
          } catch (e) {
            console.error(e);
          }
        }
      }
      setCurrentProducts(products);
    };

    loadProducts();

    if (typeof window !== 'undefined') {
      window.addEventListener('storebass_products_updated', loadProducts);
      return () => {
        window.removeEventListener('storebass_products_updated', loadProducts);
      };
    }
  }, [products]);

  // Sincronizar si cambia desde la barra superior de categoría o buscador
  useEffect(() => {
    if (activeCategoryFilter) {
      setSelectedCat(activeCategoryFilter);
    }
  }, [activeCategoryFilter]);



  // Filtrado reactivo de productos
  let filteredProducts = currentProducts.filter((p) => {
    // 1. Filtro de Categoría
    if (selectedCat !== 'todos') {
      if (selectedCat === 'stock') {
        if (!p.delivery?.toLowerCase().includes('stock')) return false;
      } else if (selectedCat.toLowerCase() === 'apple') {
        const isAppleName =
          p.name.toLowerCase().includes('apple') ||
          p.name.toLowerCase().includes('iphone') ||
          p.name.toLowerCase().includes('macbook') ||
          p.name.toLowerCase().includes('airpods');
        const isAppleCat = p.category.toLowerCase() === 'apple';
        if (!isAppleName && !isAppleCat) return false;
      } else if (p.category.toLowerCase() !== selectedCat.toLowerCase()) {
        return false;
      }
    }

    // 2. Filtro de Disponibilidad secundaria
    if (selectedDisp === 'stock' && !p.delivery?.toLowerCase().includes('stock')) return false;
    if (selectedDisp === 'pedido' && p.delivery?.toLowerCase() !== 'solo a pedido') return false;
    if (selectedDisp === 'viaje' && !p.delivery?.toLowerCase().includes('octubre')) return false;

    // 3. Filtro de Búsqueda
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }

    return true;
  });

  // Ordenamiento
  if (selectedSort === 'price-asc') {
    filteredProducts = [...filteredProducts].sort((a, b) => a.price - b.price);
  } else if (selectedSort === 'price-desc') {
    filteredProducts = [...filteredProducts].sort((a, b) => b.price - a.price);
  }

  const resetFilters = () => {
    setSelectedCat('todos');
    setSelectedDisp('todos');
    setSelectedSort('default');
    if (onSelectCategory) onSelectCategory('todos');
  };

  return (
    <section id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 py-10 space-y-8">
      {/* 1. Encabezado Maestro Unificado (Cero duplicidad) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-darkBorder">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-wider mb-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            <span>Catálogo Oficial de Compras</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white font-display">
            {selectedCat === 'todos'
              ? 'Catálogo del Viaje a USA'
              : selectedCat === 'stock'
              ? 'En Stock en Lima'
              : `${selectedCat} — Importado de USA`}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
            Artículos 100% originales comprados en tiendas autorizadas de USA con precio final en Soles.
          </p>
        </div>

        {/* Contador y Estado */}
        <div className="flex items-center gap-3 self-start md:self-end">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {filteredProducts.length} productos disponibles
          </span>
          {(selectedCat !== 'todos' || selectedDisp !== 'todos' || selectedSort !== 'default') && (
            <button
              onClick={resetFilters}
              className="text-xs text-amber-500 hover:text-amber-400 font-bold underline transition-colors"
            >
              Ver todos
            </button>
          )}
        </div>
      </div>

      {/* 3. Barra de Control Compacta (Ordenar y Disponibilidad) */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-darkElevated/50 border border-slate-200/60 dark:border-darkBorder/60 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="material-symbols-outlined text-slate-400 text-base">tune</span>
          <span className="font-bold text-slate-600 dark:text-slate-300">Filtro rápido:</span>
          <button
            onClick={() => setSelectedDisp(selectedDisp === 'stock' ? 'todos' : 'stock')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              selectedDisp === 'stock'
                ? 'bg-emerald-500 text-white'
                : 'bg-white dark:bg-darkCard text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-darkBorder'
            }`}
          >
            Solo Stock Lima
          </button>
          <button
            onClick={() => setSelectedDisp(selectedDisp === 'viaje' ? 'todos' : 'viaje')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-colors ${
              selectedDisp === 'viaje'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-darkCard text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-darkBorder'
            }`}
          >
            Llegada 29 Octubre
          </button>
          <button type="button" onClick={() => setSelectedDisp(selectedDisp === 'pedido' ? 'todos' : 'pedido')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border ${selectedDisp === 'pedido' ? 'bg-amber-500 text-slate-950 border-amber-500' : 'text-slate-500 border-slate-300 dark:border-slate-700'}`}>Solo a pedido</button>

        </div>

        {/* Ordenar */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px]">Ordenar por:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value as any)}
            className="bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-xl px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="default">Recomendados</option>
            <option value="price-asc">Precio: Menor a Mayor</option>
            <option value="price-desc">Precio: Mayor a Menor</option>
          </select>
        </div>
      </div>

      {/* 4. Grilla Única y Fluida de Productos */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder rounded-3xl p-8 space-y-3">
          <span className="material-symbols-outlined text-4xl text-slate-400">search_off</span>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No se encontraron productos en esta categoría o filtro
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Puedes pedir cualquier producto de USA que no veas aquí pegando tu link en la sección Pedir Link.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              Ver todo el catálogo
            </button>
            <a
              href="#pedir-link"
              className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl transition-all active:scale-[0.98]"
            >
              Pedir por link
            </a>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {filteredProducts.map((prod) => (
            <ProductCard
              key={prod.id}
              product={prod}
              onOpenDetail={setSelectedProductForModal}
            />
          ))}
        </div>
      )}

      {/* Subventana / Modal de Detalle de Producto con Selector de Cantidad */}
      <ProductDetailModal
        product={selectedProductForModal}
        isOpen={!!selectedProductForModal}
        onClose={() => setSelectedProductForModal(null)}
      />
    </section>
  );
}
