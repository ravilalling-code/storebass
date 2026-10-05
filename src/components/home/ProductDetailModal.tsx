'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';
import { WhatsAppIcon } from '@/components/ui/WhatsAppIcon';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

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
  const [gallery, setGallery] = useState<string[]>([]);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!isOpen || !product) return;
    setQuantity(1);
    setAddedAnimation(false);
    setActiveImage(0);
    setGallery(product.img ? [product.img] : []);
    requestAnimationFrame(() => setMounted(true));
    document.body.style.overflow = 'hidden';

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      void supabase
        .from('product_images')
        .select('url,sort_order,is_primary')
        .eq('product_id', product.id)
        .order('is_primary', { ascending: false })
        .order('sort_order', { ascending: true })
        .then(({ data, error }) => {
          if (!error && data?.length) {
            const urls = data.map(row => row.url).filter(Boolean);
            if (urls.length) setGallery(Array.from(new Set(urls)));
          }
        });
    }

    return () => {
      setMounted(false);
      document.body.style.overflow = '';
    };
  }, [isOpen, product]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && gallery.length > 1) setActiveImage(i => (i - 1 + gallery.length) % gallery.length);
      if (e.key === 'ArrowRight' && gallery.length > 1) setActiveImage(i => (i + 1) % gallery.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, gallery.length]);

  const image = gallery[activeImage] || product?.img || '';
  const totalPrice = useMemo(() => product ? (product.price * quantity).toFixed(2) : '0.00', [product, quantity]);
  if (!isOpen || !product) return null;

  const isStock = product.delivery?.toLowerCase().includes('stock');
  const isSoldOut = product.delivery?.toLowerCase().includes('agotado');
  const regularPrice = product.regular_price ?? product.regularPrice;

  const handleAddToCart = () => {
    addToCart(product.name, product.price, quantity);
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };

  const whatsappMessage = encodeURIComponent(`🛍️ STORE BASS — COMPRA DIRECTA\n\nProducto: ${product.name}\nCategoría: ${product.category}\nCantidad: ${quantity}\nPrecio unitario: S/ ${product.price.toFixed(2)}\nTotal: S/ ${totalPrice}\nEntrega: ${product.delivery}\n\n¿Me confirmas disponibilidad y los datos para reservar mi entrega?`);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="product-modal-title" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div onClick={onClose} className={`fixed inset-0 bg-slate-950/75 backdrop-blur-sm transition-opacity ${mounted ? 'opacity-100' : 'opacity-0'}`} />
      <div className={`relative z-10 w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-2xl bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder shadow-2xl transition-all ${mounted ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}>
        <button onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-4 z-30 w-10 h-10 rounded-full bg-white/95 dark:bg-slate-800 shadow border border-slate-200 dark:border-slate-700 flex items-center justify-center">
          <span className="material-symbols-outlined">close</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_.85fr] gap-0">
          <section className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/30">
            <div className="flex gap-3">
              {gallery.length > 1 && (
                <div className="hidden sm:flex w-20 shrink-0 flex-col gap-2 max-h-[520px] overflow-y-auto">
                  {gallery.map((url, index) => (
                    <button key={`${url}-${index}`} onClick={() => setActiveImage(index)} className={`relative aspect-square overflow-hidden rounded-xl border-2 bg-white ${activeImage === index ? 'border-amber-500' : 'border-slate-200 dark:border-slate-700'}`}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={url} alt={`${product.name} ${index + 1}`} className="w-full h-full object-contain" />
                    </button>
                  ))}
                </div>
              )}
              <div className="relative flex-1 aspect-square max-h-[560px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt={product.name} className="w-full h-full object-contain p-3 sm:p-6 transition-transform duration-300 group-hover:scale-[1.03]" />
                {gallery.length > 1 && <>
                  <button aria-label="Imagen anterior" onClick={() => setActiveImage(i => (i - 1 + gallery.length) % gallery.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 text-white flex items-center justify-center"><span className="material-symbols-outlined">chevron_left</span></button>
                  <button aria-label="Imagen siguiente" onClick={() => setActiveImage(i => (i + 1) % gallery.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/70 text-white flex items-center justify-center"><span className="material-symbols-outlined">chevron_right</span></button>
                </>}
                <div className="absolute left-3 top-3 flex flex-col gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-slate-900/90 text-white">{product.category}</span>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase text-white ${isStock ? 'bg-emerald-500' : 'bg-blue-600'}`}>{product.delivery || 'Entrega por coordinar'}</span>
                </div>
              </div>
            </div>
            {gallery.length > 1 && (
              <div className="sm:hidden mt-3 flex gap-2 overflow-x-auto pb-1">
                {gallery.map((url, index) => <button key={`${url}-${index}`} onClick={() => setActiveImage(index)} className={`w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 bg-white ${activeImage === index ? 'border-amber-500' : 'border-slate-200'}`}><img src={url} alt="" className="w-full h-full object-contain" /></button>)}
              </div>
            )}
          </section>

          <section className="p-5 sm:p-7 lg:p-8 flex flex-col">
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wider">Detalles del producto</p>
            <h2 id="product-modal-title" className="mt-2 pr-10 text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{product.name}</h2>
            <div className="mt-4 flex items-baseline gap-3">
              <span className="text-3xl font-black text-slate-900 dark:text-white">S/ {product.price.toFixed(2)}</span>
              {regularPrice && regularPrice > product.price && <span className="text-sm text-slate-400 line-through">S/ {regularPrice.toFixed(2)}</span>}
            </div>
            <div className="mt-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4 space-y-2 text-sm">
              <div className="flex gap-2"><span className="material-symbols-outlined text-emerald-500 text-lg">local_shipping</span><span>{product.delivery}</span></div>
              <div className="flex gap-2"><span className="material-symbols-outlined text-amber-500 text-lg">verified</span><span>Producto original con comprobante de compra.</span></div>
              {gallery.length > 1 && <div className="flex gap-2"><span className="material-symbols-outlined text-blue-500 text-lg">photo_library</span><span>{gallery.length} fotos disponibles</span></div>}
            </div>
            {product.description && <div className="mt-5"><h3 className="font-black text-sm text-slate-900 dark:text-white">Información adicional</h3><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{product.description}</p></div>}

            <div className="mt-auto pt-6 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold"><span>Cantidad</span><span>Subtotal: S/ {totalPrice}</span></div>
              <div className="flex gap-3">
                <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-11 flex items-center justify-center"><span className="material-symbols-outlined">remove</span></button>
                  <span className="w-10 text-center font-black">{quantity}</span>
                  <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-11 flex items-center justify-center"><span className="material-symbols-outlined">add</span></button>
                </div>
                <button onClick={handleAddToCart} disabled={isSoldOut} className={`flex-1 rounded-xl font-black text-sm ${addedAnimation ? 'bg-emerald-500 text-white' : isSoldOut ? 'bg-slate-300 text-slate-500' : 'bg-amber-500 hover:bg-amber-400 text-slate-950'}`}>{addedAnimation ? '¡Agregado!' : 'Agregar al carrito'}</button>
              </div>
              <a href={`https://wa.me/51960759244?text=${whatsappMessage}`} target="_blank" rel="noopener noreferrer" className="w-full py-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs flex items-center justify-center gap-2"><WhatsAppIcon className="w-4 h-4" />Pedir por WhatsApp</a>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
