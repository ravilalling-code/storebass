'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';

interface LinkItem {
  url: string;
  size: string;
  color: string;
  qty: number;
}

export function QuoteLinkSection() {
  const { generateTicket } = useCart();
  const [links, setLinks] = useState<LinkItem[]>([{ url: '', size: '', color: '', qty: 1 }]);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [detectedStore, setDetectedStore] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const detectStoreFromUrl = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes('amazon.')) return 'Amazon USA';
    if (lower.includes('walmart.')) return 'Walmart USA';
    if (lower.includes('bestbuy.')) return 'Best Buy USA';
    if (lower.includes('target.')) return 'Target USA';
    if (lower.includes('nike.')) return 'Nike Official USA';
    if (lower.includes('apple.')) return 'Apple Store USA';
    if (lower.includes('sephora.')) return 'Sephora USA';
    if (lower.includes('ebay.')) return 'eBay USA';
    return null;
  };

  const handleUrlChange = (index: number, val: string) => {
    const updated = [...links];
    updated[index].url = val;
    setLinks(updated);

    if (index === 0) {
      setDetectedStore(detectStoreFromUrl(val));
    }
  };

  const addLinkRow = () => {
    setLinks([...links, { url: '', size: '', color: '', qty: 1 }]);
  };

  const removeLinkRow = (index: number) => {
    if (links.length <= 1) return;
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userPhone.trim()) {
      alert('Por favor ingresa tu Nombre y Celular WhatsApp.');
      return;
    }

    const validLinks = links.filter(l => l.url.trim().length > 0);
    if (validLinks.length === 0) {
      alert('Por favor pega al menos un link de producto de USA.');
      return;
    }

    const detailText = validLinks
      .map(
        (l, i) =>
          `Link ${i + 1}: ${l.url} (Cant: ${l.qty}${l.size ? `, Talla: ${l.size}` : ''}${
            l.color ? `, Color: ${l.color}` : ''
          })`
      )
      .join('\n');

    setLoading(true);
    try {
      await generateTicket({
        cliente: userName.trim(),
        telefono: userPhone.trim(),
        origen: 'Web',
        tipo: 'cotizacion_links',
        detalle: detailText,
        total: 0,
        items: [],
      });
    } catch (err) {
      console.error('Error generando ticket:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="pedir-link" className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-3xl bg-slate-950 text-white border border-slate-800 p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        {/* Glow ambiental */}
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/30">
              Comprador Personal a tu servicio
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-display">
              Si existe en USA, te lo traigo.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
              Te respondo con el precio y la fecha de llegada, sin compromiso. Pega el link del artículo de cualquier tienda online de USA.
            </p>
          </div>

          {/* Formulario Simple con Multi-Link Dinámico */}
          <form
            onSubmit={handleSubmit}
            className="space-y-4 bg-slate-900/90 border border-slate-800 p-5 sm:p-7 rounded-3xl shadow-xl"
          >
            {/* Contenedor dinámico de links */}
            <div className="space-y-4">
              {links.map((link, idx) => (
                <div key={idx} className="space-y-2.5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 relative">
                  {links.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLinkRow(idx)}
                      className="absolute right-3 top-3 text-slate-500 hover:text-rose-400 text-xs"
                      title="Eliminar este enlace"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  )}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                      Link del Producto en USA #{idx + 1}
                    </label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                        link
                      </span>
                      <input
                        type="url"
                        value={link.url}
                        onChange={e => handleUrlChange(idx, e.target.value)}
                        required
                        placeholder="https://amazon.com/... o Walmart, Best Buy, Target, Nike, Sephora"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-3 py-3 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Campos Opcionales: Talla, Color, Cantidad */}
                  <div className="grid grid-cols-3 gap-2.5 pt-1">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Talla (opcional)</label>
                      <input
                        type="text"
                        value={link.size}
                        onChange={e => {
                          const updated = [...links];
                          updated[idx].size = e.target.value;
                          setLinks(updated);
                        }}
                        placeholder="Ej. M, 42, US 10"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Color (opcional)</label>
                      <input
                        type="text"
                        value={link.color}
                        onChange={e => {
                          const updated = [...links];
                          updated[idx].color = e.target.value;
                          setLinks(updated);
                        }}
                        placeholder="Ej. Negro, Azul"
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">Cantidad</label>
                      <input
                        type="number"
                        min="1"
                        value={link.qty}
                        onChange={e => {
                          const updated = [...links];
                          updated[idx].qty = parseInt(e.target.value, 10) || 1;
                          setLinks(updated);
                        }}
                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Insignia de Tienda Detectada */}
            {detectedStore && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-bold animate-pop">
                <span className="material-symbols-outlined text-sm">verified</span>
                <span>Tienda reconocida: {detectedStore}</span>
              </div>
            )}

            {/* Botón + Agregar otro link */}
            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={addLinkRow}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined text-base">add_circle</span>
                <span>+ Agregar otro link</span>
              </button>
              <span className="text-[11px] text-slate-400 hidden sm:inline">
                Pide varios productos para este viaje
              </span>
            </div>

            {/* Datos de Contacto para el Ticket Correlativo */}
            <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Tu Nombre Completo
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    person
                  </span>
                  <input
                    type="text"
                    value={userName}
                    onChange={e => setUserName(e.target.value)}
                    required
                    placeholder="Ej. Carlos Mendoza"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                  Tu Celular de Contacto (WhatsApp)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
                    smartphone
                  </span>
                  <input
                    type="tel"
                    value={userPhone}
                    onChange={e => setUserPhone(e.target.value)}
                    required
                    placeholder="Ej. 987 654 321"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              </div>
            </div>

            {/* Botón de Envío */}
            <div className="pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-8 py-3.5 rounded-2xl text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-base">confirmation_number</span>
                <span>{loading ? 'Generando Ticket...' : 'Cotizar mi encargo'}</span>
              </button>
              <p className="text-[11px] text-slate-400 text-center sm:text-right">
                Genera tu ticket correlativo oficial y coordinamos precio en soles por WhatsApp.
              </p>
            </div>
          </form>

          {/* Fila de Logos de Tiendas de USA */}
          <div className="pt-6 border-t border-slate-800/80">
            <div className="text-center text-[10px] uppercase font-bold text-slate-500 tracking-widest mb-3">
              Tiendas donde puedo comprar tu pedido en USA
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-9 text-xs font-black text-slate-400 tracking-wider uppercase opacity-85">
              {[
                { name: 'Amazon', icon: 'shopping_bag', color: 'text-amber-500' },
                { name: 'Walmart', icon: 'storefront', color: 'text-blue-400' },
                { name: 'Best Buy', icon: 'devices', color: 'text-yellow-400' },
                { name: 'Target', icon: 'adjust', color: 'text-red-500' },
                { name: 'Nike', icon: 'sprint', color: 'text-slate-200' },
                { name: 'Apple', icon: 'phone_iphone', color: 'text-slate-300' },
                { name: 'Sephora', icon: 'spa', color: 'text-rose-400' },
                { name: 'eBay', icon: 'sell', color: 'text-emerald-400' },
              ].map(st => (
                <span key={st.name} className="flex items-center gap-1.5 hover:text-white transition-colors">
                  <span className={`material-symbols-outlined text-sm ${st.color}`}>{st.icon}</span>
                  <span>{st.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
