'use client';

import React, { useState, useEffect } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailModal({ product, isOpen, onClose }: ProductDetailModalProps) {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Reset quantity and handle mounting animation
  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setAddedAnimation(false);
      // Small timeout to allow DOM to render before triggering CSS transition (Emil Kowalski pattern)
      requestAnimationFrame(() => setMounted(true));
      document.body.style.overflow = 'hidden';
    } else {
      setMounted(false);
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !product) return null;

  const isStock = product.delivery?.toLowerCase().includes('stock');
  const isSoldOut = product.delivery?.toLowerCase().includes('agotado');
  const totalPrice = (product.price * quantity).toFixed(2);

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity(q => q - 1);
    }
  };

  const handleIncrease = () => {
    setQuantity(q => q + 1);
  };

  const handleAddToCart = () => {
    addToCart(product.name, product.price, quantity);
    setAddedAnimation(true);
    setTimeout(() => {
      setAddedAnimation(false);
    }, 1200);
  };

  const whatsappMessage = encodeURIComponent(
`🛍️ *STORE BASS — COMPRA DIRECTA* 🇺🇸✈️🇵🇪
─────────────────────────
👋 ¡Hola Johan Tovar! Vi este producto en el catálogo y deseo asegurar mi pedido:

📦 *PRODUCTO:* ${product.name}
🏷️ *CATEGORÍA:* ${product.category}
🔢 *CANTIDAD:* ${quantity} unidad(es)
💰 *PRECIO UNITARIO:* S/ ${product.price.toFixed(2)}
💵 *TOTAL A PAGAR:* S/ ${totalPrice}
🚚 *ENTREGA:* ${product.delivery}

✈️ *PRÓXIMO VIAJE:* Vuelo 20 Oct ➔ Entrega en Lima 29 Oct
🛡️ *GARANTÍA:* Compra física en tienda oficial de USA con recibo

─────────────────────────
¿Me confirmas disponibilidad y los datos para reservar mi entrega? ¡Muchas gracias! 🙌`
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6"
    >
      {/* 1. Backdrop con fade y blur sutil */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-200 ease-out ${
          mounted ? 'opacity-100' : 'opacity-0'
        }`}
      />

      {/* 2. Dialog Modal - Emil Kowalski Motion: scale(0.95) a scale(1.0) con curva cubic-bezier(0.23, 1, 0.32, 1) */}
      <div
        className={`relative w-full max-w-2xl bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder rounded-3xl shadow-2xl overflow-hidden z-10 transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] origin-center max-h-[90vh] flex flex-col ${
          mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          aria-label="Cerrar ventana"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-slate-100/90 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-transform active:scale-90"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        <div className="overflow-y-auto p-5 sm:p-7 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Imagen Principal con zoom sutil */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-square border border-slate-200/60 dark:border-darkBorder/60 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.img}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-900/90 text-white backdrop-blur-sm">
                  {product.category}
                </span>
                {isStock ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                    Stock Lima
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-600 text-white shadow-sm">
                    <span className="material-symbols-outlined text-xs">flight_land</span>
                    {product.delivery || 'Entrega por coordinar'}
                  </span>
                )}
              </div>
            </div>

            {/* Detalles del Producto */}
            <div className="flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Detalles del Producto
                </span>
                <h2
                  id="product-modal-title"
                  className="text-lg sm:text-xl font-black text-slate-900 dark:text-white font-display mt-1 leading-snug"
                >
                  {product.name}
                </h2>

                {product.description && <p className="mt-3 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{product.description}</p>}
                {/* Precios */}
                <div className="mt-3 flex items-baseline gap-2.5">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    S/ {product.price.toFixed(2)}
                  </span>
                  {product.regularPrice && product.regularPrice > product.price && (
                    <span className="text-sm font-semibold text-slate-400 line-through">
                      S/ {product.regularPrice.toFixed(2)}
                    </span>
                  )}
                </div>

                {/* Disponibilidad y Logística */}
                <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-darkElevated/60 border border-slate-200/60 dark:border-darkBorder/60 space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-semibold">
                    <span className="material-symbols-outlined text-emerald-500 text-sm">schedule</span>
                    <span>{product.delivery}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px]">
                    <span className="material-symbols-outlined text-amber-500 text-sm">verified</span>
                    <span>100% Original con comprobante de compra en USA</span>
                  </div>
                </div>
              </div>

              {/* Selector de Cantidades - Emil Kowalski Tactile Buttons */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Cantidad:</span>
                  <span className="text-slate-400 font-normal">
                    Subtotal: <strong className="text-slate-900 dark:text-white font-bold">S/ {totalPrice}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-2xl p-1 bg-slate-50 dark:bg-darkElevated">
                    <button
                      type="button"
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                      aria-label="Disminuir cantidad"
                      className="w-8 h-8 rounded-xl bg-white dark:bg-darkCard text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center font-bold text-base transition-transform active:scale-90 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">remove</span>
                    </button>
                    <span className="w-12 text-center font-black text-sm text-slate-900 dark:text-white">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={handleIncrease}
                      aria-label="Aumentar cantidad"
                      className="w-8 h-8 rounded-xl bg-white dark:bg-darkCard text-slate-700 dark:text-slate-200 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center font-bold text-base transition-transform active:scale-90 shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>

                  {/* Botón Agregar al Carrito */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={isSoldOut}
                    className={`flex-1 py-3 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-150 active:scale-[0.97] shadow-md ${
                      addedAnimation
                        ? 'bg-emerald-500 text-white'
                        : isSoldOut
                        ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-base">
                      {addedAnimation ? 'check_circle' : 'add_shopping_cart'}
                    </span>
                    <span>
                      {addedAnimation ? '¡Agregado al carrito!' : `Agregar (${quantity}) al carrito`}
                    </span>
                  </button>
                </div>
              </div>

              {/* Botón Directo WhatsApp */}
              <a
                href={`https://wa.me/51960759244?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
              >
                <WhatsAppIcon className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Pedir directo por WhatsApp (S/ {totalPrice})</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
