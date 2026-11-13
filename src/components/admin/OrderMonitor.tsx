'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
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
  barcode?: string;
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

// Formateadores financieros con separadores de miles estándar internacional (e.g. 1,250.00)
export const formatUSD = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

export const formatPEN = (val: number): string => {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

export const formatQty = (val: number): string => {
  return new Intl.NumberFormat('en-US').format(val || 0);
};

interface OrderMonitorProps {
  tickets: any[];
  exchangeRate: number;
  onUpdateExchangeRate: (newRate: number) => Promise<void>;
  onRefreshTickets: () => void;
  productsCatalog?: any[];
}

// Datos de propuesta inicial (Propuesta monitor de pedidos) para cuando se elija ver ejemplos
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
        name: 'AirPods Max',
        subtitle: 'Plata · Cancelación Activa de Ruido',
        img: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=150&q=80',
        category: 'Tecnología',
        quantity: 1,
        cost_usd: 120.0,
        sale_usd: 150.0,
        price_pen: 525.0,
        subtotal_pen: 525.0,
        is_purchased: false,
        observation: 'Color Plata / Con estuche Smart Case',
      },
      {
        id: 'item-102',
        name: 'Stanley Quencher',
        subtitle: '40 oz. Color Rose Quartz',
        img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=150&q=80',
        category: 'Hogar',
        quantity: 2,
        cost_usd: 35.0,
        sale_usd: 50.0,
        price_pen: 175.0,
        subtotal_pen: 350.0,
        is_purchased: true,
        observation: 'Edición Limitada Rose Quartz',
      },
      {
        id: 'item-103',
        name: 'Zapatillas On Cloudtilt',
        subtitle: 'All Black · Talla 38 EU',
        img: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&q=80',
        category: 'Ropa',
        quantity: 1,
        cost_usd: 80.0,
        sale_usd: 110.0,
        price_pen: 280.0,
        subtotal_pen: 280.0,
        is_purchased: false,
        observation: 'Verificar suela acolchada CloudTec',
      },
    ],
  },
  {
    ticketId: 'demo-2',
    ticketCode: 'TK-1002',
    cliente: 'Carlos',
    telefono: '+51 912 345 678',
    fecha: '26 ene. 2025, 11:05 a. m.',
    totalUnits: 4,
    purchasedCount: 2,
    pendingCount: 0,
    totalCostUSD: 165.0,
    totalProfitUSD: 65.0,
    totalPEN: 805.0,
    estado: 'Comprado',
    items: [
      {
        id: 'item-201',
        name: 'Perfume Bleu de Chanel',
        subtitle: 'Eau de Parfum 100ml',
        img: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=150&q=80',
        category: 'Perfumes',
        quantity: 1,
        cost_usd: 130.0,
        sale_usd: 175.0,
        price_pen: 612.5,
        subtotal_pen: 612.5,
        is_purchased: true,
        observation: 'Comprado en Sephora Miami con ticket de regalo',
      },
      {
        id: 'item-202',
        name: 'Stanley Quencher',
        subtitle: '30 oz. Color Eucalyptus',
        img: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=150&q=80',
        category: 'Hogar',
        quantity: 3,
        cost_usd: 35.0,
        sale_usd: 55.0,
        price_pen: 64.17,
        subtotal_pen: 192.5,
        is_purchased: true,
        observation: 'Color Eucalyptus',
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
  const [showDemo, setShowDemo] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({
    'demo-1': true,
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
    productSource: 'catalog' as 'catalog' | 'custom',
    selectedCatalogId: '',
    productName: '',
    category: 'Tecnología',
    quantity: '1',
    costUsd: '',
    saleUsd: '',
    observation: '',
    img: '',
    barcode: '',
  });

  // Catálogo web de productos
  const [internalCatalog, setInternalCatalog] = useState<any[]>([]);
  const catalogList = (productsCatalog && productsCatalog.length > 0) ? productsCatalog : internalCatalog;

  useEffect(() => {
    if (!productsCatalog || productsCatalog.length === 0) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('name')
          .then(({ data }) => {
            if (data && data.length > 0) setInternalCatalog(data);
          });
      }
    }
  }, [productsCatalog]);

  const handleSelectCatalogProduct = (prodId: string) => {
    const prod = catalogList.find((p) => p.id === prodId);
    if (!prod) return;

    setNewOrderForm((prev) => ({
      ...prev,
      selectedCatalogId: prod.id,
      productName: prod.name,
      category: prod.category || 'General',
      img: prod.img || '',
      saleUsd: '',
      costUsd: '',
      observation: prod.description ? prod.description.substring(0, 120) : '',
    }));
  };

  // Modal para Editar Cliente
  const [editingClient, setEditingClient] = useState<{
    ticketId: string;
    cliente: string;
    telefono: string;
  } | null>(null);

  // Modal para Editar Producto
  const [editingProduct, setEditingProduct] = useState<{
    ticketId: string;
    item: MonitorItem;
  } | null>(null);

  // Modal para editar observación rápida de un ítem
  const [editingObs, setEditingObs] = useState<{
    ticketId: string;
    itemId: string;
    currentText: string;
  } | null>(null);

  // Escáner de Código de Barras
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannerTargetField, setScannerTargetField] = useState<'new' | 'edit'>('new');
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const html5QrCodeRef = useRef<any>(null);
  const [scannerStatus, setScannerStatus] = useState('Iniciando cámara...');

  // Referencias para fotos (Cámara y Galería)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const editGalleryInputRef = useRef<HTMLInputElement | null>(null);

  // Mapear tickets de Supabase a la estructura de CustomerOrderGroup
  const processedCustomers = useMemo<CustomerOrderGroup[]>(() => {
    const realTicketsWithItems = tickets.filter(
      (t) => Array.isArray(t.items) && t.items.length > 0
    );

    if (realTicketsWithItems.length === 0) {
      return showDemo ? PROPOSAL_DEMO_CUSTOMERS : [];
    }

    return realTicketsWithItems.map((t) => {
      const rate = exchangeRate || 3.5;
      const items: MonitorItem[] = t.items.map((it: any, idx: number) => {
        const qty = Number(it.quantity) || 1;
        const penPrice = Number(it.price_pen ?? it.price) || 0;
        const saleUsd = it.sale_usd !== undefined && it.sale_usd !== null && it.sale_usd !== ''
          ? Number(it.sale_usd)
          : Number((penPrice / rate).toFixed(2));
        const costUsd = it.cost_usd !== undefined && it.cost_usd !== null && it.cost_usd !== ''
          ? Number(it.cost_usd)
          : 0;
        const subtotalPen = it.subtotal_pen !== undefined && it.subtotal_pen !== null
          ? Number(it.subtotal_pen)
          : penPrice * qty;

        return {
          id: it.id || `it-${t.id || t.ticket_code}-${idx}`,
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
          barcode: it.barcode || '',
        };
      });

      const totalUnits = items.reduce((acc, item) => acc + item.quantity, 0);
      const purchasedCount = items.filter((i) => i.is_purchased).length;
      const pendingCount = items.length - purchasedCount;
      const totalCostUSD = items.reduce((acc, i) => acc + (i.cost_usd || 0) * i.quantity, 0);
      const totalSaleUSD = items.reduce((acc, i) => acc + (i.sale_usd || 0) * i.quantity, 0);
      const totalProfitUSD = totalSaleUSD - totalCostUSD;
      const totalPEN = items.reduce((acc, i) => acc + (i.subtotal_pen || 0), 0);

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
  }, [tickets, exchangeRate, showDemo]);

  // Categorías
  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('Todas');
    processedCustomers.forEach((cust) => {
      cust.items.forEach((item) => {
        if (item.category) cats.add(item.category);
      });
    });
    return Array.from(cats);
  }, [processedCustomers]);

  // Filtrado
  const filteredCustomers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return processedCustomers
      .map((cust) => {
        const matchCustomer =
          cust.cliente.toLowerCase().includes(q) ||
          cust.ticketCode.toLowerCase().includes(q) ||
          cust.telefono.includes(q);

        const filteredItems = cust.items.filter((item) => {
          const matchItem =
            matchCustomer ||
            item.name.toLowerCase().includes(q) ||
            (item.subtitle && item.subtitle.toLowerCase().includes(q)) ||
            (item.observation && item.observation.toLowerCase().includes(q)) ||
            (item.barcode && item.barcode.toLowerCase().includes(q));

          const matchCat =
            selectedCategory === 'Todas' || item.category === selectedCategory;

          return matchItem && matchCat;
        });

        if (filteredItems.length === 0) return null;

        return {
          ...cust,
          items: filteredItems,
        };
      })
      .filter(Boolean) as CustomerOrderGroup[];
  }, [processedCustomers, searchQuery, selectedCategory]);

  // Estadísticas del Monitor: Inversión (Costo USA) y Ganancia (El adicional sobre el costo)
  const stats = useMemo(() => {
    const clientsCount = new Set(processedCustomers.map((c) => c.cliente)).size;
    const uniqueProductsCount = new Set(
      processedCustomers.flatMap((c) => c.items.map((i) => i.name.toLowerCase().trim()))
    ).size;

    let totalUnits = 0;
    let totalInversion = 0;
    let totalGanancia = 0;
    let totalVentaUSD = 0;
    let totalVentaPEN = 0;

    processedCustomers.forEach((c) => {
      c.items.forEach((i) => {
        const qty = i.quantity || 1;
        const cost = (i.cost_usd || 0) * qty;
        const sale = (i.sale_usd || 0) * qty;
        const profit = ((i.sale_usd || 0) - (i.cost_usd || 0)) * qty;

        totalUnits += qty;
        totalInversion += cost;
        totalVentaUSD += sale;
        totalGanancia += profit;
        totalVentaPEN += i.subtotal_pen || 0;
      });
    });

    const rate = exchangeRate || 3.5;
    const marginPct = totalInversion > 0 ? (totalGanancia / totalInversion) * 100 : 0;

    return {
      clientes: clientsCount,
      productos: uniqueProductsCount,
      unidades: totalUnits,
      inversion: totalInversion,
      inversionPEN: totalInversion * rate,
      ganancia: totalGanancia,
      gananciaPEN: totalGanancia * rate,
      ventaTotalUSD: totalVentaUSD,
      ventaTotalPEN: totalVentaPEN,
      margen: marginPct,
    };
  }, [processedCustomers, exchangeRate]);

  // Vista agrupada por producto
  const groupedProducts = useMemo(() => {
    const map: Record<
      string,
      {
        name: string;
        category: string;
        img?: string;
        cost_usd: number;
        totalUnits: number;
        purchasedUnits: number;
        clients: {
          cliente: string;
          ticketId: string;
          itemId: string;
          quantity: number;
          is_purchased: boolean;
          obs: string;
        }[];
      }
    > = {};

    processedCustomers.forEach((cust) => {
      cust.items.forEach((item) => {
        const key = item.name.toLowerCase().trim();
        if (!map[key]) {
          map[key] = {
            name: item.name,
            category: item.category,
            img: item.img,
            cost_usd: item.cost_usd,
            totalUnits: 0,
            purchasedUnits: 0,
            clients: [],
          };
        }
        map[key].totalUnits += item.quantity;
        if (item.is_purchased) {
          map[key].purchasedUnits += item.quantity;
        }
        map[key].clients.push({
          cliente: cust.cliente,
          ticketId: cust.ticketId,
          itemId: item.id,
          quantity: item.quantity,
          is_purchased: item.is_purchased,
          obs: item.observation || item.subtitle || '',
        });
      });
    });

    return Object.values(map);
  }, [processedCustomers]);

  // Expandir / colapsar cliente
  const toggleCustomer = (id: string) => {
    setExpandedClients((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Alternar estado de compra "¿Comprado?"
  const handleTogglePurchased = async (
    ticketId: string,
    itemId: string,
    currentStatus: boolean
  ) => {
    const targetTicket = tickets.find(
      (t) => t.id === ticketId || t.ticket_code === ticketId
    );

    if (!targetTicket) {
      showToast(
        !currentStatus ? 'Marcado como Comprado' : 'Marcado como Pendiente',
        'Estado actualizado en modo vista'
      );
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedItems = (targetTicket.items || []).map((it: any) => {
      if (it.id === itemId || it.title === itemId || it.name === itemId) {
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
        `Producto actualizado en ${targetTicket.ticket_code || targetTicket.cliente}`
      );
      onRefreshTickets();
    } catch (err) {
      console.error(err);
      showToast('Error al guardar', 'No se pudo actualizar el estado de compra.');
    }
  };

  // 1. ELIMINAR CLIENTE
  const handleDeleteCustomer = async (ticketId: string, clienteNombre: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar a "${clienteNombre}" y todos sus productos registrados? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
      if (error) throw error;
      showToast('Cliente eliminado', `Se eliminó el pedido de ${clienteNombre}`);
      onRefreshTickets();
    } catch (e) {
      console.error(e);
      showToast('Error al eliminar', 'Verifica tu conexión a Supabase.');
    }
  };

  // 2. MODIFICAR CLIENTE
  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          cliente: editingClient.cliente.trim(),
          telefono: editingClient.telefono.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingClient.ticketId);

      if (error) throw error;
      showToast('Cliente actualizado', editingClient.cliente);
      setEditingClient(null);
      onRefreshTickets();
    } catch (e) {
      console.error(e);
      showToast('Error', 'No se pudo guardar la modificación del cliente.');
    }
  };

  // 3. ELIMINAR PRODUCTO
  const handleDeleteProduct = async (
    ticketId: string,
    itemId: string,
    productName: string
  ) => {
    const confirmDelete = window.confirm(
      `¿Deseas eliminar "${productName}" de este pedido?`
    );
    if (!confirmDelete) return;

    const target = tickets.find((t) => t.id === ticketId || t.ticket_code === ticketId);
    if (!target) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedItems = (target.items || []).filter((it: any) => it.id !== itemId);

    if (updatedItems.length === 0) {
      const deleteWhole = window.confirm(
        'Este era el único producto. ¿Deseas eliminar todo el pedido del cliente?'
      );
      if (deleteWhole) {
        await supabase.from('tickets').delete().eq('id', target.id);
        showToast('Pedido eliminado', 'No quedaron productos');
        onRefreshTickets();
        return;
      }
    }

    const newTotal = updatedItems.reduce(
      (acc: number, it: any) => acc + (Number(it.subtotal_pen) || 0),
      0
    );

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          items: updatedItems,
          total: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target.id);

      if (error) throw error;
      showToast('Producto eliminado', productName);
      if (editingProduct?.item.id === itemId) setEditingProduct(null);
      onRefreshTickets();
    } catch (e) {
      console.error(e);
      showToast('Error', 'No se pudo eliminar el producto.');
    }
  };

  // 4. MODIFICAR PRODUCTO
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const target = tickets.find(
      (t) => t.id === editingProduct.ticketId || t.ticket_code === editingProduct.ticketId
    );
    if (!target) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const rate = exchangeRate || 3.5;
    const penPrice = Number((editingProduct.item.sale_usd * rate).toFixed(2));
    const subtotalPen = penPrice * editingProduct.item.quantity;

    const updatedItem = {
      ...editingProduct.item,
      price_pen: penPrice,
      price: penPrice,
      subtotal_pen: subtotalPen,
    };

    const updatedItems = (target.items || []).map((it: any) =>
      it.id === updatedItem.id ? updatedItem : it
    );

    const newTotal = updatedItems.reduce(
      (acc: number, it: any) => acc + (Number(it.subtotal_pen) || 0),
      0
    );

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          items: updatedItems,
          total: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', target.id);

      if (error) throw error;
      showToast('Producto modificado', updatedItem.name);
      setEditingProduct(null);
      onRefreshTickets();
    } catch (e) {
      console.error(e);
      showToast('Error al modificar', 'Intenta nuevamente.');
    }
  };

  // 5. LIMPIAR TODO PARA EMPEZAR DE CERO
  const handleClearAllTickets = async () => {
    const confirmClear = window.prompt(
      '⚠️ ATENCIÓN: Esta acción borrará TODOS los pedidos del monitor para empezar desde cero.\n\nEscribe "BORRAR" para confirmar:'
    );
    if (confirmClear !== 'BORRAR') {
      if (confirmClear !== null) showToast('Cancelado', 'La confirmación no coincidió');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setShowDemo(false);
      showToast('Monitor Limpio', 'Se borraron todos los pedidos. Listo para empezar desde 0.');
      onRefreshTickets();
    } catch (e) {
      console.error(e);
      showToast('Error al limpiar', 'Verifica permisos en Supabase.');
    }
  };

  // 6. CAPTURA DE FOTOS DESDE CÁMARA O ARCHIVO
  const handlePhotoCapture = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetForm: 'new' | 'edit'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new (window as any).Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);

        if (targetForm === 'new') {
          setNewOrderForm((prev) => ({ ...prev, img: compressedDataUrl }));
        } else if (editingProduct) {
          setEditingProduct((prev) =>
            prev ? { ...prev, item: { ...prev.item, img: compressedDataUrl } } : null
          );
        }
        showToast('Foto cargada', 'Imagen del producto lista');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 7. ESCÁNER DE CÓDIGO DE BARRAS EN TIEMPO REAL CON HTML5-QRCODE
  const handleBarcodeSuccess = (code: string) => {
    stopBarcodeScanner();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }

    if (scannerTargetField === 'new') {
      setNewOrderForm((prev) => ({
        ...prev,
        barcode: code,
        observation: prev.observation
          ? `${prev.observation} · Cod: ${code}`
          : `Cod: ${code}`,
      }));
    } else if (editingProduct) {
      setEditingProduct((prev) =>
        prev
          ? {
              ...prev,
              item: {
                ...prev.item,
                barcode: code,
                observation: prev.item.observation
                  ? `${prev.item.observation} · Cod: ${code}`
                  : `Cod: ${code}`,
              },
            }
          : null
      );
    }
    showToast('¡Código detectado con éxito!', code);
  };

  const startBarcodeScanner = (target: 'new' | 'edit') => {
    setScannerTargetField(target);
    setManualBarcodeInput('');
    setIsBarcodeScannerOpen(true);
    setScannerStatus('Iniciando cámara...');
  };

  const stopBarcodeScanner = () => {
    if (html5QrCodeRef.current) {
      try {
        html5QrCodeRef.current.stop().catch(() => {}).then(() => {
          try {
            html5QrCodeRef.current?.clear();
          } catch {}
          html5QrCodeRef.current = null;
        });
      } catch {}
    }
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((t) => t.stop());
      scannerStreamRef.current = null;
    }
    setIsBarcodeScannerOpen(false);
  };

  useEffect(() => {
    if (!isBarcodeScannerOpen) return;

    let isMounted = true;

    const timer = setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode('barcode-scanner-viewport-desktop');
        html5QrCodeRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: { width: 280, height: 160 },
          },
          (decodedText: string) => {
            if (isMounted) {
              handleBarcodeSuccess(decodedText);
            }
          },
          () => {}
        );

        if (isMounted) {
          setScannerStatus('Apunta la cámara al código de barras o QR');
        }
      } catch (err: any) {
        console.error('Error al iniciar escáner:', err);
        if (isMounted) {
          setScannerStatus(
            'No se pudo abrir la cámara. Verifica que diste permisos de Cámara en el navegador o escribe el código manualmente abajo.'
          );
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        html5QrCodeRef.current.stop().catch(() => {}).then(() => {
          try {
            html5QrCodeRef.current?.clear();
          } catch {}
          html5QrCodeRef.current = null;
        });
      }
    };
  }, [isBarcodeScannerOpen]);

  // Guardar observación rápida
  const handleSaveObservation = async () => {
    if (!editingObs) return;
    const { ticketId, itemId, currentText } = editingObs;

    const targetTicket = tickets.find(
      (t) => t.id === ticketId || t.ticket_code === ticketId
    );

    if (!targetTicket) {
      setEditingObs(null);
      showToast('Observación guardada', currentText);
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedItems = (targetTicket.items || []).map((it: any) => {
      if (it.id === itemId || it.title === itemId || it.name === itemId) {
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
      showToast('Observación guardada', currentText);
      onRefreshTickets();
    } catch {
      showToast('Error', 'No se pudo guardar la observación.');
    }
  };

  // Crear nuevo pedido manual o agregar producto a cliente existente
  const handleCreateManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.cliente.trim() || !newOrderForm.productName.trim()) {
      showToast('Campos requeridos', 'Ingresa cliente y nombre de producto.');
      return;
    }

    setCreatingOrder(true);
    const supabase = getSupabaseBrowserClient();
    const rate = exchangeRate || 3.5;
    const saleUsd = parseFloat(newOrderForm.saleUsd) || 0;
    const costUsd = parseFloat(newOrderForm.costUsd) || 0;
    const qty = parseInt(newOrderForm.quantity) || 1;
    const penPrice = Number((saleUsd * rate).toFixed(2));
    const subtotalPen = penPrice * qty;

    const newItem: MonitorItem = {
      id: `man-${Date.now()}`,
      name: newOrderForm.productName.trim(),
      subtitle: newOrderForm.observation.trim(),
      img: newOrderForm.img,
      category: newOrderForm.category || 'General',
      quantity: qty,
      cost_usd: costUsd,
      sale_usd: saleUsd,
      price_pen: penPrice,
      subtotal_pen: subtotalPen,
      is_purchased: false,
      observation: newOrderForm.observation.trim(),
      barcode: newOrderForm.barcode.trim(),
    };

    if (supabase) {
      try {
        const clientClean = newOrderForm.cliente.trim();
        const existingTicket = tickets.find(
          (t) => t.cliente?.trim().toLowerCase() === clientClean.toLowerCase()
        );

        if (existingTicket) {
          const updatedItems = [...(existingTicket.items || []), newItem];
          const newTotal = updatedItems.reduce(
            (acc: number, it: any) =>
              acc +
              (Number(it.subtotal_pen) ||
                Number(it.price_pen) * (Number(it.quantity) || 1) ||
                0),
            0
          );

          const { error } = await supabase
            .from('tickets')
            .update({
              items: updatedItems,
              total: Number(newTotal.toFixed(2)),
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingTicket.id);

          if (error) throw error;
          showToast('Producto agregado al cliente', `${clientClean}: ${newItem.name}`);
        } else {
          const ticketCode = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
          const { error } = await supabase.from('tickets').insert({
            ticket_code: ticketCode,
            cliente: clientClean,
            telefono: newOrderForm.telefono.trim() || '+51 900 000 000',
            origen: 'WhatsApp',
            tipo: 'whatsapp_manual',
            estado: 'Pendiente',
            items: [newItem],
            total: subtotalPen,
            metodo_pago: 'Manual',
          });

          if (error) throw error;
          showToast('Pedido registrado en Supabase', `${ticketCode} - ${clientClean}`);
        }

        setIsModalOpen(false);
        setNewOrderForm({
          cliente: '',
          telefono: '',
          productSource: 'catalog',
          selectedCatalogId: '',
          productName: '',
          category: 'Tecnología',
          quantity: '1',
          costUsd: '',
          saleUsd: '',
          observation: '',
          img: '',
          barcode: '',
        });
        onRefreshTickets();
      } catch (err) {
        console.error(err);
        showToast('Error', 'No se pudo guardar en Supabase.');
      } finally {
        setCreatingOrder(false);
      }
    }
  };

  // Color de categorías
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'tecnología':
      case 'apple':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'hogar':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'ropa':
      case 'ropa / moda':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'perfumes':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'belleza':
        return 'bg-pink-50 text-pink-700 border-pink-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. INPUTS OCULTOS DE FOTOS (CÁMARA Y GALERÍA) */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoCapture(e, 'new')}
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        accept="image/*"
        onChange={(e) => handlePhotoCapture(e, 'new')}
        className="hidden"
      />
      <input
        type="file"
        ref={editFileInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handlePhotoCapture(e, 'edit')}
        className="hidden"
      />
      <input
        type="file"
        ref={editGalleryInputRef}
        accept="image/*"
        onChange={(e) => handlePhotoCapture(e, 'edit')}
        className="hidden"
      />

      {/* 2. TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="bg-slate-50/60 border border-slate-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">group</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Clientes
            </div>
            <div className="text-2xl font-black text-slate-900">{formatQty(stats.clientes)}</div>
          </div>
        </div>

        <div className="bg-blue-50/60 border border-blue-100/90 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">inventory_2</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Productos
            </div>
            <div className="text-2xl font-black text-slate-900">{formatQty(stats.productos)}</div>
          </div>
        </div>

        <div className="bg-emerald-50/60 border border-emerald-100/90 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">shopping_bag</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Unidades solicitadas
            </div>
            <div className="text-2xl font-black text-slate-900">{formatQty(stats.unidades)} und</div>
          </div>
        </div>

        <div className="bg-amber-50/60 border border-amber-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl">payments</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider truncate">
              Inversión USA (Costo)
            </div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
              $ {formatUSD(stats.inversion)}
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ≈ S/ {formatPEN(stats.inversionPEN)}
            </div>
          </div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 p-4 rounded-2xl flex items-center gap-3 shadow-xs col-span-2 sm:col-span-1">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-2xl font-bold">trending_up</span>
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider truncate flex items-center gap-1.5">
              <span>Ganancia Estimada</span>
              {stats.inversion > 0 && (
                <span className="text-[9px] px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-black">
                  +{stats.margen.toFixed(0)}%
                </span>
              )}
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 truncate">
              +$ {formatUSD(stats.ganancia)}
            </div>
            <div className="text-[10px] text-emerald-600 font-mono">
              +S/ {formatPEN(stats.gananciaPEN)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. BARRA DE CONTROL DE VISTAS Y ACCIONES */}
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

        {/* Botones de acción */}
        <div className="flex items-center gap-2">
          {processedCustomers.length === 0 && (
            <button
              onClick={() => setShowDemo(!showDemo)}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all"
            >
              {showDemo ? 'Ocultar ejemplos' : 'Cargar ejemplos'}
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-base font-bold">add</span>
            <span>Registrar Pedido</span>
          </button>
        </div>
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
            placeholder="Buscar producto, cliente o código..."
            className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Selector de Categorías */}
        <div className="md:col-span-4 flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Filtrar:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl px-3 py-2 font-semibold focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            {availableCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Tipo de Cambio Widget */}
        <div className="md:col-span-3 flex items-center justify-end gap-2 bg-blue-50/50 border border-blue-100 p-1.5 rounded-xl">
          <span className="text-[11px] font-bold text-slate-600">TC (USD/PEN):</span>
          {isEditingRate ? (
            <div className="flex items-center gap-1">
              <input
                type="number"
                step="0.01"
                value={newRateInput}
                onChange={(e) => setNewRateInput(e.target.value)}
                className="w-16 bg-white border border-blue-300 rounded px-1.5 py-0.5 text-xs font-bold text-slate-900 focus:outline-none"
              />
              <button
                onClick={async () => {
                  const r = parseFloat(newRateInput);
                  if (r > 0) {
                    await onUpdateExchangeRate(r);
                    setIsEditingRate(false);
                    showToast('Tipo de cambio actualizado', `1 USD = S/ ${r.toFixed(2)}`);
                  }
                }}
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
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-3xl">shopping_cart_checkout</span>
              </div>
              <p className="font-bold text-slate-900 text-base">Sin pedidos registrados</p>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Aún no tienes pedidos registrados en el monitor. Agrega el primer pedido con el botón superior para comenzar o sincronízalo en vivo desde la app móvil STOREBASS.
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md shadow-blue-500/20"
                >
                  + Registrar Primer Pedido
                </button>
              </div>
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
                        <div className="flex items-center gap-2">
                          <h3 className="text-base sm:text-lg font-black text-slate-900">
                            {cust.cliente}
                          </h3>
                          {/* Botón Modificar Cliente */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingClient({
                                ticketId: cust.ticketId,
                                cliente: cust.cliente,
                                telefono: cust.telefono,
                              });
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Modificar nombre o teléfono de este cliente"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                          </button>
                          {/* Botón Eliminar Cliente */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomer(cust.ticketId, cust.cliente);
                            }}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Eliminar este cliente y todo su pedido"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
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
                          Inversión: <strong className="text-slate-900 font-black">$ {formatUSD(cust.totalCostUSD)}</strong>
                        </span>
                        <span className="text-emerald-600 font-bold">
                          Ganancia: <strong>+${formatUSD(cust.totalProfitUSD)}</strong>
                        </span>
                      </div>

                      {/* Botón Total del Carrito */}
                      <div className="bg-[#0b2447] text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-1 shadow-xs">
                        <span>Total:</span>
                        <span className="text-emerald-300">
                          S/ {formatPEN(cust.totalPEN)}
                        </span>
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
                        <table className="w-full min-w-[920px] text-left text-xs">
                          <thead className="bg-slate-100/90 text-slate-700 font-bold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                            <tr>
                              <th className="py-3 px-4">Producto</th>
                              <th className="py-3 px-3">Categoría</th>
                              <th className="py-3 px-3 text-center">Cant.</th>
                              <th className="py-3 px-3 text-right">Costo USD</th>
                              <th className="py-3 px-3 text-right">Venta USD</th>
                              <th className="py-3 px-3 text-center">Precio PEN</th>
                              <th className="py-3 px-3 text-right">Subtotal PEN</th>
                              <th className="py-3 px-3 text-center">¿Comprado?</th>
                              <th className="py-3 px-4">Observación</th>
                              <th className="py-3 px-3 text-center">Acciones</th>
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
                                      {it.barcode && (
                                        <div className="text-[10px] text-blue-600 font-mono mt-0.5">
                                          🏷️ {it.barcode}
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
                                  $ {formatUSD(it.cost_usd)}
                                </td>

                                {/* Venta / ud. USD */}
                                <td className="py-3.5 px-3 text-right font-semibold text-slate-900">
                                  $ {formatUSD(it.sale_usd)}
                                </td>

                                {/* Precio en Perú (PEN) */}
                                <td className="py-3.5 px-3 text-center">
                                  <span className="bg-blue-100 text-blue-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                                    S/ {formatPEN(it.price_pen)}
                                  </span>
                                </td>

                                {/* Subtotal Perú (PEN) */}
                                <td className="py-3.5 px-3 text-right font-black text-slate-900">
                                  S/ {formatPEN(it.subtotal_pen)}
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
                                    <span className="truncate max-w-[140px]" title={it.observation}>
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
                                      <span className="material-symbols-outlined text-sm">edit_note</span>
                                    </button>
                                  </div>
                                </td>

                                {/* Acciones de producto */}
                                <td className="py-3.5 px-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() =>
                                        setEditingProduct({
                                          ticketId: cust.ticketId,
                                          item: it,
                                        })
                                      }
                                      className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                                      title="Modificar producto"
                                    >
                                      <span className="material-symbols-outlined text-base">edit</span>
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleDeleteProduct(cust.ticketId, it.id, it.name)
                                      }
                                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                      title="Eliminar producto"
                                    >
                                      <span className="material-symbols-outlined text-base">delete</span>
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
                          <span className="text-slate-600">
                            Inversión USA: <strong>$ {formatUSD(cust.totalCostUSD)}</strong>
                          </span>
                          <span className="text-emerald-700 font-bold">
                            Ganancia Adicional: <strong>+${formatUSD(cust.totalProfitUSD)}</strong>
                          </span>
                          <span className="text-slate-900 font-black bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-2xs">
                            Total Pedido: S/ {formatPEN(cust.totalPEN)}
                          </span>
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

      {/* 6. VISTA POR PRODUCTO */}
      {viewMode === 'producto' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groupedProducts.length === 0 ? (
            <div className="col-span-full bg-white border border-slate-200 rounded-3xl p-12 text-center text-slate-500 shadow-xs">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">inventory_2</span>
              <p className="font-bold text-slate-700">No hay productos solicitados</p>
            </div>
          ) : (
            groupedProducts.map((prod, idx) => {
              const allPurchased = prod.purchasedUnits >= prod.totalUnits;
              return (
                <div
                  key={`${prod.name}-${idx}`}
                  className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                      {prod.img ? (
                        <Image
                          src={prod.img}
                          alt={prod.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-slate-400 text-xl">
                          inventory_2
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getCategoryColor(prod.category)}`}>
                          {prod.category}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            allPurchased
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {prod.purchasedUnits} / {prod.totalUnits} comprados
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">
                        {prod.name}
                      </h4>
                      <div className="text-[11px] text-slate-500">
                        Costo aprox: $ {formatUSD(prod.cost_usd)}
                      </div>
                    </div>
                  </div>

                  {/* Clientes que lo pidieron */}
                  <div className="border-t border-slate-100 pt-2.5 space-y-1.5 text-xs">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Pedidos de este producto:
                    </div>
                    {prod.clients.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between py-1 px-2 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-slate-800 truncate">
                            {c.cliente}
                          </span>
                          <span className="text-[11px] bg-white border border-slate-200 px-1.5 rounded text-slate-600 font-bold">
                            {c.quantity} ud.
                          </span>
                        </div>
                        <button
                          onClick={() => handleTogglePurchased(c.ticketId, c.itemId, c.is_purchased)}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                            c.is_purchased
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {c.is_purchased ? 'Comprado' : 'Pendiente'}
                        </button>
                      </div>
                    ))}
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
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-lg p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
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

              {/* Origen del Producto: Catálogo Web vs Personalizado */}
              <div>
                <label className="block text-slate-700 font-bold mb-1.5">Origen del Producto</label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() =>
                      setNewOrderForm((prev) => ({ ...prev, productSource: 'catalog' }))
                    }
                    className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                      newOrderForm.productSource === 'catalog'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    📦 Del Catálogo Web
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setNewOrderForm((prev) => ({
                        ...prev,
                        productSource: 'custom',
                        selectedCatalogId: '',
                      }))
                    }
                    className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
                      newOrderForm.productSource === 'custom'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ✨ Producto Nuevo / Otro
                  </button>
                </div>
              </div>

              {/* Selector del Catálogo si está activo */}
              {newOrderForm.productSource === 'catalog' && (
                <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                  <label className="block text-blue-900 font-black">
                    Selecciona Producto de la Web ({catalogList.length} disponibles)
                  </label>
                  <select
                    value={newOrderForm.selectedCatalogId}
                    onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  >
                    <option value="">-- Elige un producto del catálogo --</option>
                    {catalogList.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-blue-700">
                    Se completan automáticamente el nombre, categoría, foto y precios estimados. Puedes ajustarlos libremente abajo.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre del Producto *</label>
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

              {/* Botón Tomar Foto y Código de Barras */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Foto & Código de Barras</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      <span>Tomar Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startBarcodeScanner('new')}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">barcode_scanner</span>
                      <span>Escanear Código</span>
                    </button>
                  </div>
                </div>

                {newOrderForm.img && (
                  <div className="relative w-24 h-24 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <img
                      src={newOrderForm.img}
                      alt="Foto producto"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewOrderForm((p) => ({ ...p, img: '' }))}
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 shadow"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                )}

                {newOrderForm.barcode && (
                  <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    Código de barras registrado: <strong>{newOrderForm.barcode}</strong>
                  </div>
                )}
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
                    <option value="Apple">Apple</option>
                    <option value="Hogar">Hogar</option>
                    <option value="Ropa">Ropa / Moda</option>
                    <option value="Perfumes">Perfumes</option>
                    <option value="Belleza">Belleza</option>
                    <option value="Suplementos">Suplementos</option>
                    <option value="Relojes">Relojes</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cantidad</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="1"
                    placeholder="1"
                    value={newOrderForm.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        quantity: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Costo USA ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="Ej. 50"
                    value={newOrderForm.costUsd}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        costUsd: e.target.value,
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
                    inputMode="decimal"
                    step="any"
                    placeholder="Ej. 70"
                    value={newOrderForm.saleUsd}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setNewOrderForm({
                        ...newOrderForm,
                        saleUsd: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    {newOrderForm.saleUsd
                      ? `Equivalente: S/ ${(parseFloat(newOrderForm.saleUsd) * exchangeRate).toFixed(2)}`
                      : 'Equivalente en Soles automático'}
                  </span>
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Observación / Detalle</label>
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

      {/* 8. MODAL MODIFICAR CLIENTE */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-sm p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">person_edit</span>
                Modificar Cliente
              </h3>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveEditClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  value={editingClient.cliente}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, cliente: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">WhatsApp / Teléfono</label>
                <input
                  type="text"
                  value={editingClient.telefono}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, telefono: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. MODAL MODIFICAR PRODUCTO */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-md p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600">edit</span>
                Modificar Producto
              </h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveEditProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={editingProduct.item.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      item: { ...editingProduct.item, name: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Botón Tomar Foto y Código de Barras */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700">Foto & Código de Barras</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => editFileInputRef.current?.click()}
                      className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      <span>Cambiar Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startBarcodeScanner('edit')}
                      className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">barcode_scanner</span>
                      <span>Escanear</span>
                    </button>
                  </div>
                </div>

                {editingProduct.item.img && (
                  <div className="relative w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-white">
                    <img
                      src={editingProduct.item.img}
                      alt="Foto producto"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setEditingProduct((p) =>
                          p ? { ...p, item: { ...p.item, img: '' } } : null
                        )
                      }
                      className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-0.5 shadow"
                    >
                      <span className="material-symbols-outlined text-xs">close</span>
                    </button>
                  </div>
                )}

                {editingProduct.item.barcode && (
                  <div className="text-[11px] font-mono text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                    Código: <strong>{editingProduct.item.barcode}</strong>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoría</label>
                  <input
                    type="text"
                    value={editingProduct.item.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        item: { ...editingProduct.item, category: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    value={editingProduct.item.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        item: {
                          ...editingProduct.item,
                          quantity: parseInt(e.target.value) || 1,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Costo USA ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingProduct.item.cost_usd || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        item: {
                          ...editingProduct.item,
                          cost_usd: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Venta USA ($)</label>
                  <input
                    type="number"
                    step="any"
                    value={editingProduct.item.sale_usd || ''}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        item: {
                          ...editingProduct.item,
                          sale_usd: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Observación</label>
                <input
                  type="text"
                  value={editingProduct.item.observation}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      item: { ...editingProduct.item, observation: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 10. MODAL PARA ESCÁNER DE CÓDIGO DE BARRAS CON CÁMARA */}
      {isBarcodeScannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 space-y-4 text-white text-center shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-400">barcode_scanner</span>
                <span className="font-bold text-sm">Escáner de Código</span>
              </div>
              <button
                onClick={stopBarcodeScanner}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="relative w-full aspect-square bg-black rounded-2xl overflow-hidden border border-slate-700 flex items-center justify-center">
              <div
                id="barcode-scanner-viewport-desktop"
                className="w-full h-full flex items-center justify-center"
              />
            </div>

            <p className="text-xs text-slate-300 font-mono">{scannerStatus}</p>

            {/* Alternativa: Ingreso manual directo */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800 text-left">
              <label className="text-[10px] font-bold text-slate-400 block">
                O escribe el código de barras manualmente:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. 195949112233"
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualBarcodeInput.trim()) {
                      handleBarcodeSuccess(manualBarcodeInput.trim());
                      setManualBarcodeInput('');
                    }
                  }}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all"
                >
                  Listo
                </button>
              </div>
            </div>

            <button
              onClick={stopBarcodeScanner}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold"
            >
              Cerrar Cámara
            </button>
          </div>
        </div>
      )}

      {/* 11. MODAL PARA EDITAR OBSERVACIÓN RÁPIDA */}
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
