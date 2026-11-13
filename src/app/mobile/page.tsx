'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/context/CartContext';

export interface MobileItem {
  id: string;
  name: string;
  subtitle?: string;
  img?: string;
  category: string;
  quantity: number;
  cost_usd: number;
  sale_usd: number;
  price_pen: number;
  subtotal_pen: number;
  is_purchased: boolean;
  observation: string;
}

export interface MobileCustomerGroup {
  ticketId: string;
  ticketCode: string;
  cliente: string;
  telefono: string;
  fecha?: string;
  items: MobileItem[];
  totalUnits: number;
  purchasedCount: number;
  pendingCount: number;
  totalCostUSD: number;
  totalProfitUSD: number;
  totalPEN: number;
  estado?: string;
}

const INITIAL_DEMO_DATA: MobileCustomerGroup[] = [
  {
    ticketId: 'demo-1',
    ticketCode: 'TK-1001',
    cliente: 'María',
    telefono: '+51 987 654 321',
    fecha: '26 ene. 2025, 10:24 a. m.',
    totalUnits: 4,
    purchasedCount: 1,
    pendingCount: 2,
    totalCostUSD: 415.0,
    totalProfitUSD: 125.0,
    totalPEN: 1155.0,
    estado: 'Pendiente',
    items: [
      {
        id: 'item-101',
        name: 'AirPods Pro 2',
        subtitle: 'Versión USB-C',
        img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=150&q=80',
        category: 'Tecnología',
        quantity: 2,
        cost_usd: 180.0,
        sale_usd: 230.0,
        price_pen: 805.0,
        subtotal_pen: 1610.0,
        is_purchased: false,
        observation: 'Versión USB-C',
      },
      {
        id: 'item-102',
        name: 'Stanley Quencher',
        subtitle: '40 oz. Color rosa',
        img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=150&q=80',
        category: 'Hogar',
        quantity: 1,
        cost_usd: 35.0,
        sale_usd: 50.0,
        price_pen: 175.0,
        subtotal_pen: 175.0,
        is_purchased: true,
        observation: 'Color rosa, 40 oz.',
      },
      {
        id: 'item-103',
        name: 'Polo Nike',
        subtitle: 'Talla L',
        img: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=150&q=80',
        category: 'Ropa',
        quantity: 1,
        cost_usd: 20.0,
        sale_usd: 30.0,
        price_pen: 105.0,
        subtotal_pen: 105.0,
        is_purchased: false,
        observation: 'Talla L',
      },
    ],
  },
  {
    ticketId: 'demo-2',
    ticketCode: 'TK-1002',
    cliente: 'Juan',
    telefono: '+51 912 345 678',
    fecha: '26 ene. 2025, 09:15 a. m.',
    totalUnits: 3,
    purchasedCount: 0,
    pendingCount: 2,
    totalCostUSD: 255.0,
    totalProfitUSD: 85.0,
    totalPEN: 962.5,
    estado: 'Pendiente',
    items: [
      {
        id: 'item-201',
        name: 'Perfume Bleu de Chanel',
        subtitle: 'EDP 100ml',
        img: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=150&q=80',
        category: 'Perfumes',
        quantity: 1,
        cost_usd: 145.0,
        sale_usd: 195.0,
        price_pen: 550.0,
        subtotal_pen: 550.0,
        is_purchased: false,
        observation: 'Eau de Parfum 100ml original',
      },
      {
        id: 'item-202',
        name: 'Zapatillas Nike Air Max',
        subtitle: 'Talla 42 (9.5 US)',
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&q=80',
        category: 'Ropa',
        quantity: 2,
        cost_usd: 55.0,
        sale_usd: 75.0,
        price_pen: 206.25,
        subtotal_pen: 412.5,
        is_purchased: false,
        observation: 'Color negro con suela blanca',
      },
    ],
  },
  {
    ticketId: 'demo-3',
    ticketCode: 'TK-1003',
    cliente: 'Pedro',
    telefono: '+51 945 678 123',
    fecha: '25 ene. 2025, 06:40 p. m.',
    totalUnits: 3,
    purchasedCount: 0,
    pendingCount: 2,
    totalCostUSD: 260.0,
    totalProfitUSD: 120.0,
    totalPEN: 980.0,
    estado: 'Confirmado',
    items: [
      {
        id: 'item-301',
        name: 'AirPods Pro 2',
        subtitle: 'Versión USB-C',
        img: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=150&q=80',
        category: 'Tecnología',
        quantity: 1,
        cost_usd: 180.0,
        sale_usd: 230.0,
        price_pen: 805.0,
        subtotal_pen: 805.0,
        is_purchased: false,
        observation: 'Empaque sellado con boleta Apple',
      },
      {
        id: 'item-302',
        name: 'Stanley Quencher',
        subtitle: '30 oz. Color Negro',
        img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=150&q=80',
        category: 'Hogar',
        quantity: 2,
        cost_usd: 40.0,
        sale_usd: 60.0,
        price_pen: 87.5,
        subtotal_pen: 175.0,
        is_purchased: false,
        observation: 'Color Matte Black',
      },
    ],
  },
  {
    ticketId: 'demo-4',
    ticketCode: 'TK-1004',
    cliente: 'Lucía',
    telefono: '+51 999 111 222',
    fecha: '25 ene. 2025, 03:10 p. m.',
    totalUnits: 2,
    purchasedCount: 1,
    pendingCount: 1,
    totalCostUSD: 120.0,
    totalProfitUSD: 40.0,
    totalPEN: 525.0,
    estado: 'Pendiente',
    items: [
      {
        id: 'item-401',
        name: 'Stanley Quencher',
        subtitle: '40 oz. Color Crema',
        img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=150&q=80',
        category: 'Hogar',
        quantity: 1,
        cost_usd: 35.0,
        sale_usd: 50.0,
        price_pen: 175.0,
        subtotal_pen: 175.0,
        is_purchased: true,
        observation: 'Color Cream 40oz',
      },
    ],
  },
];

