'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { TicketModal } from '@/components/cart/TicketModal';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

interface StockProduct {
  id: string;
  name: string;
  category: string;
  brand: string;
  desc: string;
  price: number;
  usd: number;
  stockQty: number;
  icon: string;
  badgeColor?: string;
}

const STOCK_PRODUCTS: StockProduct[] = [
  {
    id: 'airpods-pro-2',
    name: 'AirPods Pro (2da Gen) USB-C MagSafe Case',
    category: 'apple',
    brand: 'Apple Store USA',
    desc: 'Cancelación activa de ruido pro, audio espacial y chip H2.',
    price: 899,
    usd: 241,
    stockQty: 5,
    icon: 'headphones',
  },
  {
    id: 'sony-wh1000xm5',
    name: 'Sony WH-1000XM5 Noise Cancelling Black',
    category: 'audio',
    brand: 'Sony Official USA',
    desc: 'Audífonos inalámbricos líderes en la industria con 30h de batería.',
    price: 1299,
    usd: 349,
    stockQty: 3,
    icon: 'headset',
  },
  {
    id: 'stanley-quencher-rose',
    name: 'Stanley Quencher H2.0 FlowState 40oz',
    category: 'hogar',
    brand: 'Stanley 1913 USA',
    desc: 'Color Rose Quartz original con sorbete giratorio y asa ergonómica.',
    price: 249,
    usd: 67,
    stockQty: 8,
    icon: 'water_bottle',
    badgeColor: 'text-rose-400',
  },
  {
    id: 'bleu-de-chanel',
    name: 'Bleu de Chanel Parfum 100ml Original',
    category: 'perfumes',
    brand: "Macy's / Sephora USA",
    desc: 'Fragancia amaderada aromática de máxima concentración. Sellado.',
    price: 620,
    usd: 166,
    stockQty: 4,
    icon: 'sanitizer',
  },
  {
    id: 'nintendo-switch-oled',
    name: 'Nintendo Switch OLED Mario Red',
    category: 'gaming',
    brand: 'Best Buy USA',
    desc: 'Pantalla OLED 7 pulgadas y diseño exclusivo Mario Red Edition.',
    price: 1350,
    usd: 362,
    stockQty: 2,
    icon: 'sports_esports',
    badgeColor: 'text-red-500',
  },
  {
    id: 'dyson-supersonic',
    name: 'Dyson Supersonic™ Edición Especial',
    category: 'perfumes',
    brand: 'Dyson USA',
    desc: 'Secado rápido sin calor extremo. Incluye 5 accesorios de estilizado.',
    price: 1890,
    usd: 508,
    stockQty: 3,
    icon: 'mode_fan',
    badgeColor: 'text-fuchsia-500',
  },
  {
    id: 'ipad-10th-gen',
    name: 'iPad 10ma Gen 64GB Wi-Fi Silver',
    category: 'apple',
    brand: 'Apple Store USA',
    desc: 'Pantalla Liquid Retina 10.9 pulgadas y potente chip A14 Bionic.',
    price: 1480,
    usd: 397,
    stockQty: 6,
    icon: 'tablet_mac',
  },
  {
    id: 'nike-dunk-panda',
    name: 'Nike Dunk Low Retro "Panda"',
    category: 'moda',
    brand: 'Nike USA Official',
    desc: 'Cuero genuino blanco/negro clásico. Tallas disponibles: 8 a 10.5 US.',
    price: 480,
    usd: 129,
    stockQty: 5,
    icon: 'steps',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'Todos los artículos' },
  { id: 'apple', label: 'Apple Store' },
  { id: 'audio', label: 'Audio & Tech' },
  { id: 'perfumes', label: 'Perfumes & Belleza' },
  { id: 'gaming', label: 'Gaming & Consolas' },
  { id: 'hogar', label: 'Termos & Hogar' },
  { id: 'moda', label: 'Calzado & Moda' },
];

