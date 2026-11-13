'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useToast } from '@/context/CartContext';

export interface MonitorItem {
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

export interface CustomerOrderGroup {
  ticketId: string;
  ticketCode: string;
  cliente: string;
  telefono: string;
  fecha?: string;
  items: MonitorItem[];
  totalUnits: number;
  purchasedCount: number;
  pendingCount: number;
  totalCostUSD: number;
  totalProfitUSD: number;
  totalPEN: number;
  estado?: string;
}

interface OrderMonitorProps {
  tickets: any[];
  exchangeRate: number;
  onUpdateExchangeRate: (newRate: number) => Promise<void>;
  onRefreshTickets: () => void;
  productsCatalog?: any[];
}

// Datos de propuesta inicial (Propuesta monitor de pedidos) para cuando no hay items desglosados en BD
const PROPOSAL_DEMO_CUSTOMERS: CustomerOrderGroup[] = [
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
    estado: 'Confirmado y pagado',
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
      {
        id: 'item-402',
        name: 'Suplementos Creatina Optimum',
        subtitle: '300g Micronized',
        img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&q=80',
        category: 'Belleza',
        quantity: 1,
        cost_usd: 85.0,
        sale_usd: 110.0,
        price_pen: 350.0,
        subtotal_pen: 350.0,
        is_purchased: false,
        observation: 'Sin sabor, sellado USA',
      },
    ],
  },
];

