'use client';

import React, { useState } from 'react';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  {
    id: 1,
    question: '¿Cómo funcionan los viajes?',
    answer:
      'Viajo personalmente a Estados Unidos en fechas programadas. Durante mi estancia compro tus artículos en tiendas oficiales autorizadas y regreso a Perú con todos los pedidos en mi equipaje y bodega segura.',
  },
  {
    id: 2,
    question: '¿Cuándo llega mi pedido?',
    answer:
      'Cada producto muestra su fecha estimada: si tiene la etiqueta "En stock en Lima", la entrega es inmediata en 24 a 48 horas. Si indica "Llega el 29 de Octubre", llega exactamente en mi regreso de viaje.',
  },
  {
    id: 3,
    question: '¿Cómo pido un producto por link?',
    answer:
      'Entras a la sección "Pedir por link", pegas el enlace de cualquier tienda de Estados Unidos (Amazon, Walmart, Nike, Best Buy, etc.) y te respondo por WhatsApp con el precio final en Soles y la fecha de entrega.',
  },
  {
    id: 4,
    question: '¿Cómo y cuándo pago?',
    answer:
      'Para pedidos del próximo viaje, separas tu cupo con solo el 50% de adelanto mediante Yape, Plin o transferencia, y cancelas el saldo restante al recibir tu pedido en Perú. En artículos con stock en Lima, puedes pagar contraentrega.',
  },
  {
    id: 5,
    question: '¿Qué pasa si un producto se agota?',
    answer:
      'Si la tienda oficial en USA se queda sin stock antes de que pueda adquirirlo, te aviso de inmediato por WhatsApp para darte la opción de elegir otro artículo o reembolsarte el 100% de tu dinero al instante sin penalidades.',
  },
];

export function FaqSection() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [query, setQuery] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const toggleFaq = (id: number) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const handleAiAsk = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;

    let fullAnswer =
      'En STORE BASS viajo personalmente a Estados Unidos para comprar tus productos en tiendas oficiales autorizadas. Siempre tienes tu precio final en soles antes de pagar y fecha clara de entrega a mi regreso.';

    if (q.includes('viaje') || q.includes('funciona') || q.includes('como')) {
      fullAnswer =
        'Viajo a USA en fechas programadas (salgo el 20 de Octubre y regreso el 29 de Octubre). Durante mi estancia compro tus encargos, los empaco cuidadosamente y a mi regreso te los entrego en Lima o envío a provincia.';
    } else if (
      q.includes('pago') ||
      q.includes('yape') ||
      q.includes('plin') ||
      q.includes('tarjeta')
    ) {
      fullAnswer =
        'Para pedidos del próximo viaje, separas tu cupo con solo el 50% mediante Yape, Plin o transferencia BCP/BBVA, y el saldo restante lo cancelas al recibir el producto. En productos en stock de Lima puedes pagar contraentrega.';
    } else if (
      q.includes('cuando') ||
      q.includes('fecha') ||
      q.includes('demora') ||
      q.includes('llega')
    ) {
      fullAnswer =
        'Los productos con la etiqueta "En stock en Lima" se entregan de inmediato en 24 a 48 horas. Los productos reservados del próximo viaje se entregan a mi regreso, el 29 de Octubre.';
    } else if (
      q.includes('original') ||
      q.includes('garantia') ||
      q.includes('falso')
    ) {
      fullAnswer =
        'Garantizo 100% de originalidad porque yo mismo voy a las tiendas físicas autorizadas de USA como Apple Store, Best Buy, Sephora, Nike y Walmart. Te envío fotos de compra durante mi viaje.';
    } else if (q.includes('agota') || q.includes('stock')) {
      fullAnswer =
        'Si un producto se agota en la tienda de USA antes de que pueda comprarlo, te informo de inmediato por WhatsApp para ofrecerte otra opción o devolverte el 100% de tu dinero al instante.';
    }

    setAiAnswer('');
    setIsTyping(true);

    let i = 0;
    const interval = setInterval(() => {
      if (i < fullAnswer.length) {
        setAiAnswer((prev) => prev + fullAnswer.charAt(i));
        i++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 14);
  };

  return (
    <section id="preguntas" className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <div className="text-center mb-8">
        <span className="inline-block text-[11px] font-black text-amber-500 uppercase tracking-widest mb-1">
          Claridad total
        </span>
        <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display">
          Preguntas Frecuentes
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Todo lo que necesitas saber sobre cómo viajo y traigo tus compras de USA.
        </p>
      </div>

      {/* Accordion list */}
      <div className="space-y-3">
        {FAQ_DATA.map((item) => {
          const isOpen = openFaq === item.id;
          return (
            <div
              key={item.id}
              className="bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder rounded-2xl overflow-hidden shadow-card-subtle transition-all"
            >
              <button
                type="button"
                onClick={() => toggleFaq(item.id)}
                className="w-full px-5 py-4 text-left flex items-center justify-between font-bold text-slate-900 dark:text-white text-xs sm:text-sm"
              >
                <span>{item.question}</span>
                <span
                  className={`material-symbols-outlined text-slate-400 transition-transform duration-200 text-lg ${
                    isOpen ? 'rotate-180 text-amber-500' : ''
                  }`}
                >
                  expand_more
                </span>
              </button>

              <div
                style={{
                  transition: 'grid-template-rows 220ms cubic-bezier(0.23, 1, 0.32, 1), opacity 200ms ease-out',
                }}
                className={`grid ${
                  isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800 pt-2.5">
                    {item.answer}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* AI Assistant Box */}
      <div className="mt-8 p-6 rounded-3xl bg-white dark:bg-darkCard border border-slate-200/80 dark:border-darkBorder shadow-card-subtle">
        <div className="flex items-center gap-2 mb-2">
          <span className="material-symbols-outlined text-amber-500">smart_toy</span>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">
            ¿No encuentras tu duda? Pregúntale al asistente
          </h3>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Escribe cualquier pregunta sobre los viajes, formas de pago, fechas de llegada o garantías.
        </p>

        <form onSubmit={handleAiAsk} className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ej. ¿Cómo coordino la entrega? o ¿Puedo pagar con tarjeta?"
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors"
          />
          <button
            type="submit"
            disabled={isTyping}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition-all active:scale-[0.97] shadow-sm disabled:opacity-50"
          >
            <span>Preguntar</span>
            <span className="material-symbols-outlined text-sm">send</span>
          </button>
        </form>

        {aiAnswer && (
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-slate-800 dark:text-slate-200 leading-relaxed animate-in fade-in duration-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400 mb-1">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              <span>Respuesta:</span>
            </div>
            <p className="font-medium whitespace-pre-line">{aiAnswer}</p>
          </div>
        )}
      </div>
    </section>
  );
}