export default function StockLimaPage() {
  const { addToCart, openCart } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');

  const filteredProducts = useMemo(() => {
    return STOCK_PRODUCTS.filter((prod) => {
      const matchCat = selectedCat === 'all' || prod.category === selectedCat;
      const matchSearch =
        !searchTerm.trim() ||
        prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prod.brand.toLowerCase().includes(searchTerm.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [selectedCat, searchTerm]);

  const handleBuyNow = (name: string, price: number) => {
    addToCart(name, price);
    openCart();
  };

  return (
    <div className="min-h-screen flex flex-col pb-16 sm:pb-0">
      <Header />

      <main className="flex-1 pt-6 pb-20 max-w-7xl mx-auto px-4 sm:px-6 w-full">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6">
          <Link href="/" className="hover:text-amber-500 transition-colors">
            Inicio
          </Link>
          <span>/</span>
          <span className="font-bold text-slate-800 dark:text-white">Stock en Lima</span>
        </div>

        {/* Hero Banner Stock Lima */}
        <div className="relative overflow-hidden rounded-3xl sm:rounded-4xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 sm:p-12 text-white shadow-2xl border border-slate-800 mb-8">
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wide border border-emerald-500/30 mb-4 backdrop-blur-sm">
              <span className="material-symbols-outlined text-sm">bolt</span>
              <span>ARTÍCULOS YA NACIONALIZADOS · SIN ESPERAS ADUANERAS</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
              Stock en Lima ·{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-amber-300">
                Entrega Inmediata
              </span>
            </h1>
            <p className="text-xs sm:text-base text-slate-300 leading-relaxed mb-6 font-normal">
              Productos 100% originales traídos de USA, almacenados en nuestros centros de
              distribución de San Isidro y Surco. Recíbelo hoy mismo en Lima Metropolitana o en 24 a
              48h en cualquier departamento del Perú.
            </p>

            {/* 3 Trust Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-medium">
                <span className="material-symbols-outlined text-emerald-400 text-xl">
                  electric_moped
                </span>
                <span>Same-Day en Lima (2 a 4 hrs)</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-medium">
                <span className="material-symbols-outlined text-amber-400 text-xl">
                  receipt_long
                </span>
                <span>Boleta o Factura con IGV</span>
              </div>
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-xs font-medium">
                <span className="material-symbols-outlined text-emerald-400 text-xl">
                  local_shipping
                </span>
                <span>Olva Courier a provincias</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Category Chips */}
        <div className="bg-white dark:bg-darkCard p-4 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-darkBorder shadow-card-subtle mb-8 space-y-4">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
              search
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por producto o marca (Apple, Sony, Stanley, Dyson, Nike, Chanel)..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {CATEGORIES.map((cat) => {
              const isActive = selectedCat === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-500'
                  }`}
                >
                  {cat.label} {cat.id === 'all' && `(${STOCK_PRODUCTS.length})`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {filteredProducts.map((prod) => (
            <div
              key={prod.id}
              className="bg-white dark:bg-darkCard rounded-3xl p-5 border border-slate-200/80 dark:border-darkBorder shadow-card-subtle hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-extrabold border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    Stock Lima: {prod.stockQty} unid.
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400">🇺🇸 Original</span>
                </div>

                <div className="w-full h-44 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4 mb-4 overflow-hidden">
                  <span
                    className={`material-symbols-outlined text-6xl ${
                      prod.badgeColor || 'text-slate-700 dark:text-slate-300'
                    } group-hover:scale-110 transition-transform duration-300`}
                  >
                    {prod.icon}
                  </span>
                </div>

                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {prod.brand}
                </span>
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base leading-snug mt-1 mb-2">
                  {prod.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{prod.desc}</p>
              </div>

              <div>
                <div className="flex items-baseline justify-between mb-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-2xl font-extrabold text-slate-900 dark:text-white">
                      S/ {prod.price.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 block">
                      (${prod.usd} USD · IGV Inc.)
                    </span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">schedule</span> Hoy
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleBuyNow(prod.name, prod.price)}
                    className="flex-1 h-11 rounded-2xl bg-slate-900 dark:bg-white hover:bg-amber-500 dark:hover:bg-amber-400 text-white dark:text-slate-950 font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">flash_on</span>
                    <span>Comprar ahora</span>
                  </button>
                  <button
                    onClick={() => addToCart(prod.name, prod.price)}
                    title="Agregar al carrito"
                    className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">add_shopping_cart</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Delivery Info Banner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white dark:bg-darkCard p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-darkBorder shadow-card-subtle">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">two_wheeler</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Lima Metropolitana: Despacho en 2 a 4 Horas
                </h3>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Motorizado propio con precinto de seguridad
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Cobertura rápida en Miraflores, San Isidro, Surco, San Borja, La Molina, San Miguel,
              Magdalena, Jesús María y distritos aledaños. Aceptamos pago contra entrega con POS o
              transferencia Yape / Plin.
            </p>
          </div>

          <div className="bg-white dark:bg-darkCard p-6 sm:p-8 rounded-3xl border border-slate-200/80 dark:border-darkBorder shadow-card-subtle">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <span className="material-symbols-outlined text-2xl">local_shipping</span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Provincias: Envíos Express en 24 a 48 Horas
                </h3>
                <span className="text-xs text-amber-500 font-semibold">
                  Olva Courier / Shalom asegurado
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Despacho el mismo día con número de guía satelital para Arequipa, Cusco, Trujillo,
              Piura, Chiclayo, Huancayo y todas las ciudades del Perú con entrega en agencia o a
              domicilio.
            </p>
          </div>
        </div>
      </main>

      <Footer />
      <CartDrawer />
      <TicketModal />
      <MobileBottomNav />
    </div>
  );
}