export default function MobileMonitorPage() {
  const { showToast } = useToast();

  // Estados
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cliente' | 'producto'>('cliente');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [exchangeRate, setExchangeRate] = useState<number>(3.5);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('3.50');
  const [tickets, setTickets] = useState<any[]>([]);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({
    'demo-1': true,
  });

  // Modal / Bottom Sheet "+ Registrar Pedido"
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    cliente: '',
    telefono: '',
    productName: '',
    category: 'Tecnología',
    quantity: 1,
    costUsd: 50,
    saleUsd: 70,
    observation: '',
  });

  // Modal para editar observación rápida
  const [editingObs, setEditingObs] = useState<{
    ticketId: string;
    itemId: string;
    text: string;
  } | null>(null);

  // Conexión en tiempo real con Supabase
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    // 1. Cargar tipo de cambio
    supabase
      .from('trip_config')
      .select('exchange_rate')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data?.exchange_rate) {
          const rate = Number(data.exchange_rate);
          setExchangeRate(rate);
          setRateInput(rate.toFixed(2));
        }
      });

    // 2. Cargar tickets
    const fetchTickets = async () => {
      const { data } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (data && data.length > 0) {
        setTickets(data);
      }
    };
    fetchTickets();

    // 3. Suscripción en tiempo real
    const channel = supabase
      .channel('mobile-orders-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => {
        fetchTickets();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trip_config' }, () => {
        supabase
          .from('trip_config')
          .select('exchange_rate')
          .eq('id', 1)
          .single()
          .then(({ data }) => {
            if (data?.exchange_rate) {
              setExchangeRate(Number(data.exchange_rate));
              setRateInput(Number(data.exchange_rate).toFixed(2));
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Procesamiento de clientes y pedidos
  const customerGroups = useMemo<MobileCustomerGroup[]>(() => {
    const realTickets = tickets.filter(
      (t) => Array.isArray(t.items) && t.items.length > 0
    );

    if (realTickets.length === 0) {
      return INITIAL_DEMO_DATA;
    }

    return realTickets.map((t) => {
      const rate = exchangeRate || 3.5;
      const items: MobileItem[] = t.items.map((it: any, idx: number) => {
        const qty = Number(it.quantity) || 1;
        const penPrice = Number(it.price) || 0;
        const saleUsd = it.sale_usd ? Number(it.sale_usd) : Number((penPrice / rate).toFixed(2));
        const costUsd = it.cost_usd ? Number(it.cost_usd) : Number((saleUsd * 0.72).toFixed(2));
        const subtotalPen = penPrice * qty;

        return {
          id: it.id || `it-${t.ticket_code}-${idx}`,
          name: it.title || it.name || 'Producto importado',
          subtitle: it.subtitle || it.observacion || '',
          img: it.img || it.image || '',
          category: it.category || 'General',
          quantity: qty,
          cost_usd: costUsd,
          sale_usd: saleUsd,
          price_pen: penPrice,
          subtotal_pen: subtotalPen,
          is_purchased: !!it.comprado || it.is_purchased === true,
          observation: it.observacion || it.observation || '',
        };
      });

      const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
      const purchasedCount = items.filter((i) => i.is_purchased).length;
      const pendingCount = items.length - purchasedCount;
      const totalCostUSD = items.reduce((acc, i) => acc + i.cost_usd * i.quantity, 0);
      const totalSaleUSD = items.reduce((acc, i) => acc + i.sale_usd * i.quantity, 0);
      const totalProfitUSD = totalSaleUSD - totalCostUSD;
      const totalPEN = items.reduce((acc, i) => acc + i.subtotal_pen, 0);

      return {
        ticketId: t.id || t.ticket_code,
        ticketCode: t.ticket_code || t.ticketId,
        cliente: t.cliente || 'Cliente',
        telefono: t.telefono || '',
        fecha: t.fecha || (t.created_at ? new Date(t.created_at).toLocaleString('es-PE') : ''),
        items,
        totalUnits,
        purchasedCount,
        pendingCount,
        totalCostUSD: Number(totalCostUSD.toFixed(2)),
        totalProfitUSD: Number(totalProfitUSD.toFixed(2)),
        totalPEN: Number(totalPEN.toFixed(2)),
        estado: t.estado || 'Pendiente',
      };
    });
  }, [tickets, exchangeRate]);

  // Categorías
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    set.add('Todas');
    customerGroups.forEach((c) =>
      c.items.forEach((it) => {
        if (it.category) set.add(it.category);
      })
    );
    return Array.from(set);
  }, [customerGroups]);

  // Filtrado
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return customerGroups
      .map((cust) => {
        const matchCustomer = cust.cliente.toLowerCase().includes(q);
        const filteredItems = cust.items.filter((it) => {
          const matchQ =
            matchCustomer ||
            it.name.toLowerCase().includes(q) ||
            (it.subtitle && it.subtitle.toLowerCase().includes(q)) ||
            (it.observation && it.observation.toLowerCase().includes(q));
          const matchCat = selectedCategory === 'Todas' || it.category === selectedCategory;
          return matchQ && matchCat;
        });
        if (filteredItems.length === 0) return null;
        return { ...cust, items: filteredItems };
      })
      .filter(Boolean) as MobileCustomerGroup[];
  }, [customerGroups, searchQuery, selectedCategory]);

  // KPIs
  const kpis = useMemo(() => {
    const clientsCount = new Set(customerGroups.map((c) => c.cliente)).size;
    const prodsCount = new Set(
      customerGroups.flatMap((c) => c.items.map((i) => i.name.toLowerCase().trim()))
    ).size;
    let units = 0;
    let cost = 0;
    let profit = 0;

    customerGroups.forEach((c) => {
      c.items.forEach((it) => {
        units += it.quantity;
        cost += it.cost_usd * it.quantity;
        profit += (it.sale_usd - it.cost_usd) * it.quantity;
      });
    });

    return {
      clientes: clientsCount,
      productos: prodsCount,
      unidades: units,
      inversion: cost,
      ganancia: profit,
    };
  }, [customerGroups]);

  // Vista agrupada por producto
  const groupedProducts = useMemo(() => {
    const map: Record<string, any> = {};
    customerGroups.forEach((c) => {
      c.items.forEach((it) => {
        const k = it.name.trim();
        if (!map[k]) {
          map[k] = {
            name: it.name,
            category: it.category,
            img: it.img,
            cost_usd: it.cost_usd,
            totalUnits: 0,
            purchasedUnits: 0,
            clients: [],
          };
        }
        map[k].totalUnits += it.quantity;
        if (it.is_purchased) map[k].purchasedUnits += it.quantity;
        map[k].clients.push({
          cliente: c.cliente,
          ticketId: c.ticketId,
          itemId: it.id,
          quantity: it.quantity,
          is_purchased: it.is_purchased,
          obs: it.observation || it.subtitle || '',
        });
      });
    });
    return Object.values(map);
  }, [customerGroups]);

  // Alternar "¿Comprado?" con feedback táctil
  const handleTogglePurchased = async (
    ticketId: string,
    itemId: string,
    currentStatus: boolean
  ) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(40);
    }

    const target = tickets.find((t) => t.id === ticketId || t.ticket_code === ticketId);

    if (!target) {
      // Demo update
      const cust = INITIAL_DEMO_DATA.find((c) => c.ticketId === ticketId);
      const it = cust?.items.find((i) => i.id === itemId);
      if (it) {
        it.is_purchased = !currentStatus;
        cust.purchasedCount = cust.items.filter((i) => i.is_purchased).length;
        cust.pendingCount = cust.items.length - cust.purchasedCount;
      }
      showToast(
        !currentStatus ? '¡Comprado!' : 'Marcado como Pendiente',
        'Actualizado en tu app móvil'
      );
      setTickets([...tickets]);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedItems = (target.items || []).map((it: any) => {
      if (it.id === itemId || it.title === itemId) {
        return { ...it, comprado: !currentStatus, is_purchased: !currentStatus };
      }
      return it;
    });

    try {
      await supabase
        .from('tickets')
        .update({ items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', target.id);

      showToast(
        !currentStatus ? '¡Comprado en USA!' : 'Marcado como Pendiente',
        `${target.ticket_code} sincronizado con la web`
      );
    } catch {
      showToast('Error', 'No se pudo sincronizar el estado.');
    }
  };

  // Guardar Observación
  const handleSaveObs = async () => {
    if (!editingObs) return;
    const { ticketId, itemId, text } = editingObs;
    const target = tickets.find((t) => t.id === ticketId || t.ticket_code === ticketId);

    if (!target) {
      const cust = INITIAL_DEMO_DATA.find((c) => c.ticketId === ticketId);
      const it = cust?.items.find((i) => i.id === itemId);
      if (it) it.observation = text;
      setEditingObs(null);
      showToast('Nota guardada', text);
      setTickets([...tickets]);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const updated = (target.items || []).map((it: any) =>
        it.id === itemId ? { ...it, observacion: text, observation: text } : it
      );
      await supabase.from('tickets').update({ items: updated }).eq('id', target.id);
      setEditingObs(null);
      showToast('Nota actualizada', text);
    }
  };

  // Guardar Tipo de Cambio
  const handleSaveRate = async () => {
    const val = parseFloat(rateInput);
    if (isNaN(val) || val <= 0) return;
    setExchangeRate(val);
    setEditingRate(false);

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase
        .from('trip_config')
        .update({ exchange_rate: val, updated_at: new Date().toISOString() })
        .eq('id', 1);
    }
    showToast('Tipo de cambio guardado', `S/ ${val.toFixed(2)} por dólar`);
  };

  // Registrar Nuevo Pedido Manual
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.cliente || !orderForm.productName) {
      showToast('Campos requeridos', 'Ingresa cliente y producto');
      return;
    }

    setIsSubmittingOrder(true);
    const penPrice = Number((orderForm.saleUsd * exchangeRate).toFixed(2));
    const subtotalPen = penPrice * orderForm.quantity;

    const newItem: MobileItem = {
      id: `it-${Date.now()}`,
      name: orderForm.productName.trim(),
      subtitle: orderForm.observation.trim(),
      category: orderForm.category,
      quantity: Number(orderForm.quantity) || 1,
      cost_usd: Number(orderForm.costUsd) || 0,
      sale_usd: Number(orderForm.saleUsd) || 0,
      price_pen: penPrice,
      subtotal_pen: subtotalPen,
      is_purchased: false,
      observation: orderForm.observation.trim(),
    };

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.rpc('fn_create_ticket', {
          p_origen: 'WhatsApp',
          p_cliente: orderForm.cliente.trim(),
          p_telefono: orderForm.telefono.trim() || '+51 900 000 000',
          p_detalle: `${newItem.name} x${newItem.quantity} (${newItem.category})`,
          p_total: subtotalPen,
          p_estado: 'Pendiente',
          p_tipo: 'whatsapp_manual',
          p_items: [newItem],
        });
        showToast('¡Pedido Guardado!', 'Sincronizado inmediatamente en la web y tu app.');
      } catch (err) {
        console.error(err);
      }
    } else {
      INITIAL_DEMO_DATA.unshift({
        ticketId: `demo-${Date.now()}`,
        ticketCode: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
        cliente: orderForm.cliente,
        telefono: orderForm.telefono,
        fecha: 'Hace un momento',
        items: [newItem],
        totalUnits: newItem.quantity,
        purchasedCount: 0,
        pendingCount: 1,
        totalCostUSD: newItem.cost_usd * newItem.quantity,
        totalProfitUSD: (newItem.sale_usd - newItem.cost_usd) * newItem.quantity,
        totalPEN: subtotalPen,
        estado: 'Pendiente',
      });
      setTickets([...tickets]);
    }

    setIsSubmittingOrder(false);
    setIsOrderModalOpen(false);
    setOrderForm({
      cliente: '',
      telefono: '',
      productName: '',
      category: 'Tecnología',
      quantity: 1,
      costUsd: 50,
      saleUsd: 70,
      observation: '',
    });
  };

  const getCatStyle = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'tecnología':
      case 'apple':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'hogar':
        return 'bg-pink-100 text-pink-800 border-pink-200';
      case 'ropa':
      case 'moda':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'perfumes':
      case 'belleza':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800 flex flex-col font-sans pb-24 select-none">
      {/* 1. PANEL LATERAL (DRAWER) - ESTRUCTURA IDÉNTICA A LA IMAGEN */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-[280px] bg-[#0b1b3d] text-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-out ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header del Drawer */}
        <div className="p-5 border-b border-blue-900/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <span className="material-symbols-outlined text-2xl">shopping_bag</span>
            </div>
            <div>
              <div className="font-black text-base tracking-tight leading-none text-white">
                STORE BASS
              </div>
              <div className="text-[10px] text-blue-300 mt-1 font-medium">
                Control y Seguimiento de Pedidos
              </div>
            </div>
          </div>
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Opciones del Menú (Iguales a la maqueta) */}
        <nav className="p-4 space-y-1.5 flex-1 overflow-y-auto">
          <button
            onClick={() => {
              setViewMode('cliente');
              setDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold bg-blue-600 text-white shadow-md shadow-blue-600/30"
          >
            <span className="material-symbols-outlined text-xl">dashboard</span>
            <span>Dashboard / Monitor</span>
          </button>

          <button
            onClick={() => {
              setIsOrderModalOpen(true);
              setDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-900/40 transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-emerald-400">add_circle</span>
            <span>Registrar Pedido</span>
          </button>

          <button
            onClick={() => {
              setViewMode('producto');
              setDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-900/40 transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-blue-400">inventory_2</span>
            <span>Productos (Lista Compras)</span>
          </button>

          <button
            onClick={() => {
              setViewMode('cliente');
              setDrawerOpen(false);
            }}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-900/40 transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-purple-400">group</span>
            <span>Clientes</span>
          </button>

          <Link
            href="/admin"
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-900/40 transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-amber-400">tune</span>
            <span>Panel Web Completo</span>
          </Link>
        </nav>

        {/* Pie del Drawer: Configuración de Tipo de Cambio (Idéntico a la propuesta) */}
        <div className="p-4 border-t border-blue-900/60 bg-[#08132b]">
          <div className="flex items-center gap-1.5 text-xs text-blue-300 font-bold mb-2">
            <span className="material-symbols-outlined text-sm">settings</span>
            <span>Configuración</span>
          </div>
          <div className="text-[11px] text-slate-400 mb-1.5 font-medium">
            Tipo de cambio (USD → PEN)
          </div>
          {editingRate ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.01"
                value={rateInput}
                onChange={(e) => setRateInput(e.target.value)}
                className="w-20 px-2 py-1 bg-white text-slate-900 text-xs font-black rounded-lg border border-blue-400 text-center"
                autoFocus
              />
              <button
                onClick={handleSaveRate}
                className="p-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
              >
                OK
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between bg-blue-950/80 border border-blue-800/80 px-3 py-2 rounded-xl">
              <span className="text-sm font-black text-amber-400 font-mono">
                S/ {exchangeRate.toFixed(2)}
              </span>
              <button
                onClick={() => setEditingRate(true)}
                className="p-1 text-slate-400 hover:text-white"
                title="Editar tipo de cambio"
              >
                <span className="material-symbols-outlined text-base">edit</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. APP HEADER SUPERIOR (MOBILE NATIVE) */}
      <header className="sticky top-0 z-40 bg-[#0b1b3d] text-white px-4 py-3 shadow-md border-b border-blue-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-xl bg-blue-900/70 border border-blue-700/60 flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Abrir panel lateral"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-1.5">
              Monitor de Pedidos
            </h1>
            <div className="text-[10px] text-blue-300 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Sincronizado con Web & BD</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30"
        >
          <span className="material-symbols-outlined text-base font-bold">add</span>
          <span>+ Pedido</span>
        </button>
      </header>

      {/* 3. SUBHEADER CON FECHA Y TIPO DE CAMBIO RÁPIDO */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>{new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}, {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
        <div className="flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px]">
          <span className="text-slate-500 font-medium">USD a PEN:</span>
          <span className="text-blue-700 font-black">S/ {exchangeRate.toFixed(2)}</span>
        </div>
      </div>

      {/* 4. CAROUSEL HORIZONTAL DE TARJETAS KPIS (TOUCH NATIVE) */}
      <div className="p-4 pb-2">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          {/* Clientes */}
          <div className="snap-start shrink-0 w-36 bg-white border border-purple-100 p-3.5 rounded-2xl shadow-xs flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Clientes</div>
              <div className="text-xl font-black text-slate-900">{kpis.clientes}</div>
            </div>
          </div>

          {/* Productos */}
          <div className="snap-start shrink-0 w-36 bg-white border border-blue-100 p-3.5 rounded-2xl shadow-xs flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Productos</div>
              <div className="text-xl font-black text-slate-900">{kpis.productos}</div>
            </div>
          </div>

          {/* Unidades Solicitadas */}
          <div className="snap-start shrink-0 w-40 bg-white border border-emerald-100 p-3.5 rounded-2xl shadow-xs flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">shopping_cart</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Unidades</div>
              <div className="text-xl font-black text-slate-900">{kpis.unidades} und</div>
            </div>
          </div>

          {/* Inversión estimada */}
          <div className="snap-start shrink-0 w-44 bg-white border border-amber-100 p-3.5 rounded-2xl shadow-xs flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Inversión USA</div>
              <div className="text-lg font-black text-slate-900">$ {kpis.inversion.toFixed(2)}</div>
            </div>
          </div>

          {/* Ganancia estimada */}
          <div className="snap-start shrink-0 w-44 bg-white border border-emerald-200 p-3.5 rounded-2xl shadow-xs flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl font-bold">trending_up</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-emerald-800 uppercase">Ganancia Est.</div>
              <div className="text-lg font-black text-emerald-700">$ {kpis.ganancia.toFixed(2)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. SELECTOR DE VISTAS (PRODUCTO / CLIENTE) */}
      <div className="px-4 py-1">
        <div className="grid grid-cols-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-xs">
          <button
            onClick={() => setViewMode('cliente')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'cliente'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">group</span>
            <span>Vista por Cliente</span>
          </button>
          <button
            onClick={() => setViewMode('producto')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
              viewMode === 'producto'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            <span>Vista por Producto</span>
          </button>
        </div>
      </div>

      {/* 6. BUSCADOR Y CATEGORÍAS */}
      <div className="px-4 py-2 space-y-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente o producto..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

        {/* Chips de categorías en scroll horizontal */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {categoriesList.map((c) => (
            <button
              key={c}
              onClick={() => setSelectedCategory(c)}
              className={`shrink-0 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                selectedCategory === c
                  ? 'bg-[#0b1b3d] text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 7. CONTENIDO PRINCIPAL: VISTA POR CLIENTE */}
      {viewMode === 'cliente' && (
        <div className="px-4 space-y-3 mt-1">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
              <span className="material-symbols-outlined text-3xl mb-1 text-slate-300 block">
                person_search
              </span>
              No hay pedidos que coincidan con la búsqueda.
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isExpanded = !!expandedClients[cust.ticketId];

              return (
                <div
                  key={cust.ticketId}
                  className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden"
                >
                  {/* Encabezado del Cliente */}
                  <div
                    onClick={() =>
                      setExpandedClients((prev) => ({
                        ...prev,
                        [cust.ticketId]: !prev[cust.ticketId],
                      }))
                    }
                    className="p-3.5 flex flex-col gap-2.5 cursor-pointer active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm">
                          {cust.cliente.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-black text-slate-900 text-sm leading-tight">
                            {cust.cliente}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400">
                            {cust.ticketCode}
                          </span>
                        </div>
                      </div>

                      {/* Total en Soles Prominente */}
                      <div className="bg-[#0b2447] text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs">
                        <span className="text-slate-300 font-medium text-[10px]">Total:</span>
                        <span className="text-emerald-300">S/ {cust.totalPEN.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Badges de Estado */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-lg border border-blue-200/60">
                        {cust.items.length} prod · {cust.totalUnits} und
                      </span>

                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">check</span>
                        {cust.purchasedCount} Comprado{cust.purchasedCount !== 1 ? 's' : ''}
                      </span>

                      <span className="bg-amber-50 text-amber-800 font-bold px-2 py-0.5 rounded-lg border border-amber-200">
                        {cust.pendingCount} Pendiente{cust.pendingCount !== 1 ? 's' : ''}
                      </span>

                      <div className="ml-auto text-slate-400 flex items-center">
                        <span className="material-symbols-outlined text-base">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalle Desplegado de Productos */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-3 space-y-2.5">
                      {cust.items.map((it) => (
                        <div
                          key={it.id}
                          className={`p-3 rounded-xl border transition-all ${
                            it.is_purchased
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <div className="w-11 h-11 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                                {it.img ? (
                                  <Image
                                    src={it.img}
                                    alt={it.name}
                                    fill
                                    className="object-cover"
                                    sizes="44px"
                                  />
                                ) : (
                                  <span className="material-symbols-outlined text-slate-400 text-lg">
                                    inventory_2
                                  </span>
                                )}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 text-xs">
                                  {it.name}
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span
                                    className={`text-[9px] font-black px-1.5 py-0.5 rounded border ${getCatStyle(
                                      it.category
                                    )}`}
                                  >
                                    {it.category}
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-500">
                                    Cant: {it.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Subtotal en Soles */}
                            <div className="text-right">
                              <div className="text-xs font-black text-slate-900">
                                S/ {it.subtotal_pen.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-400">
                                Costo: ${it.cost_usd.toFixed(2)}
                              </div>
                            </div>
                          </div>

                          {/* Observación y Checkbox "¿Comprado?" */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                            <button
                              onClick={() =>
                                setEditingObs({
                                  ticketId: cust.ticketId,
                                  itemId: it.id,
                                  text: it.observation || '',
                                })
                              }
                              className="text-[11px] text-slate-600 truncate max-w-[160px] flex items-center gap-1 hover:text-blue-600 text-left"
                            >
                              <span className="material-symbols-outlined text-xs text-slate-400">
                                edit
                              </span>
                              <span>{it.observation || it.subtitle || 'Añadir nota/talla'}</span>
                            </button>

                            {/* Botón "¿Comprado?" con feedback háptico */}
                            <button
                              onClick={() =>
                                handleTogglePurchased(cust.ticketId, it.id, it.is_purchased)
                              }
                              className={`px-3 py-1.5 rounded-xl font-black text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer ${
                                it.is_purchased
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-amber-100 text-amber-900 border border-amber-300'
                              }`}
                            >
                              <span className="material-symbols-outlined text-sm font-bold">
                                {it.is_purchased ? 'check' : 'pending'}
                              </span>
                              <span>{it.is_purchased ? 'Comprado' : 'Pendiente'}</span>
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Totales del Cliente */}
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>Inversión USA requerida:</span>
                          <strong className="text-slate-900 font-black">
                            $ {cust.totalCostUSD.toFixed(2)}
                          </strong>
                        </div>
                        <div className="flex justify-between text-emerald-700 text-[11px]">
                          <span>Ganancia estimada:</span>
                          <strong>$ {cust.totalProfitUSD.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between text-slate-900 font-black pt-1 border-t border-slate-100 text-xs">
                          <span>Total a cobrar en Perú:</span>
                          <span className="text-blue-700">S/ {cust.totalPEN.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 8. CONTENIDO PRINCIPAL: VISTA POR PRODUCTO (COMPRAS EN TIENDAS USA) */}
      {viewMode === 'producto' && (
        <div className="px-4 space-y-3 mt-1">
          {groupedProducts.map((p, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                    {p.img ? (
                      <Image src={p.img} alt={p.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <span className="material-symbols-outlined text-slate-400 text-xl">
                        inventory_2
                      </span>
                    )}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 text-sm">{p.name}</h4>
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded border inline-block mt-0.5 ${getCatStyle(
                        p.category
                      )}`}
                    >
                      {p.category}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-black text-blue-700">
                    {p.purchasedUnits} / {p.totalUnits}
                  </div>
                  <div className="text-[10px] text-slate-400">comprados</div>
                </div>
              </div>

              {/* Lista de clientes para este producto */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[10px] font-bold text-slate-400 uppercase">
                  Clientes que lo pidieron:
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {p.clients.map((cl: any, cIdx: number) => (
                    <div
                      key={cIdx}
                      onClick={() =>
                        handleTogglePurchased(cl.ticketId, cl.itemId, cl.is_purchased)
                      }
                      className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer active:scale-98 transition-all ${
                        cl.is_purchased
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>{cl.cliente}</span>
                          <span className="text-[11px] font-normal text-slate-500">
                            ({cl.quantity} und)
                          </span>
                        </div>
                        {cl.obs && (
                          <div className="text-[10px] text-slate-400 mt-0.5">{cl.obs}</div>
                        )}
                      </div>
                      <span
                        className={`text-xs font-black px-2 py-1 rounded-lg ${
                          cl.is_purchased
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {cl.is_purchased ? '✓ Listo' : 'Comprar'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 9. BOTTOM NAVIGATION (BARRA INFERIOR FLOTANTE) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-blue-600 p-1"
        >
          <span className="material-symbols-outlined text-xl">menu</span>
          <span className="text-[10px] font-bold">Menú</span>
        </button>

        <button
          onClick={() => setViewMode('cliente')}
          className={`flex flex-col items-center gap-1 p-1 ${
            viewMode === 'cliente' ? 'text-blue-600 font-black' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-xl">group</span>
          <span className="text-[10px]">Clientes</span>
        </button>

        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="flex items-center justify-center -mt-6 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 border-4 border-white active:scale-95 transition-transform"
          aria-label="Registrar pedido"
        >
          <span className="material-symbols-outlined text-2xl font-bold">add</span>
        </button>

        <button
          onClick={() => setViewMode('producto')}
          className={`flex flex-col items-center gap-1 p-1 ${
            viewMode === 'producto' ? 'text-blue-600 font-black' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-xl">inventory_2</span>
          <span className="text-[10px]">Productos</span>
        </button>

        <Link
          href="/admin"
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-blue-600 p-1"
        >
          <span className="material-symbols-outlined text-xl">computer</span>
          <span className="text-[10px] font-bold">Web Admin</span>
        </Link>
      </div>

      {/* 10. BOTTOM SHEET MODAL: "+ REGISTRAR PEDIDO MANUAL" */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-2xl">
                  add_shopping_cart
                </span>
                <h3 className="text-base font-black text-slate-900">Registrar Pedido Manual</h3>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre del Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Johan Tovar o Mariana Gómez"
                  value={orderForm.cliente}
                  onChange={(e) => setOrderForm({ ...orderForm, cliente: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  placeholder="+51 960 759 244"
                  value={orderForm.telefono}
                  onChange={(e) => setOrderForm({ ...orderForm, telefono: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Producto a Traer de USA *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. AirPods Pro 2 USB-C o Termo Stanley 40oz"
                  value={orderForm.productName}
                  onChange={(e) => setOrderForm({ ...orderForm, productName: e.target.value })}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoría</label>
                  <select
                    value={orderForm.category}
                    onChange={(e) => setOrderForm({ ...orderForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Tecnología">Tecnología</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Ropa">Ropa / Moda</option>
                    <option value="Perfumes">Perfumes</option>
                    <option value="Belleza">Belleza</option>
                    <option value="Apple">Apple</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={orderForm.quantity}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Costo USA ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={orderForm.costUsd}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, costUsd: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Precio Cobrado ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={orderForm.saleUsd}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, saleUsd: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                    = S/ {(orderForm.saleUsd * exchangeRate).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Observación / Talla / Especificación
                </label>
                <input
                  type="text"
                  placeholder="Ej. Color Rosa 40 oz, Talla L, Versión sellada"
                  value={orderForm.observation}
                  onChange={(e) => setOrderForm({ ...orderForm, observation: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="flex-1 py-3 rounded-xl bg-slate-100 font-bold text-slate-700 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md shadow-blue-600/30"
                >
                  {isSubmittingOrder ? 'Guardando...' : 'Guardar y Sincronizar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 11. MODAL PARA EDITAR NOTA / OBSERVACIÓN */}
      {editingObs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl w-full max-w-xs p-4 shadow-xl space-y-3">
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-blue-600 text-base">edit_note</span>
              Editar Observación
            </h4>
            <textarea
              rows={3}
              value={editingObs.text}
              onChange={(e) => setEditingObs({ ...editingObs, text: e.target.value })}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              placeholder="Talla, color, especificaciones..."
              autoFocus
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setEditingObs(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveObs}
                className="px-4 py-1.5 rounded-lg bg-blue-600 font-bold text-white shadow-xs"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

