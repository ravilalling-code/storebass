'use client';

import React, { useState, useEffect, useRef } from 'react';
import { INITIAL_PRODUCTS } from '@/data/initialCatalog';
import { Product } from '@/lib/types';
import { useCart } from '@/context/CartContext';

interface Message {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  products?: Product[];
  actionType?: 'ask_category' | 'quote_link' | 'none';
}

const CATEGORY_PROMPTS = [
  { label: '📱 Apple & iPhone', query: 'apple' },
  { label: '🧴 Perfumes y Fragancias', query: 'perfume' },
  { label: '✨ Skincare & Belleza', query: 'belleza' },
  { label: '👟 Zapatillas USA', query: 'zapatilla' },
  { label: '💻 Tecnología & Audio', query: 'tecnologia' },
  { label: '⌚ Relojes', query: 'reloj' },
  { label: '🥤 Termos Stanley & Hogar', query: 'hogar' },
];

export function AiShoppingAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: '¡Hola! 👋 Soy tu Shopper IA de StoreBass. ¿Qué artículo o categoría estás buscando para el viaje a USA? Dime lo que te interesa y te mostraré las mejores opciones disponibles.',
      actionType: 'ask_category',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Intelligent catalog search with synonym matching
  const searchCatalog = (query: string): Product[] => {
    const q = query.toLowerCase().trim();
    if (!q) return [];

    const synonyms: Record<string, string[]> = {
      apple: ['iphone', 'macbook', 'airpods', 'ipad', 'apple', 'watch'],
      perfume: ['perfume', 'fragancia', 'colonia', 'lattafa', 'sauvage', 'dior', 'baccarat', 'tom ford'],
      belleza: ['skincare', 'maquillaje', 'crema', 'sol de janeiro', 'cerave', 'beauty', 'suero'],
      zapatilla: ['zapatilla', 'sneaker', 'nike', 'jordan', 'new balance', 'calzado', 'adidas'],
      tecnologia: ['laptop', 'audifono', 'sony', 'wh-1000xm5', 'kindle', 'gadget', 'audio', 'pantalla'],
      reloj: ['reloj', 'invicta', 'casio', 'seiko', 'relojes'],
      hogar: ['stanley', 'termo', 'vaso', 'hogar', 'cocina'],
      suplementos: ['proteina', 'vitamina', 'creatina', 'suplemento', 'c4'],
    };

    let matchedTerms: string[] = [q];
    for (const [key, terms] of Object.entries(synonyms)) {
      if (terms.some(t => q.includes(t)) || q.includes(key)) {
        matchedTerms = [...matchedTerms, key, ...terms];
      }
    }

    return INITIAL_PRODUCTS.filter((prod) => {
      const prodName = prod.name.toLowerCase();
      const prodCat = prod.category.toLowerCase();
      return matchedTerms.some(term => prodName.includes(term) || prodCat.includes(term));
    });
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = (textToSend || inputVal).trim();
    if (!text) return;

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setIsTyping(true);

    // AI Response generation
    setTimeout(() => {
      const results = searchCatalog(text);
      let replyText = '';
      let action: 'ask_category' | 'quote_link' | 'none' = 'none';

      if (results.length > 0) {
        replyText = `Encontré estas ${results.length} opciones en nuestro catálogo oficial del viaje con precios garantizados en Soles:`;
      } else {
        replyText = `No encontré ese producto exacto en el catálogo inmediato, pero ¡puedo traértelo personalmente de cualquier tienda oficial de USA (Amazon, Best Buy, Sephora, Nike)! Pega tu link en nuestra sección "Pedir por Link" o escríbeme directamente por WhatsApp.`;
        action = 'quote_link';
      }

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyText,
        products: results.slice(0, 4),
        actionType: action,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Botón Flotante del Asistente IA (Desktop y Móvil) */}
      <div className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Abrir Asistente Shopper IA"
          className="group relative flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black text-xs sm:text-sm shadow-2xl border border-amber-500/40 hover:border-amber-400 transition-all duration-200 active:scale-95"
        >
          {/* Pulsing indicator */}
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
          </span>

          <span className="material-symbols-outlined text-amber-400 dark:text-amber-600 text-lg">
            auto_awesome
          </span>
          <span className="font-display font-extrabold tracking-tight">Shopper IA</span>

          {/* Badge sutil */}
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-slate-950">
            En vivo
          </span>
        </button>
      </div>

      {/* Ventana Modal / Chatbot del Asistente IA */}
      {isOpen && (
        <div className="fixed inset-0 sm:inset-auto sm:bottom-24 sm:left-6 z-50 w-full sm:w-[420px] max-h-[100dvh] sm:max-h-[620px] flex flex-col bg-white dark:bg-darkCard sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-darkBorder overflow-hidden transition-all duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]">
          {/* Header del Chatbot */}
          <div className="p-4 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                <span className="material-symbols-outlined text-xl">smart_toy</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black font-display text-white">Shopper IA</h3>
                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase border border-emerald-500/30">
                    Online
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Asistente personal para compras en USA</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              aria-label="Cerrar Asistente IA"
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-transform active:scale-90"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>

          {/* Área de Mensajes */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-slate-50/50 dark:bg-darkElevated/30 text-xs">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${
                  m.sender === 'user' ? 'items-end' : 'items-start'
                } space-y-1.5`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-amber-500 text-slate-950 font-semibold rounded-br-none shadow-sm'
                      : 'bg-white dark:bg-darkCard text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-darkBorder rounded-bl-none shadow-sm'
                  }`}
                >
                  <p>{m.text}</p>

                  {/* Pills de categorías sugeridas */}
                  {m.actionType === 'ask_category' && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-darkBorder/60 flex flex-wrap gap-1.5">
                      {CATEGORY_PROMPTS.map((cat) => (
                        <button
                          key={cat.query}
                          onClick={() => handleSendMessage(`Busco ${cat.label}`)}
                          className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-[11px] font-bold text-slate-700 dark:text-slate-300 transition-colors active:scale-95 border border-slate-200/60 dark:border-slate-700/60"
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sugerencia de pedir por link */}
                  {m.actionType === 'quote_link' && (
                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-darkBorder/60 flex flex-col gap-2">
                      <a
                        href="#pedir-link"
                        onClick={() => setIsOpen(false)}
                        className="py-2 px-3 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-950 text-center font-bold text-[11px] transition-transform active:scale-95"
                      >
                        🔗 Pegar link para cotizar
                      </a>
                      <a
                        href="https://wa.me/51960759244?text=Hola%20Johan,%20estoy%20buscando%20un%20producto%20espec%C3%ADfico%20de%20USA%20que%20no%20est%C3%A1%20en%20el%20cat%C3%A1logo"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-3 rounded-xl bg-emerald-500 text-white text-center font-bold text-[11px] transition-transform active:scale-95 flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-sm">chat</span>
                        <span>Consultar a Johan por WhatsApp</span>
                      </a>
                    </div>
                  )}
                </div>

                {/* Tarjetas de productos recomendados dentro del chat */}
                {m.products && m.products.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-1">
                    {m.products.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-2.5 rounded-2xl bg-white dark:bg-darkCard border border-slate-200 dark:border-darkBorder flex items-center gap-2.5 shadow-sm"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={prod.img}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover flex-shrink-0 bg-slate-100 dark:bg-slate-800"
                        />
                        <div className="overflow-hidden flex-1">
                          <h4 className="font-bold text-[11px] text-slate-900 dark:text-white truncate">
                            {prod.name}
                          </h4>
                          <div className="text-amber-500 font-black text-xs">
                            S/ {prod.price.toFixed(2)}
                          </div>
                          <button
                            onClick={() => {
                              addToCart(prod.name, prod.price);
                              const confirmationMsg: Message = {
                                id: Date.now().toString(),
                                sender: 'ai',
                                text: `✅ ¡Listo! Agregué "${prod.name}" a tu carrito de compras. Puedes abrir el carrito en cualquier momento para finalizar.`,
                              };
                              setMessages((prev) => [...prev, confirmationMsg]);
                            }}
                            className="mt-1 w-full py-1 px-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-bold text-[10px] flex items-center justify-center gap-1 active:scale-95 transition-transform"
                          >
                            <span className="material-symbols-outlined text-xs">add_shopping_cart</span>
                            <span>Agregar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-3 bg-white dark:bg-darkCard rounded-2xl w-24 border border-slate-200 dark:border-darkBorder">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de consulta */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white dark:bg-darkCard border-t border-slate-200 dark:border-darkBorder flex items-center gap-2"
          >
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="¿Qué buscas? (Ej: iPhone, perfume dulce, Nike...)"
              className="flex-1 bg-slate-100 dark:bg-darkElevated border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={!inputVal.trim()}
              aria-label="Enviar pregunta"
              className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-transform active:scale-90"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