export function OrderMonitor({
  tickets,
  exchangeRate,
  onUpdateExchangeRate,
  onRefreshTickets,
  productsCatalog = [],
}: OrderMonitorProps) {
  const { showToast } = useToast();

  // Estados principales
  const [viewMode, setViewMode] = useState<'cliente' | 'producto'>('cliente');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({
    'demo-1': true, // María expandida por defecto como en la maqueta
  });

  // Estado para edición del Tipo de Cambio
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [newRateInput, setNewRateInput] = useState(exchangeRate.toString());

  // Modal para "+ Registrar Pedido"
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    cliente: '',
    telefono: '',
    productName: '',
    category: 'Tecnología',
    quantity: 1,
    costUsd: 50,
    saleUsd: 70,
    observation: '',
    img: '',
  });

  // Modal para editar observación de un ítem
  const [editingObs, setEditingObs] = useState<{
    ticketId: string;
    itemId: string;
    currentText: string;
  } | null>(null);

  // Mapear tickets de Supabase a la estructura de CustomerOrderGroup
  const processedCustomers = useMemo<CustomerOrderGroup[]>(() => {
    // Si tenemos tickets con items en la BD, los procesamos
    const realTicketsWithItems = tickets.filter(
      (t) => Array.isArray(t.items) && t.items.length > 0
    );

    if (realTicketsWithItems.length === 0) {
      // Usar propuesta demo para visualización perfecta inmediata
      return PROPOSAL_DEMO_CUSTOMERS;
    }

    return realTicketsWithItems.map((t) => {
      const rate = exchangeRate || 3.5;
      const items: MonitorItem[] = t.items.map((it: any, idx: number) => {
        const qty = Number(it.quantity) || 1;
        const penPrice = Number(it.price) || 0;
        const saleUsd = it.sale_usd ? Number(it.sale_usd) : Number((penPrice / rate).toFixed(2));
        const costUsd = it.cost_usd ? Number(it.cost_usd) : Number((saleUsd * 0.72).toFixed(2)); // margen estimado si no existe
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

  // Lista de categorías únicas para el filtro
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('Todas');
    processedCustomers.forEach((cust) => {
      cust.items.forEach((it) => {
        if (it.category) cats.add(it.category);
      });
    });
    return Array.from(cats);
  }, [processedCustomers]);

  // Filtrado de clientes según búsqueda y categoría seleccionada
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return processedCustomers
      .map((cust) => {
        const matchCustomer = cust.cliente.toLowerCase().includes(q);
        const filteredItems = cust.items.filter((it) => {
          const matchQuery =
            matchCustomer ||
            it.name.toLowerCase().includes(q) ||
            (it.subtitle && it.subtitle.toLowerCase().includes(q)) ||
            (it.observation && it.observation.toLowerCase().includes(q));
          const matchCat = selectedCategory === 'Todas' || it.category === selectedCategory;
          return matchQuery && matchCat;
        });

        if (filteredItems.length === 0) return null;

        return {
          ...cust,
          items: filteredItems,
        };
      })
      .filter(Boolean) as CustomerOrderGroup[];
  }, [processedCustomers, searchQuery, selectedCategory]);

  // Métricas superiores (KPIs)
  const stats = useMemo(() => {
    const uniqueClients = new Set(processedCustomers.map((c) => c.cliente)).size;
    const allProducts = new Set<string>();
    let totalUnits = 0;
    let totalInvestmentUSD = 0;
    let totalProfitUSD = 0;

    processedCustomers.forEach((c) => {
      c.items.forEach((it) => {
        allProducts.add(it.name.toLowerCase().trim());
        totalUnits += it.quantity;
        totalInvestmentUSD += it.cost_usd * it.quantity;
        totalProfitUSD += (it.sale_usd - it.cost_usd) * it.quantity;
      });
    });

    return {
      clientes: uniqueClients,
      productos: allProducts.size,
      unidades: totalUnits,
      inversion: totalInvestmentUSD,
      ganancia: totalProfitUSD,
    };
  }, [processedCustomers]);

  // Vista agrupada por producto (para compras consolidadas en USA)
  const productsGrouped = useMemo(() => {
    const groups: Record<
      string,
      {
        name: string;
        category: string;
        img?: string;
        cost_usd: number;
        sale_usd: number;
        totalUnits: number;
        purchasedUnits: number;
        clients: {
          cliente: string;
          ticketCode: string;
          ticketId: string;
          itemId: string;
          quantity: number;
          is_purchased: boolean;
          observation: string;
        }[];
      }
    > = {};

    processedCustomers.forEach((cust) => {
      cust.items.forEach((it) => {
        const key = it.name.trim();
        if (!groups[key]) {
          groups[key] = {
            name: it.name,
            category: it.category,
            img: it.img,
            cost_usd: it.cost_usd,
            sale_usd: it.sale_usd,
            totalUnits: 0,
            purchasedUnits: 0,
            clients: [],
          };
        }
        groups[key].totalUnits += it.quantity;
        if (it.is_purchased) {
          groups[key].purchasedUnits += it.quantity;
        }
        groups[key].clients.push({
          cliente: cust.cliente,
          ticketCode: cust.ticketCode,
          ticketId: cust.ticketId,
          itemId: it.id,
          quantity: it.quantity,
          is_purchased: it.is_purchased,
          observation: it.observation || it.subtitle || '',
        });
      });
    });

    return Object.values(groups).filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery = !q || p.name.toLowerCase().includes(q);
      const matchCat = selectedCategory === 'Todas' || p.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [processedCustomers, searchQuery, selectedCategory]);

  // Toggle de acordeón
  const toggleCustomer = (id: string) => {
    setExpandedClients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Alternar checkbox "¿Comprado?"
  const handleTogglePurchased = async (
    ticketId: string,
    itemId: string,
    currentStatus: boolean
  ) => {
    const targetTicket = tickets.find(
      (t) => t.id === ticketId || t.ticket_code === ticketId
    );

    // Si es demo o no está en Supabase directamente
    if (!targetTicket) {
      // Modificar localmente en demo
      const custIndex = PROPOSAL_DEMO_CUSTOMERS.findIndex((c) => c.ticketId === ticketId);
      if (custIndex >= 0) {
        const item = PROPOSAL_DEMO_CUSTOMERS[custIndex].items.find((i) => i.id === itemId);
        if (item) {
          item.is_purchased = !currentStatus;
          PROPOSAL_DEMO_CUSTOMERS[custIndex].purchasedCount =
            PROPOSAL_DEMO_CUSTOMERS[custIndex].items.filter((i) => i.is_purchased).length;
          PROPOSAL_DEMO_CUSTOMERS[custIndex].pendingCount =
            PROPOSAL_DEMO_CUSTOMERS[custIndex].items.length -
            PROPOSAL_DEMO_CUSTOMERS[custIndex].purchasedCount;
        }
      }
      showToast(
        !currentStatus ? 'Marcado como Comprado' : 'Marcado como Pendiente',
        'Estado actualizado en el monitor'
      );
      onRefreshTickets();
      return;
    }

    // Actualización en Supabase
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedItems = (targetTicket.items || []).map((it: any) => {
      if (it.id === itemId || it.title === itemId) {
        return { ...it, comprado: !currentStatus, is_purchased: !currentStatus };
      }
      return it;
    });

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          items: updatedItems,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetTicket.id);

      if (error) throw error;
      showToast(
        !currentStatus ? '¡Comprado en USA!' : 'Marcado como Pendiente',
        `Producto actualizado en ticket ${targetTicket.ticket_code}`
      );
      onRefreshTickets();
    } catch (err) {
      console.error(err);
      showToast('Error al guardar', 'No se pudo actualizar el estado de compra.');
    }
  };

  // Guardar observación modificada
  const handleSaveObservation = async () => {
    if (!editingObs) return;
    const { ticketId, itemId, currentText } = editingObs;

    const targetTicket = tickets.find(
      (t) => t.id === ticketId || t.ticket_code === ticketId
    );

    if (!targetTicket) {
      // Demo update
      const cust = PROPOSAL_DEMO_CUSTOMERS.find((c) => c.ticketId === ticketId);
      const it = cust?.items.find((i) => i.id === itemId);
      if (it) it.observation = currentText;
      setEditingObs(null);
      showToast('Observación guardada', currentText);
      onRefreshTickets();
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedItems = (targetTicket.items || []).map((it: any) => {
      if (it.id === itemId || it.title === itemId) {
        return { ...it, observacion: currentText, observation: currentText };
      }
      return it;
    });

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          items: updatedItems,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetTicket.id);

      if (error) throw error;
      setEditingObs(null);
      showToast('Observación actualizada', currentText);
      onRefreshTickets();
    } catch (err) {
      console.error(err);
      showToast('Error', 'No se pudo guardar la observación.');
    }
  };

  // Guardar Tipo de Cambio
  const handleSaveExchangeRate = async () => {
    const rateNum = parseFloat(newRateInput);
    if (isNaN(rateNum) || rateNum <= 0) {
      showToast('Tipo de cambio inválido', 'Ingresa un valor mayor a 0');
      return;
    }
    await onUpdateExchangeRate(rateNum);
    setIsEditingRate(false);
    showToast('Tipo de cambio actualizado', `USD 1 = S/ ${rateNum.toFixed(2)}`);
  };

  // Registrar nuevo pedido manual (+ Registrar Pedido)
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.cliente || !newOrderForm.productName) {
      showToast('Faltan campos requeridos', 'Ingresa al menos el nombre del cliente y el producto');
      return;
    }

    setCreatingOrder(true);
    const supabase = getSupabaseBrowserClient();
    const rate = exchangeRate || 3.5;
    const penPrice = Number((newOrderForm.saleUsd * rate).toFixed(2));
    const subtotalPen = penPrice * newOrderForm.quantity;

    const newItem: MonitorItem = {
      id: `it-${Date.now()}`,
      name: newOrderForm.productName.trim(),
      subtitle: newOrderForm.observation.trim(),
      category: newOrderForm.category,
      quantity: Number(newOrderForm.quantity) || 1,
      cost_usd: Number(newOrderForm.costUsd) || 0,
      sale_usd: Number(newOrderForm.saleUsd) || 0,
      price_pen: penPrice,
      subtotal_pen: subtotalPen,
      is_purchased: false,
      observation: newOrderForm.observation.trim(),
      img: newOrderForm.img || '',
    };

    if (supabase) {
      try {
        const { data, error } = await supabase.rpc('fn_create_ticket', {
          p_origen: 'WhatsApp',
          p_cliente: newOrderForm.cliente.trim(),
          p_telefono: newOrderForm.telefono.trim() || '+51 900 000 000',
          p_detalle: `${newItem.name} x${newItem.quantity} (${newItem.category})`,
          p_total: subtotalPen,
          p_estado: 'Pendiente',
          p_tipo: 'whatsapp_manual',
          p_items: [newItem],
        });

        if (error) throw error;
        showToast('¡Pedido Registrado!', `Ticket creado para ${newOrderForm.cliente}`);
        setIsModalOpen(false);
        setNewOrderForm({
          cliente: '',
          telefono: '',
          productName: '',
          category: 'Tecnología',
          quantity: 1,
          costUsd: 50,
          saleUsd: 70,
          observation: '',
          img: '',
        });
        onRefreshTickets();
      } catch (err) {
        console.error(err);
        showToast('Error al registrar pedido', 'Revisa tu conexión a Supabase');
      } finally {
        setCreatingOrder(false);
      }
    } else {
      // Local fallback
      PROPOSAL_DEMO_CUSTOMERS.unshift({
        ticketId: `demo-${Date.now()}`,
        ticketCode: `TK-${Math.floor(1000 + Math.random() * 9000)}`,
        cliente: newOrderForm.cliente.trim(),
        telefono: newOrderForm.telefono.trim() || '+51 900 000 000',
        fecha: 'Ahora mismo',
        items: [newItem],
        totalUnits: newItem.quantity,
        purchasedCount: 0,
        pendingCount: 1,
        totalCostUSD: newItem.cost_usd * newItem.quantity,
        totalProfitUSD: (newItem.sale_usd - newItem.cost_usd) * newItem.quantity,
        totalPEN: subtotalPen,
        estado: 'Pendiente',
      });
      setCreatingOrder(false);
      setIsModalOpen(false);
      showToast('Pedido agregado', `${newOrderForm.cliente} registrado en el monitor.`);
      onRefreshTickets();
    }
  };

  // Helper para color de categoría
  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'tecnología':
      case 'apple':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'hogar':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'ropa':
      case 'moda':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'perfumes':
      case 'belleza':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shadow-sm shrink-0">
            <span className="material-symbols-outlined text-2xl font-bold">shopping_cart</span>
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Monitor de Pedidos
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Control de productos, clientes, costos y ganancias
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl self-start md:self-auto font-medium">
          <span className="material-symbols-outlined text-sm text-slate-500">calendar_today</span>
          <span>Actualizado: {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}, {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      {/* 2. TARJETAS DE MÉTRICAS SUPERIORES (KPIS) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Clientes */}
        <div className="bg-purple-50/60 border border-purple-100/90 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Clientes
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.clientes}</div>
          </div>
        </div>

        {/* Productos */}
        <div className="bg-blue-50/60 border border-blue-100/90 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">inventory_2</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Productos
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.productos}</div>
          </div>
        </div>

        {/* Unidades Solicitadas */}
        <div className="bg-emerald-50/60 border border-emerald-100/90 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">shopping_bag</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Unidades solicitadas
            </div>
            <div className="text-2xl font-black text-slate-900">{stats.unidades}</div>
          </div>
        </div>

        {/* Inversión estimada */}
        <div className="bg-amber-50/60 border border-amber-100/90 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Inversión estimada
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              $ {stats.inversion.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Ganancia estimada */}
        <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-xs col-span-2 sm:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl font-bold">trending_up</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider truncate">
              Ganancia estimada
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 truncate">
              $ {stats.ganancia.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE CONTROL DE VISTAS Y BOTÓN REGISTRAR PEDIDO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Toggle Vista por Producto / Vista por Cliente */}
        <div className="inline-flex p-1 bg-white border border-slate-200 rounded-2xl shadow-xs self-start">
          <button
            onClick={() => setViewMode('producto')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'producto'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            <span>Vista por Producto</span>
          </button>
          <button
            onClick={() => setViewMode('cliente')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              viewMode === 'cliente'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">group</span>
            <span>Vista por Cliente</span>
          </button>
        </div>

        {/* Botón "+ Registrar Pedido" */}
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
        >
          <span className="material-symbols-outlined text-base font-bold">add</span>
          <span>Registrar Pedido</span>
        </button>
      </div>

      {/* 4. BARRA DE HERRAMIENTAS, FILTROS Y TIPO DE CAMBIO */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-xs items-center">
        {/* Buscador */}
        <div className="md:col-span-5 relative">
          <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar producto o cliente..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Filtro Categoría */}
        <div className="md:col-span-4 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 shrink-0">Categoría:</span>
          <div className="relative flex-1">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
            >
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  🏷️ {c}
                </option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none">
              expand_more
            </span>
          </div>
        </div>

        {/* Widget Tipo de Cambio (USD a PEN) */}
        <div className="md:col-span-3 flex items-center justify-end gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
          <span className="text-xs font-semibold text-slate-600">USD a PEN:</span>
          {isEditingRate ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                step="0.01"
                value={newRateInput}
                onChange={(e) => setNewRateInput(e.target.value)}
                className="w-16 px-1.5 py-0.5 bg-white border border-blue-500 rounded text-xs font-black text-slate-900 text-center"
                autoFocus
              />
              <button
                onClick={handleSaveExchangeRate}
                className="p-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                title="Guardar"
              >
                <span className="material-symbols-outlined text-xs">check</span>
              </button>
              <button
                onClick={() => setIsEditingRate(false)}
                className="p-1 rounded bg-slate-200 text-slate-700 hover:bg-slate-300"
                title="Cancelar"
              >
                <span className="material-symbols-outlined text-xs">close</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-slate-400 text-sm">sync_alt</span>
              <span className="text-xs font-black text-slate-900">
                S/ {Number(exchangeRate).toFixed(2)}
              </span>
              <button
                onClick={() => {
                  setNewRateInput(exchangeRate.toString());
                  setIsEditingRate(true);
                }}
                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-colors"
                title="Modificar tipo de cambio"
              >
                <span className="material-symbols-outlined text-xs">edit</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5. VISTA POR CLIENTE (ACORDEONES) */}
      {viewMode === 'cliente' && (
        <div className="space-y-4">
          {filteredCustomers.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">person_search</span>
              <p className="font-bold text-slate-700">No se encontraron clientes ni pedidos</p>
              <p className="text-xs text-slate-400 mt-1">Prueba cambiando el término de búsqueda o categoría.</p>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isExpanded = !!expandedClients[cust.ticketId];

              return (
                <div
                  key={cust.ticketId}
                  className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden transition-all"
                >
                  {/* Encabezado del Cliente */}
                  <div
                    onClick={() => toggleCustomer(cust.ticketId)}
                    className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                        <span className="material-symbols-outlined text-xl">person</span>
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-slate-900">
                          {cust.cliente}
                        </h3>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {cust.ticketCode} {cust.telefono && `· ${cust.telefono}`}
                        </div>
                      </div>
                    </div>

                    {/* Badges de Resumen */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-xl border border-blue-200/70">
                        {cust.items.length} productos | {cust.totalUnits} unidades
                      </span>

                      <span className="bg-emerald-50 text-emerald-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-emerald-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">check_circle</span>
                        {cust.purchasedCount} Comprado{cust.purchasedCount !== 1 ? 's' : ''}
                      </span>

                      <span className="bg-amber-50 text-amber-700 text-xs font-bold px-2.5 py-1 rounded-xl border border-amber-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">pending</span>
                        {cust.pendingCount} Pendiente{cust.pendingCount !== 1 ? 's' : ''}
                      </span>

                      <div className="hidden md:flex items-center gap-3 text-xs border-l border-slate-200 pl-3">
                        <span className="text-slate-600 font-semibold">
                          Inversión: <strong className="text-slate-900 font-black">$ {cust.totalCostUSD.toFixed(2)}</strong>
                        </span>
                        <span className="text-emerald-600 font-bold">
                          Ganancia: <strong>$ {cust.totalProfitUSD.toFixed(2)}</strong>
                        </span>
                      </div>

                      {/* Botón Total del Carrito */}
                      <div className="bg-[#0b2447] text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1 shadow-xs">
                        <span>Total:</span>
                        <span className="text-emerald-300">S/ {cust.totalPEN.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      <div className="text-slate-400 ml-1">
                        <span className="material-symbols-outlined text-lg">
                          {isExpanded ? 'expand_less' : 'expand_more'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Productos del Cliente (Desplegable) */}
                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50/50">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px] text-left text-xs">
                          <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Producto</th>
                              <th className="py-3 px-3">Categoría</th>
                              <th className="py-3 px-3 text-center">Cant.</th>
                              <th className="py-3 px-3 text-right">Costo / ud. (USD)</th>
                              <th className="py-3 px-3 text-right">Venta / ud. (USD)</th>
                              <th className="py-3 px-3 text-center">Precio en Perú (PEN)</th>
                              <th className="py-3 px-3 text-right">Subtotal Perú (PEN)</th>
                              <th className="py-3 px-3 text-center">¿Comprado?</th>
                              <th className="py-3 px-4">Observación</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/80 bg-white">
                            {cust.items.map((it) => (
                              <tr
                                key={it.id}
                                className={`transition-colors ${
                                  it.is_purchased
                                    ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                                    : 'hover:bg-slate-50'
                                }`}
                              >
                                {/* Producto */}
                                <td className="py-3.5 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                                      {it.img ? (
                                        <Image
                                          src={it.img}
                                          alt={it.name}
                                          fill
                                          className="object-cover"
                                          sizes="40px"
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
                                      {it.subtitle && (
                                        <div className="text-[11px] text-slate-500">
                                          {it.subtitle}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                {/* Categoría */}
                                <td className="py-3.5 px-3">
                                  <span
                                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${getCategoryColor(
                                      it.category
                                    )}`}
                                  >
                                    {it.category}
                                  </span>
                                </td>

                                {/* Cantidad */}
                                <td className="py-3.5 px-3 text-center font-black text-slate-900">
                                  <span className="inline-block bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                                    {it.quantity}
                                  </span>
                                </td>

                                {/* Costo / ud. USD */}
                                <td className="py-3.5 px-3 text-right font-semibold text-slate-700">
                                  $ {it.cost_usd.toFixed(2)}
                                </td>

                                {/* Venta / ud. USD */}
                                <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                                  $ {it.sale_usd.toFixed(2)}
                                </td>

                                {/* Precio en Perú (PEN) */}
                                <td className="py-3.5 px-3 text-center">
                                  <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                                    S/ {it.price_pen.toFixed(2)}
                                  </span>
                                </td>

                                {/* Subtotal Perú (PEN) */}
                                <td className="py-3.5 px-3 text-right font-black text-slate-900">
                                  S/ {it.subtotal_pen.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </td>

                                {/* ¿Comprado? (Checkbox Interactivo) */}
                                <td className="py-3.5 px-3 text-center">
                                  <button
                                    onClick={() =>
                                      handleTogglePurchased(cust.ticketId, it.id, it.is_purchased)
                                    }
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                      it.is_purchased
                                        ? 'bg-emerald-600 text-white shadow-xs'
                                        : 'bg-amber-100/80 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined text-sm">
                                      {it.is_purchased ? 'check_box' : 'check_box_outline_blank'}
                                    </span>
                                    <span>{it.is_purchased ? 'Comprado' : 'Pendiente'}</span>
                                  </button>
                                </td>

                                {/* Observación editable */}
                                <td className="py-3.5 px-4 text-slate-600 text-xs">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate max-w-[160px]" title={it.observation}>
                                      {it.observation || '—'}
                                    </span>
                                    <button
                                      onClick={() =>
                                        setEditingObs({
                                          ticketId: cust.ticketId,
                                          itemId: it.id,
                                          currentText: it.observation || '',
                                        })
                                      }
                                      className="text-slate-400 hover:text-blue-600 p-1 rounded hover:bg-slate-100"
                                      title="Editar observación"
                                    >
                                      <span className="material-symbols-outlined text-sm">edit</span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Totales por Cliente (Footer de la tarjeta) */}
                      <div className="p-4 bg-slate-100/70 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                        <div className="font-bold text-slate-800">
                          Totales {cust.cliente}:
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                          <span className="flex items-center gap-1 font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                            <span className="material-symbols-outlined text-sm text-slate-500">shopping_cart</span>
                            {cust.totalUnits} unidades
                          </span>
                          <span className="flex items-center gap-1 font-semibold text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
                            <span className="material-symbols-outlined text-sm text-amber-600">account_balance_wallet</span>
                            Inversión: <strong>$ {cust.totalCostUSD.toFixed(2)}</strong>
                          </span>
                          <span className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                            <span className="material-symbols-outlined text-sm">trending_up</span>
                            Ganancia: <strong>$ {cust.totalProfitUSD.toFixed(2)}</strong>
                          </span>
                          <div className="bg-[#004aad] text-white font-black px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                            <span>Total del carrito:</span>
                            <span className="text-emerald-300 font-black">
                              S/ {cust.totalPEN.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
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

      {/* 6. VISTA POR PRODUCTO (COMPRAS CONSOLIDADAS EN TIENDAS DE USA) */}
      {viewMode === 'producto' && (
        <div className="space-y-4">
          {productsGrouped.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">inventory_2</span>
              <p className="font-bold text-slate-700">No se encontraron productos coincidentes</p>
            </div>
          ) : (
            productsGrouped.map((prod, idx) => {
              const allPurchased = prod.purchasedUnits >= prod.totalUnits;

              return (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                      {prod.img ? (
                        <Image
                          src={prod.img}
                          alt={prod.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-400 text-2xl">
                          inventory_2
                        </span>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-black text-slate-900">{prod.name}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${getCategoryColor(
                            prod.category
                          )}`}
                        >
                          {prod.category}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-3">
                        <span>
                          Costo USA: <strong>$ {prod.cost_usd.toFixed(2)}</strong> / ud.
                        </span>
                        <span>·</span>
                        <span>
                          Inversión total:{' '}
                          <strong className="text-amber-700">
                            $ {(prod.cost_usd * prod.totalUnits).toFixed(2)}
                          </strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Estado de Compras y desglose de clientes */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
                    {/* Badge de unidades a comprar */}
                    <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl text-xs">
                      <div className="text-[10px] uppercase font-bold text-slate-500">
                        Unidades Totales
                      </div>
                      <div className="text-lg font-black text-slate-900">
                        {prod.purchasedUnits} / {prod.totalUnits} compradas
                      </div>
                    </div>

                    {/* Desglose de Clientes para este producto */}
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {prod.clients.map((cl, cIdx) => (
                        <button
                          key={cIdx}
                          onClick={() =>
                            handleTogglePurchased(cl.ticketId, cl.itemId, cl.is_purchased)
                          }
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            cl.is_purchased
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100'
                          }`}
                          title={`Click para alternar: ${cl.cliente} (${cl.quantity} und) - ${cl.observation || 'Sin obs'}`}
                        >
                          <span className="material-symbols-outlined text-xs">
                            {cl.is_purchased ? 'check' : 'schedule'}
                          </span>
                          <span>
                            {cl.cliente} ({cl.quantity})
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Badge general */}
                    <span
                      className={`px-3 py-1.5 rounded-xl text-xs font-black ${
                        allPurchased
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {allPurchased ? 'Completo ✓' : 'Faltan compras'}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 7. MODAL "+ REGISTRAR PEDIDO" */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-2xl">
                  add_shopping_cart
                </span>
                <h3 className="text-lg font-black text-slate-900">Registrar Nuevo Pedido</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateManualOrder} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Nombre del Cliente *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sofía Rivas"
                    value={newOrderForm.cliente}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, cliente: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">WhatsApp / Teléfono</label>
                  <input
                    type="text"
                    placeholder="+51 987 654 321"
                    value={newOrderForm.telefono}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, telefono: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Producto a Comprar *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. AirPods Max Plata o Termo Stanley 40oz"
                  value={newOrderForm.productName}
                  onChange={(e) =>
                    setNewOrderForm({ ...newOrderForm, productName: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoría</label>
                  <select
                    value={newOrderForm.category}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                  >
                    <option value="Tecnología">Tecnología</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Ropa">Ropa / Moda</option>
                    <option value="Perfumes">Perfumes</option>
                    <option value="Belleza">Belleza</option>
                    <option value="Apple">Apple</option>
                    <option value="Relojes">Relojes</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={newOrderForm.quantity}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        quantity: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Costo USA ($)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOrderForm.costUsd}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        costUsd: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Precio Cobrado ($ USD)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newOrderForm.saleUsd}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        saleUsd: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Equivalente en Soles: S/ {(newOrderForm.saleUsd * exchangeRate).toFixed(2)}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Observación / Talla / Color</label>
                  <input
                    type="text"
                    placeholder="Ej. Talla M, Color Negro, 40 oz"
                    value={newOrderForm.observation}
                    onChange={(e) =>
                      setNewOrderForm({ ...newOrderForm, observation: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingOrder}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-md shadow-blue-500/20"
                >
                  {creatingOrder ? 'Registrando...' : 'Guardar Pedido'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL PARA EDITAR OBSERVACIÓN */}
      {editingObs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 w-full max-w-sm p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-base">edit_note</span>
              Editar Observación del Ítem
            </h4>
            <textarea
              rows={3}
              value={editingObs.currentText}
              onChange={(e) =>
                setEditingObs({ ...editingObs, currentText: e.target.value })
              }
              placeholder="Especificación, color, talla, link o nota de compra..."
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setEditingObs(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveObservation}
                className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
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

