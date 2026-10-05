'use client';

import React, { useState } from 'react';
import { ProductCard } from './ProductCard';
import { INITIAL_PRODUCTS } from '@/data/initialCatalog';
import { Product } from '@/lib/types';

interface CatalogSectionProps {
  products?: Product[];
  activeCategoryFilter?: string;
  searchFilter?: string;
}

export function CatalogSection({
  products = INITIAL_PRODUCTS,
  activeCategoryFilter = 'todos',
  searchFilter = '',
}: CatalogSectionProps) {
  const [selectedCat, setSelectedCat] = useState(activeCategoryFilter);
  const [selectedDisp, setSelectedDisp] = useState('todos');
  const [selectedPrice, setSelectedPrice] = useState('todos');

  // Filtrado reactivo
  const filteredProducts = products.filter(p => {
    // 1. Filtro global o seleccionado de categoría
    const cat = selectedCat !== 'todos' ? selectedCat : activeCategoryFilter;
    if (cat !== 'todos') {
      if (cat === 'stock') {
        if (!p.delivery?.toLowerCase().includes('stock')) return false;
      } else if (cat.toLowerCase() === 'apple') {
        if (!p.name.toLowerCase().includes('apple') && !p.name.toLowerCase().includes('iphone') && !p.name.toLowerCase().includes('macbook')) {
          return false;
        }
      } else if (p.category.toLowerCase() !== cat.toLowerCase()) {
        return false;
      }
    }

    // 2. Filtro de disponibilidad
    if (selectedDisp === 'stock' && !p.delivery?.toLowerCase().includes('stock')) return false;
    if (selectedDisp === 'viaje' && !p.delivery?.toLowerCase().includes('octubre')) return false;
    if (selectedDisp === 'ultimos' && !p.delivery?.toLowerCase().includes('cupo')) return false;

    // 3. Filtro de precio
    if (selectedPrice === '0-200' && p.price > 200) return false;
    if (selectedPrice === '200-600' && (p.price < 200 || p.price > 600)) return false;
    if (selectedPrice === '600+' && p.price < 600) return false;

    // 4. Búsqueda por texto
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchCat = p.category.toLowerCase().includes(q);
      if (!matchName && !matchCat) return false;
    }

    return true;
  });

  const resetFilters = () => {
    setSelectedCat('todos');
    setSelectedDisp('todos');
    setSelectedPrice('todos');
  };

  // Agrupaciones por sección para vista por bloques
  const stockProducts = filteredProducts.filter(p => p.delivery?.toLowerCase().includes('stock'));
  const tripProducts = filteredProducts.filter(p => p.delivery?.toLowerCase().includes('octubre'));
  const perfumeProducts = filteredProducts.filter(p => p.category.toLowerCase() === 'perfumes');
  const beautyProducts = filteredProducts.filter(p => p.category.toLowerCase() === 'belleza');
  const techProducts = filteredProducts.filter(p => p.category.toLowerCase() === 'tecnología');
  const watchProducts = filteredProducts.filter(p => p.category.toLowerCase() === 'relojes');

  return (
    <div id="catalogo" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-16">
      {/* Barra de Filtros del Catálogo */}
      <div className="p-5 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-card-subtle flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-amber-500 text-xl">tune</span>
          <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Filtrar catálogo:
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-1 max-w-3xl">
          {/* Filtro Categoría */}
          <select
            value={selectedCat}
            onChange={e => setSelectedCat(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todas las categorías</option>
            <option value="Perfumes">Perfumes</option>
            <option value="Belleza">Belleza y Skincare</option>
            <option value="Tecnología">Tecnología y Apple</option>
            <option value="Relojes">Relojes y Moda</option>
          </select>

          {/* Filtro Disponibilidad */}
          <select
            value={selectedDisp}
            onChange={e => setSelectedDisp(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Cualquier disponibilidad</option>
            <option value="stock">En stock en Lima (inmediato)</option>
            <option value="viaje">Llega en próximo regreso (29 Oct)</option>
            <option value="ultimos">Últimos cupos</option>
          </select>

          {/* Filtro Rango de Precio */}
          <select
            value={selectedPrice}
            onChange={e => setSelectedPrice(e.target.value)}
            className="bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl px-3 py-2 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-amber-500"
          >
            <option value="todos">Todos los precios</option>
            <option value="0-200">Hasta S/ 200</option>
            <option value="200-600">S/ 200 a S/ 600</option>
            <option value="600+">Más de S/ 600</option>
          </select>

          {/* Botón Reset */}
          <button
            onClick={resetFilters}
            className="px-3 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-amber-500 hover:text-slate-950 transition-colors"
          >
            Restablecer
          </button>
        </div>
      </div>

      {/* Si hay un filtro activo específico, mostrar grilla filtrada unificada */}
      {selectedCat !== 'todos' || selectedDisp !== 'todos' || selectedPrice !== 'todos' || searchFilter.trim() ? (
        <section className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              Resultados de búsqueda ({filteredProducts.length})
            </h2>
          </div>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <span className="material-symbols-outlined text-4xl mb-2">search_off</span>
              <p className="text-sm font-bold">No se encontraron productos con esos filtros.</p>
              <button
                onClick={resetFilters}
                className="mt-3 px-4 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {filteredProducts.map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          )}
        </section>
      ) : (
        <>
          {/* BLOQUE A: "En stock, llévalo hoy" */}
          <section id="en-stock-hoy" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Entrega inmediata en Lima y envíos a provincia</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
                  En stock, llévalo hoy
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Productos disponibles ahora mismo en almacén de Lima. Sin esperas de viaje.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {stockProducts.slice(0, 4).map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>

          {/* BLOQUE B: "Llega en mi próximo regreso" */}
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-base">flight_land</span>
                  <span>Reserva hoy para mi llegada el 29 de Octubre</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
                  Llega en mi próximo regreso
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Artículos traídos directamente en mi equipaje desde tiendas oficiales de Estados Unidos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {tripProducts.slice(0, 4).map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>

          {/* BLOQUE C: "Perfumes & Fragancias" */}
          <section id="fragancias" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-500 uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-base">local_florist</span>
                  <span>Originales con Batch Code Verificable</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
                  Perfumes y Fragancias
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Marcas de diseñador y nicho traídas de tiendas de Estados Unidos.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {perfumeProducts.slice(0, 4).map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>

          {/* BLOQUE D: "Belleza & Sephora" */}
          <section id="belleza" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-rose-500 uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-base">spa</span>
                  <span>Sephora, Ulta & Marcas Virales</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
                  Belleza y Skincare
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Los productos de cuidado facial y maquillaje más virales comprados en tiendas autorizadas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {beautyProducts.slice(0, 4).map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>

          {/* BLOQUE E: "Tecnología" */}
          <section id="tecnologia" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-blue-500 uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-base">devices</span>
                  <span>Audio, Smart Home & Accesorios</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
                  Tecnología y Gadgets
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Dispositivos originales con garantía de fábrica y recibo de compra en USA.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {techProducts.slice(0, 4).map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>

          {/* BLOQUE F: "Relojes & Moda" */}
          <section id="relojes" className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 uppercase tracking-wider mb-1">
                  <span className="material-symbols-outlined text-base">watch</span>
                  <span>Relojes Originales y Accesorios</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-display">
                  Relojes y Moda
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Relojes clásicos, deportivos y de moda adquiridos en boutiques oficiales de USA.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {watchProducts.slice(0, 4).map(prod => (
                <ProductCard key={prod.id} product={prod} />
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
