'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Ticket, TicketItem } from '@/lib/types';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
}

interface CartContextType {
  items: TicketItem[];
  addToCart: (title: string, price: number, qty?: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  total: number;
  count: number;
  // Ticket Modal
  isTicketModalOpen: boolean;
  ticketData: Ticket | null;
  openTicketModal: (ticket: Ticket) => void;
  closeTicketModal: () => void;
  generateTicket: (params: {
    cliente: string;
    telefono: string;
    origen?: 'Web' | 'WhatsApp';
    detalle?: string;
    tipo?: 'compra_lista' | 'cotizacion_links';
    items?: TicketItem[];
    total?: number;
  }) => Promise<Ticket>;
  // Toasts
  toasts: ToastMessage[];
  showToast: (title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<TicketItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [ticketData, setTicketData] = useState<Ticket | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sincronizar desde LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('storebass_cart_items');
      if (saved) {
        setItems(JSON.parse(saved));
      }
    } catch {
      // Ignorar error de parsing
    }
  }, []);

  const saveItems = (newItems: TicketItem[]) => {
    setItems(newItems);
    localStorage.setItem('storebass_cart_items', JSON.stringify(newItems));
  };

  const showToast = (title: string, message = '') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 3200);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const addToCart = (title: string, price: number, qty: number = 1) => {
    const additions: TicketItem[] = Array.from({ length: qty }, () => ({ title, price }));
    const newItems = [...items, ...additions];
    saveItems(newItems);
    showToast(
      title,
      qty > 1
        ? `${qty} unidades • S/ ${(price * qty).toFixed(2)} agregadas al carrito`
        : `S/ ${price.toFixed(2)} • Agregado al carrito`
    );
  };

  const removeFromCart = (index: number) => {
    const removed = items[index];
    const newItems = items.filter((_, i) => i !== index);
    saveItems(newItems);
    if (removed) {
      showToast('Producto eliminado', removed.title);
    }
  };

  const clearCart = () => {
    saveItems([]);
  };

  const toggleCart = () => setIsCartOpen(prev => !prev);
  const openCart = () => setIsCartOpen(true);
  const closeCart = () => setIsCartOpen(false);

  const total = items.reduce((acc, curr) => acc + curr.price, 0);
  const count = items.length;

  const openTicketModal = (ticket: Ticket) => {
    setTicketData(ticket);
    setIsTicketModalOpen(true);
  };

  const closeTicketModal = () => {
    setIsTicketModalOpen(false);
  };

  // Generador de Tickets Correlativos (con llamada RPC atómica a Supabase o fallback local)
  const generateTicket = async ({
    cliente,
    telefono,
    origen = 'Web',
    detalle = '',
    tipo = 'compra_lista',
    items: ticketItems = items,
    total: customTotal,
  }: {
    cliente: string;
    telefono: string;
    origen?: 'Web' | 'WhatsApp';
    detalle?: string;
    tipo?: 'compra_lista' | 'cotizacion_links';
    items?: TicketItem[];
    total?: number;
  }): Promise<Ticket> => {
    const calcTotal = customTotal !== undefined ? customTotal : total;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      showToast('No se registró el pedido', 'Revisa tu conexión e inténtalo nuevamente.');
      throw new Error('Supabase no disponible');
    }
    let result;
    try {
      const { data, error } = await supabase.rpc('fn_create_ticket', {
        p_origen: origen, p_cliente: cliente, p_telefono: telefono,
        p_detalle: detalle || (ticketItems.length ? ticketItems.map(i => i.title).join(', ') : 'Pedido web'),
        p_total: calcTotal, p_estado: 'Pendiente', p_tipo: tipo, p_items: ticketItems,
      });
      if (error || !data?.[0]?.ticket_code) throw error || new Error('Respuesta inválida');
      result = data[0];
    } catch (error) {
      showToast('No se pudo confirmar el pedido', 'Conservamos tu carrito. Revisa tu conexión antes de reintentar.');
      throw error;
    }
    const ticketCode = result.ticket_code;
    const seq = result.correlativo;
    const fecha = result.fecha;

    const newTicket: Ticket = {
      id: result.id,
      ticket_code: ticketCode,
      ticketId: ticketCode,
      correlativo: seq,
      origen,
      cliente,
      telefono,
      detalle: detalle || (ticketItems.length > 0 ? ticketItems.map(i => i.title).join(', ') : 'Pedido web'),
      total: calcTotal,
      estado: 'Pendiente',
      tipo,
      items: ticketItems,
      fecha,
    };

    // Guardar en LocalStorage para redundancia
    try {
      const stored = JSON.parse(localStorage.getItem('storebass_tickets') || '[]');
      stored.unshift(newTicket);
      localStorage.setItem('storebass_tickets', JSON.stringify(stored));
    } catch {
      // Ignorar error
    }

    // Vaciar carrito automáticamente una vez confirmado y generado el ticket
    if (tipo === 'compra_lista' || ticketItems.length > 0) {
      clearCart();
    }

    openTicketModal(newTicket);
    return newTicket;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        clearCart,
        isCartOpen,
        toggleCart,
        openCart,
        closeCart,
        total,
        count,
        isTicketModalOpen,
        ticketData,
        openTicketModal,
        closeTicketModal,
        generateTicket,
        toasts,
        showToast,
        removeToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
}

export function useToast() {
  const { showToast, removeToast, toasts } = useCart();
  return { showToast, removeToast, toasts };
}
