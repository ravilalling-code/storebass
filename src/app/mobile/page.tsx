'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  barcode?: string;
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

export default function MobileMonitorPage() {
  const { showToast } = useToast();

  // Estados principales
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cliente' | 'producto' | 'monetizacion'>('cliente');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [exchangeRate, setExchangeRate] = useState<number>(3.5);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('3.50');
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Detección de iOS para sugerir instalación PWA
  const [showIosInstallGuide, setShowIosInstallGuide] = useState(false);

  // Modales
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Modal para Editar Cliente
  const [editingClient, setEditingClient] = useState<{
    ticketId: string;
    cliente: string;
    telefono: string;
  } | null>(null);

  // Modal para Editar Producto
  const [editingProduct, setEditingProduct] = useState<{
    ticketId: string;
    item: MobileItem;
  } | null>(null);

  // Estado del Formulario de Nuevo Pedido (Campos limpios sin 0 por defecto)
  const [orderForm, setOrderForm] = useState({
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

  // Productos cargados desde el catálogo de la web
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // Escáner de Código de Barras
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannerTargetField, setScannerTargetField] = useState<'new' | 'edit'>('new');
  const [manualBarcodeInput, setManualBarcodeInput] = useState('');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const html5QrCodeRef = useRef<any>(null);
  const isStoppingScannerRef = useRef(false);
  const [scannerStatus, setScannerStatus] = useState('Iniciando cámara...');

  // Referencias para foto (Cámara nativa y Galería)
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);
  const editGalleryInputRef = useRef<HTMLInputElement | null>(null);
  const barcodePhotoInputRef = useRef<HTMLInputElement | null>(null);

  // Modal para edición rápida de observación de cada producto
  const [editingObs, setEditingObs] = useState<{
    ticketId: string;
    itemId: string;
    currentText: string;
  } | null>(null);

  // Detectar iOS en Safari
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userAgent = window.navigator.userAgent.toLowerCase();
      const isIos = /iphone|ipad|ipod/.test(userAgent);
      const isStandalone = (window.navigator as any).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
      if (isIos && !isStandalone) {
        const dismissed = sessionStorage.getItem('storebass_ios_guide_dismissed');
        if (!dismissed) {
          setShowIosInstallGuide(true);
        }
      }
    }
  }, []);

  // Cargar datos en tiempo real con Supabase + caché local
  const fetchTickets = async () => {
    setIsLoading(true);
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        setTickets(data);
        try {
          localStorage.setItem('storebass_cached_tickets', JSON.stringify(data));
        } catch {}
      } else if (!error && data && data.length === 0) {
        // Si Supabase devuelve 0 filas (ej. por políticas RLS pendientes de habilitar en el dashboard),
        // conservar los tickets de la sesión local para que el usuario nunca pierda la vista de sus pedidos.
        const cached = localStorage.getItem('storebass_cached_tickets');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTickets(parsed);
            }
          } catch {}
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Restaurar caché local de inmediato al entrar (Tickets y Tipo de Cambio)
    try {
      const cached = localStorage.getItem('storebass_cached_tickets');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTickets(parsed);
        }
      }
      const cachedRate = localStorage.getItem('storebass_exchange_rate');
      if (cachedRate) {
        const parsedRate = parseFloat(cachedRate);
        if (!isNaN(parsedRate) && parsedRate > 0) {
          setExchangeRate(parsedRate);
          setRateInput(parsedRate.toFixed(2));
        }
      }
    } catch {}

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Cargar productos del catálogo web
    supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name')
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCatalogProducts(data);
        }
      });

    // Cargar tipo de cambio desde Supabase
    supabase
      .from('trip_config')
      .select('exchange_rate')
      .eq('id', 1)
      .single()
      .then(({ data }) => {
        if (data?.exchange_rate) {
          const rate = Number(data.exchange_rate);
          const cachedRate = localStorage.getItem('storebass_exchange_rate');
          // Si no había valor en caché local previo, aplicar el de Supabase
          if (!cachedRate) {
            setExchangeRate(rate);
            setRateInput(rate.toFixed(2));
            try {
              localStorage.setItem('storebass_exchange_rate', rate.toFixed(2));
            } catch {}
          }
        }
      });

    fetchTickets();

    // Suscripción Realtime
    const channel = supabase
      .channel('mobile-store-sync')
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
              const rate = Number(data.exchange_rate);
              setExchangeRate(rate);
              setRateInput(rate.toFixed(2));
              try {
                localStorage.setItem('storebass_exchange_rate', rate.toFixed(2));
              } catch {}
            }
          });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Procesamiento de pedidos sin datos mock forzados (Desde Cero)
  const customerGroups = useMemo<MobileCustomerGroup[]>(() => {
    const realTickets = tickets.filter(
      (t) => Array.isArray(t.items) && t.items.length > 0
    );

    return realTickets.map((t) => {
      const rate = exchangeRate || 3.5;
      const items: MobileItem[] = (t.items || []).map((it: any, idx: number) => {
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
        ticketId: t.id,
        ticketCode: t.ticket_code || t.ticketId || 'TK-PEND',
        cliente: t.cliente || 'Cliente sin nombre',
        telefono: t.telefono || '',
        fecha: t.created_at ? new Date(t.created_at).toLocaleString('es-PE') : '',
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

  // Lista de categorías
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
        const matchCustomer = cust.cliente.toLowerCase().includes(q) || cust.telefono.includes(q);
        const filteredItems = cust.items.filter((it) => {
          const matchQ =
            matchCustomer ||
            it.name.toLowerCase().includes(q) ||
            (it.subtitle && it.subtitle.toLowerCase().includes(q)) ||
            (it.observation && it.observation.toLowerCase().includes(q)) ||
            (it.barcode && it.barcode.toLowerCase().includes(q));
          const matchCat = selectedCategory === 'Todas' || it.category === selectedCategory;
          return matchQ && matchCat;
        });
        if (filteredItems.length === 0) return null;
        return { ...cust, items: filteredItems };
      })
      .filter(Boolean) as MobileCustomerGroup[];
  }, [customerGroups, searchQuery, selectedCategory]);

  // KPIs de operaciones USA: Inversión (Costo USA) y Ganancia (Margen Adicional en precio de venta)
  const kpis = useMemo(() => {
    const clientsCount = new Set(customerGroups.map((c) => c.cliente)).size;
    const prodsCount = new Set(
      customerGroups.flatMap((c) => c.items.map((i) => i.name.toLowerCase().trim()))
    ).size;
    let units = 0;
    let cost = 0;
    let profit = 0;
    let salesUSD = 0;
    let salesPEN = 0;

    customerGroups.forEach((c) => {
      c.items.forEach((it) => {
        const qty = it.quantity || 1;
        const itemCost = (it.cost_usd || 0) * qty;
        const itemSale = (it.sale_usd || 0) * qty;
        const itemProfit = ((it.sale_usd || 0) - (it.cost_usd || 0)) * qty;

        units += qty;
        cost += itemCost;
        salesUSD += itemSale;
        profit += itemProfit;
        salesPEN += it.subtotal_pen || 0;
      });
    });

    const rate = exchangeRate || 3.5;
    const marginPct = cost > 0 ? (profit / cost) * 100 : 0;

    return {
      clientes: clientsCount,
      productos: prodsCount,
      unidades: units,
      inversion: cost,
      inversionPEN: cost * rate,
      ganancia: profit,
      gananciaPEN: profit * rate,
      ventaTotalUSD: salesUSD,
      ventaTotalPEN: salesPEN,
      margen: marginPct,
    };
  }, [customerGroups, exchangeRate]);

  // Vista agrupada por producto con métricas financieras
  const groupedProducts = useMemo(() => {
    const map: Record<string, any> = {};
    customerGroups.forEach((c) => {
      c.items.forEach((it) => {
        const k = it.name.trim();
        const qty = it.quantity || 1;
        const costUsd = Number(it.cost_usd) || 0;
        const saleUsd = Number(it.sale_usd) || 0;
        const profitUsd = (saleUsd - costUsd) * qty;

        if (!map[k]) {
          map[k] = {
            name: it.name,
            category: it.category,
            img: it.img,
            cost_usd: costUsd,
            sale_usd: saleUsd,
            totalUnits: 0,
            purchasedUnits: 0,
            totalCostUSD: 0,
            totalSaleUSD: 0,
            totalProfitUSD: 0,
            clients: [],
          };
        }
        map[k].totalUnits += qty;
        if (it.is_purchased) map[k].purchasedUnits += qty;
        map[k].totalCostUSD += costUsd * qty;
        map[k].totalSaleUSD += saleUsd * qty;
        map[k].totalProfitUSD += profitUsd;

        map[k].clients.push({
          cliente: c.cliente,
          ticketId: c.ticketId,
          itemId: it.id,
          quantity: qty,
          is_purchased: it.is_purchased,
          obs: it.observation || it.subtitle || '',
        });
      });
    });
    return Object.values(map);
  }, [customerGroups]);

  // Alternar "¿Comprado?" con vibración háptica
  const handleTogglePurchased = async (
    ticketId: string,
    itemId: string,
    currentStatus: boolean
  ) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(35);
    }

    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedItems = (target.items || []).map((it: any) => {
      if (it.id === itemId || it.title === itemId || it.name === itemId) {
        return { ...it, comprado: !currentStatus, is_purchased: !currentStatus };
      }
      return it;
    });

    // Actualización inmediata en estado y caché
    const updatedTickets = tickets.map((t) =>
      t.id === target.id ? { ...t, items: updatedItems } : t
    );
    setTickets(updatedTickets);
    try {
      localStorage.setItem('storebass_cached_tickets', JSON.stringify(updatedTickets));
    } catch {}

    try {
      await supabase
        .from('tickets')
        .update({ items: updatedItems, updated_at: new Date().toISOString() })
        .eq('id', target.id);

      showToast(
        !currentStatus ? '¡Comprado en USA!' : 'Marcado como Pendiente',
        `${target.ticket_code || target.cliente} actualizado`
      );
      fetchTickets();
    } catch {
      showToast('Error', 'No se pudo sincronizar el estado.');
    }
  };

  // 1. ELIMINAR CLIENTE / PEDIDO COMPLETO
  const handleDeleteCustomer = async (ticketId: string, clienteNombre: string) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de eliminar a "${clienteNombre}" y todos sus productos registrados? Esta acción no se puede deshacer.`
    );
    if (!confirmDelete) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedTickets = tickets.filter((t) => t.id !== ticketId);
    setTickets(updatedTickets);
    try {
      localStorage.setItem('storebass_cached_tickets', JSON.stringify(updatedTickets));
    } catch {}

    try {
      const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
      if (error) console.warn('Supabase delete error:', error);
      showToast('Cliente eliminado', `Se eliminó el pedido de ${clienteNombre}`);
      fetchTickets();
    } catch (e) {
      console.error(e);
      showToast('Error al eliminar', 'Verifica tu conexión a Supabase.');
    }
  };

  // 2. GUARDAR MODIFICACIÓN DE CLIENTE
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
      fetchTickets();
    } catch (e) {
      console.error(e);
      showToast('Error', 'No se pudo guardar la modificación del cliente.');
    }
  };

  // 3. GUARDAR MODIFICACIÓN DE PRODUCTO
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    const target = tickets.find((t) => t.id === editingProduct.ticketId);
    if (!target) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const rate = exchangeRate || 3.5;
    const penPrice = Number((editingProduct.item.sale_usd * rate).toFixed(2));
    const subtotalPen = penPrice * editingProduct.item.quantity;

    const updatedItem = {
      ...editingProduct.item,
      price_pen: penPrice,
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
      fetchTickets();
    } catch (e) {
      console.error(e);
      showToast('Error al modificar', 'Intenta nuevamente.');
    }
  };

  // 4. ELIMINAR UN PRODUCTO DE UN CLIENTE
  const handleDeleteProduct = async (ticketId: string, itemId: string, productName: string) => {
    const confirmDelete = window.confirm(`¿Deseas eliminar "${productName}" de este pedido?`);
    if (!confirmDelete) return;

    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedItems = (target.items || []).filter((it: any) => it.id !== itemId);

    if (updatedItems.length === 0) {
      // Si era el único producto, confirmamos si eliminar el ticket
      const deleteWhole = window.confirm(
        'Este era el único producto. ¿Deseas eliminar todo el pedido del cliente?'
      );
      if (deleteWhole) {
        await supabase.from('tickets').delete().eq('id', ticketId);
        showToast('Pedido eliminado', 'No quedaron productos');
        fetchTickets();
        return;
      }
    }

    const newTotal = updatedItems.reduce(
      (acc: number, it: any) => acc + (Number(it.subtotal_pen) || 0),
      0
    );

    try {
      await supabase
        .from('tickets')
        .update({
          items: updatedItems,
          total: newTotal,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      showToast('Producto eliminado', productName);
      if (editingProduct?.item.id === itemId) setEditingProduct(null);
      fetchTickets();
    } catch (e) {
      console.error(e);
      showToast('Error', 'No se pudo eliminar el producto.');
    }
  };

  // 5. LIMPIAR TODO PARA EMPEZAR DESDE CERO
  const handleClearAllTickets = async () => {
    const confirmClear = window.prompt(
      '⚠️ ATENCIÓN: Esta acción borrará TODOS los pedidos actuales para empezar de cero.\n\nEscribe "BORRAR" para confirmar:'
    );
    if (confirmClear !== 'BORRAR') {
      if (confirmClear !== null) showToast('Cancelado', 'La confirmación no coincidió');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    try {
      const { error } = await supabase.from('tickets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
      setTickets([]);
      showToast('Monitor Limpio', 'Se borraron todos los pedidos. Listo para empezar desde 0.');
    } catch (e) {
      console.error(e);
      showToast('Error al limpiar', 'Verifica permisos en Supabase.');
    }
  };

  // 6. CAPTURA Y COMPRESIÓN DE FOTO DESDE CÁMARA
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
          setOrderForm((prev) => ({ ...prev, img: compressedDataUrl }));
        } else if (editingProduct) {
          setEditingProduct((prev) =>
            prev ? { ...prev, item: { ...prev.item, img: compressedDataUrl } } : null
          );
        }
        showToast('Foto capturada', 'Imagen del producto cargada con éxito');
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 7. ESCÁNER DE CÓDIGO DE BARRAS EN TIEMPO REAL CON HTML5-QRCODE
  const handleBarcodeSuccess = (code: string) => {
    stopBarcodeScanner();
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([80, 40, 80]);
    }

    if (scannerTargetField === 'new') {
      setOrderForm((prev) => ({
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
    showToast('¡Código detectado!', code);
  };

  const handleScanFromPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScannerStatus('Analizando imagen del código de barras...');
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      const tempScanner = html5QrCodeRef.current || new Html5Qrcode('barcode-scanner-viewport');
      const decodedText = await tempScanner.scanFile(file, true);
      if (decodedText) {
        handleBarcodeSuccess(decodedText);
      }
    } catch (err) {
      console.warn('scanFile error:', err);
      setScannerStatus('No se detectó un código legible en la foto. Ingrésalo manualmente abajo.');
    } finally {
      e.target.value = '';
    }
  };

  const startBarcodeScanner = (target: 'new' | 'edit') => {
    setScannerTargetField(target);
    setManualBarcodeInput('');
    setIsBarcodeScannerOpen(true);
    setScannerStatus('Iniciando cámara trasera...');
  };

  const stopBarcodeScanner = async () => {
    if (isStoppingScannerRef.current) return;
    isStoppingScannerRef.current = true;

    const scanner = html5QrCodeRef.current;
    html5QrCodeRef.current = null;

    if (scanner) {
      try {
        const isScanning =
          typeof scanner.isScanning === 'boolean'
            ? scanner.isScanning
            : typeof scanner.getState === 'function'
            ? scanner.getState() === 2
            : false;

        if (isScanning) {
          await scanner.stop().catch(() => {});
        }
      } catch (err) {
        // Ignorar si ya estaba detenido
      }

      try {
        if (typeof document !== 'undefined' && document.getElementById('barcode-scanner-viewport')) {
          scanner.clear();
        }
      } catch (err) {
        // Ignorar si el viewport ya no está en el DOM
      }
    }

    if (scannerStreamRef.current) {
      try {
        scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      } catch {}
      scannerStreamRef.current = null;
    }

    setIsBarcodeScannerOpen(false);
    isStoppingScannerRef.current = false;
  };

  // Montar Html5Qrcode automáticamente al abrir el visor
  useEffect(() => {
    if (!isBarcodeScannerOpen) return;

    let isMounted = true;

    const timer = setTimeout(async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode('barcode-scanner-viewport');
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
            'No se pudo abrir la cámara. Asegúrate de conceder permisos de Cámara en la App o escribe el código manualmente abajo.'
          );
        }
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      const scanner = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      if (scanner && !isStoppingScannerRef.current) {
        try {
          const isScanning =
            typeof scanner.isScanning === 'boolean'
              ? scanner.isScanning
              : typeof scanner.getState === 'function'
              ? scanner.getState() === 2
              : false;

          if (isScanning) {
            scanner.stop().catch(() => {}).finally(() => {
              try {
                if (typeof document !== 'undefined' && document.getElementById('barcode-scanner-viewport')) {
                  scanner.clear();
                }
              } catch {}
            });
          }
        } catch {}
      }
    };
  }, [isBarcodeScannerOpen]);

  // 8. GUARDAR OBSERVACIÓN RÁPIDA DE CADA PRODUCTO
  const handleSaveObservation = async () => {
    if (!editingObs) return;
    const { ticketId, itemId, currentText } = editingObs;
    const target = tickets.find((t) => t.id === ticketId);
    if (!target) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const updatedItems = (target.items || []).map((it: any) => {
      if (it.id === itemId || it.title === itemId || it.name === itemId) {
        return {
          ...it,
          observacion: currentText.trim(),
          observation: currentText.trim(),
        };
      }
      return it;
    });

    const updatedTickets = tickets.map((t) =>
      t.id === ticketId ? { ...t, items: updatedItems } : t
    );
    setTickets(updatedTickets);
    try {
      localStorage.setItem('storebass_cached_tickets', JSON.stringify(updatedTickets));
    } catch {}

    try {
      const { error } = await supabase
        .from('tickets')
        .update({
          items: updatedItems,
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);

      if (error) console.warn('Supabase observation update warning:', error);
      showToast('Observación guardada', currentText.trim());
      setEditingObs(null);
      fetchTickets();
    } catch {
      showToast('Error', 'No se pudo guardar la observación.');
    }
  };

  // Selección de producto existente desde el catálogo de la web
  const handleSelectCatalogProduct = (prodId: string) => {
    const prod = catalogProducts.find((p) => p.id === prodId);
    if (!prod) return;

    setOrderForm((prev) => ({
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

  // 8. REGISTRAR NUEVO PEDIDO MANUAL O AGREGAR A CLIENTE EXISTENTE
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderForm.cliente.trim() || !orderForm.productName.trim()) {
      showToast('Campos requeridos', 'Ingresa cliente y producto');
      return;
    }

    setIsSubmittingOrder(true);
    const qty = parseInt(orderForm.quantity) || 1;
    const saleUsd = parseFloat(orderForm.saleUsd) || 0;
    const costUsd = parseFloat(orderForm.costUsd) || 0;
    const penPrice = Number((saleUsd * exchangeRate).toFixed(2));
    const subtotalPen = penPrice * qty;

    const newItem: MobileItem = {
      id: `it-${Date.now()}`,
      name: orderForm.productName.trim(),
      subtitle: orderForm.observation.trim(),
      category: orderForm.category || 'General',
      quantity: qty,
      cost_usd: costUsd,
      sale_usd: saleUsd,
      price_pen: penPrice,
      subtotal_pen: subtotalPen,
      is_purchased: false,
      observation: orderForm.observation.trim(),
      img: orderForm.img || '',
      barcode: orderForm.barcode || '',
    };

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        const clientClean = orderForm.cliente.trim();
        const existingTicket = tickets.find(
          (t) => t.cliente?.trim().toLowerCase() === clientClean.toLowerCase()
        );

        if (existingTicket) {
          const updatedItems = [...(existingTicket.items || []), newItem];
          const newTotal = updatedItems.reduce(
            (acc: number, it: any) =>
              acc +
              (Number(it.subtotal_pen) ||
                (Number(it.price_pen ?? it.price) || 0) * (Number(it.quantity) || 1)),
            0
          );

          // Actualizar inmediatamente en estado local y caché
          const updatedTickets = tickets.map((t) =>
            t.id === existingTicket.id
              ? { ...t, items: updatedItems, total: newTotal, updated_at: new Date().toISOString() }
              : t
          );
          setTickets(updatedTickets);
          try {
            localStorage.setItem('storebass_cached_tickets', JSON.stringify(updatedTickets));
          } catch {}

          const { error } = await supabase
            .from('tickets')
            .update({
              items: updatedItems,
              total: newTotal,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingTicket.id);

          if (error) console.warn('Supabase update status:', error);
          showToast('¡Producto Agregado!', `Se añadió al pedido de ${existingTicket.cliente}`);
        } else {
          const tempId = `tk-${Date.now()}`;
          const tempCode = `TK-${Math.floor(1000 + Math.random() * 9000)}`;
          let savedId = tempId;
          let savedCode = tempCode;

          const { data: rpcData, error } = await supabase.rpc('fn_create_ticket', {
            p_origen: 'WhatsApp',
            p_cliente: clientClean,
            p_telefono: orderForm.telefono.trim() || '+51 900 000 000',
            p_detalle: `${newItem.name} x${newItem.quantity} (${newItem.category})`,
            p_total: subtotalPen,
            p_estado: 'Pendiente',
            p_tipo: 'whatsapp_manual',
            p_items: [newItem],
          });

          if (!error && rpcData && rpcData.length > 0) {
            savedId = rpcData[0].id || tempId;
            savedCode = rpcData[0].ticket_code || tempCode;
          } else if (error) {
            console.warn('RPC falló, insertando directo en tickets:', error);
            const { data: insData } = await supabase.from('tickets').insert({
              ticket_code: tempCode,
              correlativo: Math.floor(2000 + Math.random() * 8000),
              cliente: clientClean,
              telefono: orderForm.telefono.trim() || '+51 900 000 000',
              detalle: `${newItem.name} x${newItem.quantity}`,
              origen: 'WhatsApp',
              estado: 'Pendiente',
              tipo: 'whatsapp_manual',
              items: [newItem],
              total: subtotalPen,
            }).select();

            if (insData && insData.length > 0) {
              savedId = insData[0].id;
              savedCode = insData[0].ticket_code;
            }
          }

          const newTicketRecord = {
            id: savedId,
            ticket_code: savedCode,
            cliente: clientClean,
            telefono: orderForm.telefono.trim() || '+51 900 000 000',
            detalle: `${newItem.name} x${newItem.quantity}`,
            origen: 'WhatsApp',
            estado: 'Pendiente',
            tipo: 'whatsapp_manual',
            items: [newItem],
            total: subtotalPen,
            created_at: new Date().toISOString(),
          };

          const updatedTickets = [newTicketRecord, ...tickets.filter((t) => t.id !== savedId)];
          setTickets(updatedTickets);
          try {
            localStorage.setItem('storebass_cached_tickets', JSON.stringify(updatedTickets));
          } catch {}

          showToast('¡Pedido Guardado!', `Registrado para ${clientClean}`);
        }

        await fetchTickets();
        setIsOrderModalOpen(false);
        setOrderForm({
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
      } catch (err) {
        console.error(err);
        showToast('Error', 'No se pudo guardar el pedido en la base de datos.');
      } finally {
        setIsSubmittingOrder(false);
      }
    }
  };

  // Guardar Tipo de Cambio con persistencia local inmediata y sincronización en Supabase
  const handleSaveRate = async (customVal?: number) => {
    const rawVal = customVal !== undefined ? customVal : parseFloat(rateInput);
    if (isNaN(rawVal) || rawVal <= 0) {
      showToast('Error', 'Ingresa un tipo de cambio válido mayor a 0');
      return;
    }
    const val = parseFloat(rawVal.toFixed(2));
    setExchangeRate(val);
    setRateInput(val.toFixed(2));
    setEditingRate(false);
    setIsRateModalOpen(false);

    try {
      localStorage.setItem('storebass_exchange_rate', val.toFixed(2));
    } catch {}

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([40]);
    }

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase
          .from('trip_config')
          .update({ exchange_rate: val, updated_at: new Date().toISOString() })
          .eq('id', 1);
      } catch (err) {
        console.warn('Error al actualizar trip_config:', err);
      }
    }
    showToast('Tipo de cambio guardado', `S/ ${val.toFixed(2)} por dólar`);
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
    <div className="min-h-screen bg-[#f0f4f8] text-slate-800 flex flex-col font-sans pb-28 select-none">
      {/* 1. GUÍA FLOTANTE PARA INSTALAR EN IPHONE (IOS) */}
      {showIosInstallGuide && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-[#07132b] text-white p-3.5 shadow-2xl border-b border-amber-500/30 flex items-center justify-between text-xs animate-in slide-in-from-top">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-amber-400 text-xl shrink-0">
              ios_share
            </span>
            <div>
              <div className="font-bold text-white">Instalar STOREBASS en tu iPhone</div>
              <div className="text-[11px] text-slate-300">
                Toca <strong>Compartir ⎋</strong> en Safari y elige <strong>«Añadir a pantalla de inicio»</strong>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sessionStorage.setItem('storebass_ios_guide_dismissed', 'true');
              setShowIosInstallGuide(false);
            }}
            className="p-1 text-slate-400 hover:text-white shrink-0 ml-2"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      )}

      {/* 2. PANEL LATERAL (DRAWER) CON LOGO OFICIAL LIMPIO */}
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
            <div className="w-12 h-12 rounded-2xl overflow-hidden relative border border-amber-500/30 shadow-lg shrink-0 bg-slate-900">
              <Image
                src="/Storebass-icon-only.png"
                alt="Store Bass"
                fill
                className="object-cover"
                sizes="48px"
              />
            </div>
            <div>
              <div className="font-black text-base tracking-tight leading-none text-white">
                STOREBASS
              </div>
              <div className="text-[10px] text-blue-300 mt-1 font-medium">
                Monitor & Compras USA
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

        {/* Opciones del Menú */}
        <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
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
            <span>Lista de Compras USA</span>
          </button>

          <button
            onClick={() => {
              setViewMode('monetizacion');
              setDrawerOpen(false);
            }}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold transition-colors ${
              viewMode === 'monetizacion'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-300 hover:text-white hover:bg-blue-900/40'
            }`}
          >
            <span className="material-symbols-outlined text-xl text-emerald-400">payments</span>
            <span>Monetización (Inversión y Ganancias)</span>
          </button>

          <button
            onClick={() => startBarcodeScanner('new')}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-900/40 transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-amber-400">qr_code_scanner</span>
            <span>Escanear Código de Barras</span>
          </button>


          <Link
            href="/admin"
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-900/40 transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-amber-400">tune</span>
            <span>Panel Web Administrador</span>
          </Link>
        </nav>

        {/* Pie del Drawer: Configuración de Tipo de Cambio */}
        <div className="p-4 border-t border-blue-900/60 bg-[#08132b]">
          <div className="flex items-center gap-1.5 text-xs text-blue-300 font-bold mb-2">
            <span className="material-symbols-outlined text-sm">settings</span>
            <span>Configuración</span>
          </div>
          <div className="text-[11px] text-slate-400 mb-1.5 font-medium">
            Tipo de cambio (USD → PEN)
          </div>
          <button
            onClick={() => {
              setRateInput(exchangeRate.toFixed(2));
              setIsRateModalOpen(true);
              setDrawerOpen(false);
            }}
            className="w-full flex items-center justify-between bg-blue-950/80 hover:bg-blue-900 border border-blue-800/80 px-3 py-2.5 rounded-xl cursor-pointer active:scale-98 transition-all"
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-lg">currency_exchange</span>
              <span className="text-sm font-black text-amber-400 font-mono">
                S/ {exchangeRate.toFixed(2)}
              </span>
            </div>
            <span className="text-[10px] font-bold text-blue-200 bg-blue-800/70 px-2.5 py-1 rounded-md flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">edit</span>
              Cambiar
            </span>
          </button>
        </div>
      </aside>

      {/* 3. HEADER SUPERIOR NATIVO MÓVIL */}
      <header className="sticky top-0 z-40 bg-[#0b1b3d] text-white px-4 py-3 shadow-md border-b border-blue-900 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 rounded-xl bg-blue-900/70 border border-blue-700/60 flex items-center justify-center text-white active:scale-95 transition-transform"
            aria-label="Abrir panel lateral"
          >
            <span className="material-symbols-outlined text-2xl">menu</span>
          </button>
          <div className="w-8 h-8 rounded-xl overflow-hidden relative border border-amber-500/40 shadow-xs shrink-0 bg-slate-900">
            <Image
              src="/Storebass-icon-only.png"
              alt="Store Bass"
              fill
              className="object-cover"
              sizes="32px"
            />
          </div>
          <div>
            <h1 className="text-base font-black tracking-tight flex items-center gap-1.5">
              STOREBASS
            </h1>
            <div className="text-[10px] text-blue-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>En vivo · Supabase</span>
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

      {/* 4. SUBHEADER CON FECHA Y TIPO DE CAMBIO INTERACTIVO */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <span className="material-symbols-outlined text-sm text-blue-600">schedule</span>
          <span>
            {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })},{' '}
            {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <button
          onClick={() => {
            setRateInput(exchangeRate.toFixed(2));
            setIsRateModalOpen(true);
          }}
          className="group flex items-center gap-1.5 font-bold text-slate-800 bg-amber-50 hover:bg-amber-100 active:scale-95 border border-amber-300/80 px-2.5 py-1 rounded-xl text-[11px] transition-all shadow-xs cursor-pointer"
          title="Toca para cambiar el tipo de cambio"
        >
          <span className="material-symbols-outlined text-sm text-amber-600 group-hover:rotate-45 transition-transform">
            currency_exchange
          </span>
          <span className="text-slate-500 font-medium">USD a PEN:</span>
          <span className="text-amber-800 font-black font-mono">S/ {exchangeRate.toFixed(2)}</span>
          <span className="material-symbols-outlined text-xs text-amber-500">edit</span>
        </button>
      </div>

      {/* 5. RESUMEN EJECUTIVO DE KPIS (AJUSTADO EN EXACTAMENTE 2 FILAS COMPACTAS) */}
      <div className="p-4 pb-2">
        <div className="grid grid-cols-2 gap-2.5">
          {/* Fila 1 - Col 1: Clientes */}
          <div className="bg-white border border-slate-200/90 p-3 rounded-2xl shadow-2xs flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">group</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Clientes</div>
              <div className="text-base font-black text-slate-900 leading-tight">
                {formatQty(kpis.clientes)}
              </div>
              <div className="text-[10px] text-purple-700 font-semibold truncate">
                {kpis.clientes === 1 ? '1 pedido activo' : `${kpis.clientes} pedidos activos`}
              </div>
            </div>
          </div>

          {/* Fila 1 - Col 2: Productos y Unidades */}
          <div className="bg-white border border-slate-200/90 p-3 rounded-2xl shadow-2xs flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">inventory_2</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Productos</div>
              <div className="text-base font-black text-slate-900 leading-tight">
                {formatQty(kpis.productos)}
              </div>
              <div className="text-[10px] text-blue-700 font-semibold truncate">
                {formatQty(kpis.unidades)} unidades total
              </div>
            </div>
          </div>

          {/* Fila 2 - Col 1: Inversión USA (Costo Neto de Compra) */}
          <div className="bg-white border border-amber-200/90 p-3 rounded-2xl shadow-2xs flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 border border-amber-100 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg">payments</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">Inversión USA</div>
              <div className="text-sm font-black text-slate-900 font-mono leading-tight truncate">
                ${formatUSD(kpis.inversion)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate">
                ≈ S/ {formatPEN(kpis.inversionPEN)}
              </div>
            </div>
          </div>

          {/* Fila 2 - Col 2: Ganancia Neta */}
          <div className="bg-emerald-50/70 border border-emerald-200/90 p-3 rounded-2xl shadow-2xs flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg font-bold">trending_up</span>
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1">
                <span>Ganancia</span>
                {kpis.inversion > 0 && (
                  <span className="text-[9px] px-1 py-0.2 bg-emerald-200 text-emerald-900 rounded font-black">
                    +{kpis.margen.toFixed(0)}%
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-emerald-700 font-mono leading-tight truncate">
                +${formatUSD(kpis.ganancia)}
              </div>
              <div className="text-[10px] text-emerald-600 font-mono truncate">
                +S/ {formatPEN(kpis.gananciaPEN)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. SELECTOR DE VISTAS (CLIENTES / PRODUCTOS / MONETIZACIÓN) */}
      <div className="px-4 py-1.5">
        <div className="grid grid-cols-3 p-1 bg-white border border-slate-200 rounded-2xl shadow-xs gap-1">
          <button
            onClick={() => setViewMode('cliente')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              viewMode === 'cliente'
                ? 'bg-[#0b1b3d] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">group</span>
            <span>Clientes</span>
          </button>

          <button
            onClick={() => setViewMode('producto')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              viewMode === 'producto'
                ? 'bg-[#0b1b3d] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="material-symbols-outlined text-base">inventory_2</span>
            <span>Productos</span>
          </button>

          <button
            onClick={() => setViewMode('monetizacion')}
            className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
              viewMode === 'monetizacion'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-xs'
                : 'text-emerald-700 hover:bg-emerald-50'
            }`}
          >
            <span className="material-symbols-outlined text-base text-emerald-300">account_balance_wallet</span>
            <span>Monetización</span>
          </button>
        </div>
      </div>

      {/* 7. BUSCADOR, CATEGORÍAS Y ACCIONES RÁPIDAS */}
      <div className="px-4 py-2 space-y-2">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por cliente, producto o código..."
            className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
          />
        </div>

        {/* Chips de categorías con scroll */}
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

      {/* 8. CONTENIDO PRINCIPAL: VISTA POR CLIENTE */}
      {viewMode === 'cliente' && (
        <div className="px-4 space-y-3 mt-1">
          {isLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-500">
              <span className="material-symbols-outlined text-3xl animate-spin text-blue-600 mb-2 block">
                sync
              </span>
              <p className="font-bold text-xs">Cargando tus pedidos desde Supabase...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            /* ESTADO LIMPIO: SIN PEDIDOS REGISTRADOS */
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-xs">
                <span className="material-symbols-outlined text-3xl font-bold">
                  receipt_long
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Sin pedidos registrados
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Aún no tienes pedidos registrados en el monitor. Agrega el primer pedido para comenzar.
                </p>
              </div>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
                <button
                  onClick={() => setIsOrderModalOpen(true)}
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-black text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base font-bold">add</span>
                  <span>Registrar Primer Pedido</span>
                </button>
              </div>
            </div>
          ) : (
            filteredCustomers.map((cust) => {
              const isExpanded = !!expandedClients[cust.ticketId];

              return (
                <div
                  key={cust.ticketId}
                  className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden"
                >
                  {/* Encabezado del Cliente con Acciones de Modificar y Eliminar */}
                  <div className="p-3.5 flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() =>
                          setExpandedClients((prev) => ({
                            ...prev,
                            [cust.ticketId]: !prev[cust.ticketId],
                          }))
                        }
                        className="flex items-center gap-2.5 cursor-pointer flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-sm shrink-0">
                          {cust.cliente.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-slate-900 text-sm leading-tight truncate">
                            {cust.cliente}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 block truncate">
                            {cust.ticketCode} {cust.telefono && `· ${cust.telefono}`}
                          </span>
                        </div>
                      </div>

                      {/* Botones de Modificar / Eliminar Cliente / WhatsApp */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {cust.telefono && (
                          <a
                            href={`https://wa.me/${cust.telefono.replace(/\D/g, '').length === 9 ? `51${cust.telefono.replace(/\D/g, '')}` : cust.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(
                              `Hola ${cust.cliente}, te escribo de STOREBASS para informarte sobre tu pedido ${cust.ticketCode}.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-8 h-8 rounded-lg text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center transition-colors"
                            title="Contactar por WhatsApp"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                              <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41 1.55 1.56 2.41 3.63 2.41 5.83 0 4.54-3.7 8.24-8.24 8.24-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24h-.18zm4.51 11.64c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.24-.75-.67-1.26-1.49-1.4-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.29.38-.44.13-.14.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.71 4.3 3.8 2.53 1.09 2.53.73 2.99.69.45-.04 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.12-.22-.19-.47-.32z"/>
                            </svg>
                          </a>
                        )}

                        <button
                          onClick={() =>
                            setEditingClient({
                              ticketId: cust.ticketId,
                              cliente: cust.cliente,
                              telefono: cust.telefono,
                            })
                          }
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center transition-colors"
                          title="Modificar datos del cliente"
                        >
                          <span className="material-symbols-outlined text-base">edit</span>
                        </button>

                        <button
                          onClick={() => handleDeleteCustomer(cust.ticketId, cust.cliente)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-colors"
                          title="Eliminar cliente y sus pedidos"
                        >
                          <span className="material-symbols-outlined text-base">delete</span>
                        </button>

                        <div className="bg-[#0b2447] text-white px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs ml-1">
                          <span className="text-emerald-300">S/ {formatPEN(cust.totalPEN)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Badges de Estado */}
                    <div
                      onClick={() =>
                        setExpandedClients((prev) => ({
                          ...prev,
                          [cust.ticketId]: !prev[cust.ticketId],
                        }))
                      }
                      className="flex flex-wrap items-center gap-1.5 text-[11px] cursor-pointer"
                    >
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

                    {/* Barra de Progreso de Compra */}
                    {cust.items.length > 0 && (
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-0.5">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.round((cust.purchasedCount / cust.items.length) * 100)}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Detalle Desplegado de Productos */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 bg-slate-50/70 p-3 space-y-2.5">
                      {cust.items.map((it) => (
                        <div
                          key={it.id}
                          className={`p-3 rounded-2xl border transition-all ${
                            it.is_purchased
                              ? 'bg-emerald-50/40 border-emerald-200'
                              : 'bg-white border-slate-200'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden shrink-0 relative">
                                {it.img ? (
                                  <Image
                                    src={it.img}
                                    alt={it.name}
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
                              <div className="min-w-0">
                                <div className="font-bold text-slate-900 text-xs truncate">
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
                                {it.barcode && (
                                  <div className="text-[9px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                                    <span className="material-symbols-outlined text-[10px]">
                                      qr_code
                                    </span>
                                    <span>{it.barcode}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Precios y Botón Editar Producto */}
                            <div className="text-right shrink-0">
                              <div className="text-xs font-black text-slate-900 font-mono">
                                S/ {formatPEN(it.subtotal_pen)}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Costo: ${formatUSD(it.cost_usd)}
                              </div>
                              <div className="flex items-center justify-end gap-1 mt-1">
                                <button
                                  onClick={() =>
                                    setEditingProduct({ ticketId: cust.ticketId, item: it })
                                  }
                                  className="p-1 text-slate-400 hover:text-blue-600 rounded"
                                  title="Editar producto"
                                >
                                  <span className="material-symbols-outlined text-sm">edit</span>
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteProduct(cust.ticketId, it.id, it.name)
                                  }
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded"
                                  title="Eliminar producto"
                                >
                                  <span className="material-symbols-outlined text-sm">delete</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Bloque Destacado de Observación de Cada Producto */}
                          <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-2">
                            <div className="flex items-start justify-between gap-2 bg-amber-50/70 border border-amber-200/80 rounded-xl p-2.5">
                              <div className="flex items-start gap-1.5 min-w-0">
                                <span className="material-symbols-outlined text-sm text-amber-600 shrink-0 mt-0.5">
                                  sticky_note_2
                                </span>
                                <div className="text-xs">
                                  <span className="font-bold text-amber-950">Observación: </span>
                                  <span className="text-slate-800 font-medium break-words">
                                    {it.observation || it.subtitle || 'Sin especificaciones (Toca para agregar)'}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  setEditingObs({
                                    ticketId: cust.ticketId,
                                    itemId: it.id,
                                    currentText: it.observation || it.subtitle || '',
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-blue-600 rounded shrink-0 bg-white border border-slate-200 shadow-2xs"
                                title="Editar observación"
                              >
                                <span className="material-symbols-outlined text-sm">edit_note</span>
                              </button>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                              {it.barcode ? (
                                <span className="text-[10px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-xs">qr_code</span>
                                  <span>{it.barcode}</span>
                                </span>
                              ) : <span />}

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
                        </div>
                      ))}

                      {/* Totales del Cliente */}
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>Inversión USA requerida:</span>
                          <strong className="text-slate-900 font-black font-mono">
                            $ {formatUSD(cust.totalCostUSD)}
                          </strong>
                        </div>
                        <div className="flex justify-between text-emerald-700 text-[11px]">
                          <span>Ganancia estimada (adicional):</span>
                          <strong className="font-mono">+$ {formatUSD(cust.totalProfitUSD)}</strong>
                        </div>
                        <div className="flex justify-between text-slate-900 font-black pt-1 border-t border-slate-100 text-xs">
                          <span>Total a cobrar en Perú:</span>
                          <span className="text-blue-700 font-mono">
                            S/ {formatPEN(cust.totalPEN)}
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

      {/* 9. CONTENIDO: VISTA POR PRODUCTO (COMPRAS EN TIENDAS USA) */}
      {viewMode === 'producto' && (
        <div className="px-4 space-y-3 mt-1">
          {groupedProducts.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs">
              No hay productos registrados para compras en USA.
            </div>
          ) : (
            groupedProducts.map((p, idx) => (
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
            ))
          )}
        </div>
      )}

      {/* 9.5 CONTENIDO PRINCIPAL: VISTA DE MONETIZACIÓN (INVERSIÓN Y GANANCIAS) */}
      {viewMode === 'monetizacion' && (
        <div className="px-4 space-y-4 mt-2 pb-24">
          {/* Hero Card Financiero de Lujo */}
          <div className="bg-gradient-to-br from-[#081736] via-[#0b2447] to-[#041226] text-white rounded-3xl p-5 shadow-xl border border-blue-900/80 relative overflow-hidden">
            {/* Resplandor decorativo */}
            <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Monitor Financiero USA
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  1 USD = S/ {exchangeRate.toFixed(2)}
                </span>
              </div>

              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Ganancia Neta Estimada (Margen Cobrado)
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
                    +S/ {formatPEN(kpis.gananciaPEN)}
                  </span>
                  <span className="text-sm font-black text-emerald-300/80 font-mono">
                    (+${formatUSD(kpis.ganancia)} USD)
                  </span>
                </div>
                {kpis.inversion > 0 && (
                  <div className="inline-flex items-center gap-1 mt-1 text-[11px] font-black text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800/80">
                    <span className="material-symbols-outlined text-xs">trending_up</span>
                    <span>Retorno sobre inversión (ROI): +{kpis.margen.toFixed(1)}%</span>
                  </div>
                )}
              </div>

              {/* Sub-métricas: Inversión vs Venta Total */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-blue-800/60">
                <div className="bg-blue-950/60 p-3 rounded-2xl border border-blue-800/40">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">
                    Inversión USA (Costo)
                  </span>
                  <div className="text-base font-black text-white font-mono mt-0.5">
                    ${formatUSD(kpis.inversion)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ≈ S/ {formatPEN(kpis.inversionPEN)}
                  </div>
                </div>

                <div className="bg-blue-950/60 p-3 rounded-2xl border border-blue-800/40">
                  <span className="text-[10px] font-bold text-blue-300 uppercase block">
                    Venta Total Cobrada
                  </span>
                  <div className="text-base font-black text-white font-mono mt-0.5">
                    S/ {formatPEN(kpis.ventaTotalPEN)}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    ≈ ${formatUSD(kpis.ventaTotalUSD)}
                  </div>
                </div>
              </div>

              {/* Barra de Distribución Visual */}
              {kpis.ventaTotalUSD > 0 && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>Distribución del Capital Cobrado:</span>
                    <span className="text-emerald-300">
                      {Math.round((kpis.ganancia / (kpis.ventaTotalUSD || 1)) * 100)}% Ganancia limpia
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden flex">
                    <div
                      className="bg-amber-500 h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(
                            0,
                            Math.round((kpis.inversion / (kpis.ventaTotalUSD || 1)) * 100)
                          )
                        )}%`,
                      }}
                      title="Costo Invertido en USA"
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500 flex-1"
                      title="Ganancia Neta"
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      Costo USA: ${formatUSD(kpis.inversion)}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Ganancia: +${formatUSD(kpis.ganancia)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Ajuste Rápido de Tipo de Cambio */}
          <div className="bg-white border border-slate-200 p-3 rounded-2xl flex items-center justify-between shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-600 text-lg">currency_exchange</span>
              <div>
                <div className="text-[11px] font-bold text-slate-900">Tipo de cambio aplicado</div>
                <div className="text-[10px] text-slate-500">1 USD = S/ {exchangeRate.toFixed(2)}</div>
              </div>
            </div>
            <button
              onClick={() => {
                setRateInput(exchangeRate.toFixed(2));
                setIsRateModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs active:scale-95 transition-all"
            >
              Cambiar
            </button>
          </div>

          {/* Desglose de Ganancia por Cliente */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-purple-600">group</span>
                <span>Ganancia por Cliente ({customerGroups.length})</span>
              </h3>
            </div>

            {customerGroups.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                Aún no hay pedidos registrados para calcular ganancias.
              </div>
            ) : (
              customerGroups.map((cust) => {
                const profitPen = cust.totalProfitUSD * exchangeRate;
                const clientMargin =
                  cust.totalCostUSD > 0
                    ? Math.round((cust.totalProfitUSD / cust.totalCostUSD) * 100)
                    : 0;

                return (
                  <div
                    key={cust.ticketId}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="font-black text-slate-900 text-xs truncate">
                          {cust.cliente}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {cust.ticketCode} · {cust.items.length} productos ({cust.totalUnits} und)
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-black text-emerald-600 font-mono">
                          +S/ {formatPEN(profitPen)}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold font-mono">
                          +${formatUSD(cust.totalProfitUSD)} (+{clientMargin}%)
                        </div>
                      </div>
                    </div>

                    {/* Resumen de costos vs ventas */}
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 grid grid-cols-2 gap-2 text-[11px]">
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">
                          Inversión en USA:
                        </span>
                        <span className="font-bold text-slate-800 font-mono">
                          ${formatUSD(cust.totalCostUSD)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block font-medium">
                          Venta Cobrada:
                        </span>
                        <span className="font-bold text-slate-800 font-mono">
                          S/ {formatPEN(cust.totalPEN)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Desglose de Rentabilidad por Producto */}
          <div className="space-y-2.5 pt-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-blue-600">inventory_2</span>
              <span>Rentabilidad por Producto ({groupedProducts.length})</span>
            </h3>

            {groupedProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                Sin productos para monetizar.
              </div>
            ) : (
              groupedProducts.map((p: any, idx: number) => {
                const prodProfit = p.totalProfitUSD || 0;
                const prodProfitPen = prodProfit * exchangeRate;
                const prodCost = p.totalCostUSD || 0;
                const prodMargin = prodCost > 0 ? Math.round((prodProfit / prodCost) * 100) : 0;

                return (
                  <div
                    key={idx}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden relative">
                        {p.img ? (
                          <Image src={p.img} alt={p.name} fill className="object-cover" sizes="40px" />
                        ) : (
                          <span className="material-symbols-outlined text-slate-400 text-base">
                            inventory_2
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-black text-xs text-slate-900 truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {p.totalUnits} und · Costo: ${formatUSD(p.cost_usd)}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-emerald-600 font-mono">
                        +${formatUSD(prodProfit)}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        ≈ +S/ {formatPEN(prodProfitPen)} (+{prodMargin}%)
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 10. BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex items-center justify-around shadow-lg">
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
          onClick={() => setViewMode('producto')}
          className={`flex flex-col items-center gap-1 p-1 ${
            viewMode === 'producto' ? 'text-blue-600 font-black' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-xl">inventory_2</span>
          <span className="text-[10px]">Productos</span>
        </button>

        <button
          onClick={() => setIsOrderModalOpen(true)}
          className="flex items-center justify-center -mt-6 w-12 h-12 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-600/40 border-4 border-white active:scale-95 transition-transform"
          aria-label="Registrar pedido"
        >
          <span className="material-symbols-outlined text-2xl font-bold">add</span>
        </button>

        <button
          onClick={() => setViewMode('monetizacion')}
          className={`flex flex-col items-center gap-1 p-1 ${
            viewMode === 'monetizacion' ? 'text-emerald-600 font-black' : 'text-slate-500'
          }`}
        >
          <span className="material-symbols-outlined text-xl text-emerald-600">payments</span>
          <span className="text-[10px]">Monetización</span>
        </button>

        <button
          onClick={() => startBarcodeScanner('new')}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-amber-600 p-1"
        >
          <span className="material-symbols-outlined text-xl text-amber-500">barcode_scanner</span>
          <span className="text-[10px] font-bold">Escanear</span>
        </button>
      </div>

      {/* 11. MODAL / BOTTOM SHEET: REGISTRAR NUEVO PEDIDO (CON FOTO Y CÓDIGO) */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/70 backdrop-blur-xs p-0 sm:p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg p-5 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
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

            <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
              {/* Botones de Captura Rápida: Foto Cámara, Galería y Escáner */}
              <div className="grid grid-cols-3 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                {/* Input invisible para foto con cámara */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={(e) => handlePhotoCapture(e, 'new')}
                  className="hidden"
                />
                {/* Input invisible para galería de fotos */}
                <input
                  type="file"
                  accept="image/*"
                  ref={galleryInputRef}
                  onChange={(e) => handlePhotoCapture(e, 'new')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 font-bold text-slate-800 flex flex-col items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-blue-600 text-lg">
                    photo_camera
                  </span>
                  <span className="text-[11px]">Tomar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-2.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-blue-400 font-bold text-slate-800 flex flex-col items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-slate-600 text-lg">
                    image
                  </span>
                  <span className="text-[11px]">Galería</span>
                </button>

                <button
                  type="button"
                  onClick={() => startBarcodeScanner('new')}
                  className="py-2.5 px-2 rounded-xl bg-white border border-slate-200 hover:border-amber-400 font-bold text-slate-800 flex flex-col items-center justify-center gap-1 shadow-2xs active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-amber-600 text-lg">
                    barcode_scanner
                  </span>
                  <span className="text-[11px]">Escanear</span>
                </button>
              </div>

              {/* Vista previa de foto si fue tomada */}
              {orderForm.img && (
                <div className="flex items-center gap-3 p-2 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="w-12 h-12 rounded-lg overflow-hidden relative shrink-0">
                    <Image
                      src={orderForm.img}
                      alt="Foto tomada"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="font-bold text-blue-900">Foto del producto capturada</div>
                    <div className="text-[10px] text-blue-600">Se guardará con el pedido</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderForm((p) => ({ ...p, img: '' }))}
                    className="p-1 text-slate-400 hover:text-rose-600"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                  </button>
                </div>
              )}

              {/* Código de barras si fue escaneado */}
              {orderForm.barcode && (
                <div className="flex items-center justify-between p-2 bg-amber-50 border border-amber-200 rounded-xl text-xs font-mono text-amber-900">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-sm">barcode</span>
                    <span>Código: {orderForm.barcode}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOrderForm((p) => ({ ...p, barcode: '' }))}
                    className="text-slate-400 hover:text-rose-600"
                  >
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>
              )}

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

              {/* Selector: ¿Catálogo de la Web o Producto Nuevo? */}
              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="block text-slate-700 font-bold">
                  Producto a Traer de USA *
                </label>
                <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setOrderForm((p) => ({ ...p, productSource: 'catalog' }))
                    }
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      orderForm.productSource === 'catalog'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">inventory_2</span>
                    <span>Del Catálogo Web</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setOrderForm((p) => ({
                        ...p,
                        productSource: 'custom',
                        selectedCatalogId: '',
                      }))
                    }
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                      orderForm.productSource === 'custom'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">add_circle</span>
                    <span>Producto Nuevo / Otro</span>
                  </button>
                </div>

                {/* Si elige catálogo web */}
                {orderForm.productSource === 'catalog' ? (
                  <div className="space-y-2">
                    <select
                      value={orderForm.selectedCatalogId}
                      onChange={(e) => handleSelectCatalogProduct(e.target.value)}
                      className="w-full px-3 py-2.5 bg-blue-50/60 border border-blue-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500 text-xs cursor-pointer"
                    >
                      <option value="">-- Toca aquí para elegir producto de la web --</option>
                      {catalogProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>

                    {orderForm.productName && (
                      <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs">
                        {orderForm.img && (
                          <div className="w-10 h-10 rounded-lg overflow-hidden relative shrink-0">
                            <Image
                              src={orderForm.img}
                              alt={orderForm.productName}
                              fill
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-slate-900 truncate">
                            {orderForm.productName}
                          </div>
                          <div className="text-[10px] text-emerald-700 font-semibold">
                            Categoría: {orderForm.category}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Si elige producto nuevo */
                  <div>
                    <input
                      type="text"
                      required
                      placeholder="Escribe el nombre del producto nuevo (ej. Stanley Quencher 40oz)"
                      value={orderForm.productName}
                      onChange={(e) =>
                        setOrderForm({ ...orderForm, productName: e.target.value })
                      }
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}
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
                    value={orderForm.quantity}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, quantity: e.target.value })
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
                    inputMode="decimal"
                    step="any"
                    placeholder="Ej. 50"
                    value={orderForm.costUsd}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, costUsd: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Precio Cobrado ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="any"
                    placeholder="Ej. 70"
                    value={orderForm.saleUsd}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) =>
                      setOrderForm({ ...orderForm, saleUsd: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block font-mono">
                    {orderForm.saleUsd
                      ? `= S/ ${(parseFloat(orderForm.saleUsd) * exchangeRate).toFixed(2)}`
                      : 'En Soles se calcula auto'}
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

      {/* 12. MODAL PARA MODIFICAR DATOS DEL CLIENTE */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-600 text-lg">person_edit</span>
                Modificar Cliente
              </h4>
              <button
                onClick={() => setEditingClient(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  value={editingClient.cliente}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, cliente: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-semibold"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={editingClient.telefono}
                  onChange={(e) =>
                    setEditingClient({ ...editingClient, telefono: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-3.5 py-2 rounded-xl bg-slate-100 font-bold text-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 13. MODAL PARA MODIFICAR PRODUCTO COMPLETO */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-blue-600 text-lg">edit_note</span>
                Modificar Producto
              </h4>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3 text-xs">
              {/* Opciones de Foto y Código de Barras */}
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={editFileInputRef}
                  onChange={(e) => handlePhotoCapture(e, 'edit')}
                  className="hidden"
                />
                <input
                  type="file"
                  accept="image/*"
                  ref={editGalleryInputRef}
                  onChange={(e) => handlePhotoCapture(e, 'edit')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex flex-col items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-blue-600 text-base">
                    photo_camera
                  </span>
                  <span className="text-[10px]">Cámara</span>
                </button>

                <button
                  type="button"
                  onClick={() => editGalleryInputRef.current?.click()}
                  className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex flex-col items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-slate-600 text-base">
                    image
                  </span>
                  <span className="text-[10px]">Galería</span>
                </button>

                <button
                  type="button"
                  onClick={() => startBarcodeScanner('edit')}
                  className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex flex-col items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-amber-600 text-base">
                    barcode_scanner
                  </span>
                  <span className="text-[10px]">Escanear</span>
                </button>
              </div>

              {editingProduct.item.img && (
                <div className="w-16 h-16 rounded-xl overflow-hidden relative border border-slate-200 mx-auto">
                  <Image
                    src={editingProduct.item.img}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-bold mb-1">Nombre del Producto *</label>
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

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Categoría</label>
                  <select
                    value={editingProduct.item.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        item: { ...editingProduct.item, category: e.target.value },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-blue-500"
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
                    inputMode="numeric"
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
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-black text-center focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Costo USA ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
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
                  <label className="block text-slate-700 font-bold mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    inputMode="decimal"
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
                <label className="block text-slate-700 font-bold mb-1">
                  Observación / Talla / Especificación
                </label>
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

              <div>
                <label className="block text-slate-700 font-bold mb-1">Código de Barras</label>
                <input
                  type="text"
                  value={editingProduct.item.barcode || ''}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      item: { ...editingProduct.item, barcode: e.target.value },
                    })
                  }
                  placeholder="Escanear o escribir..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() =>
                    handleDeleteProduct(
                      editingProduct.ticketId,
                      editingProduct.item.id,
                      editingProduct.item.name
                    )
                  }
                  className="text-rose-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  <span>Eliminar producto</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 font-bold text-slate-600"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs"
                  >
                    Guardar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 14. MODAL: AJUSTAR TIPO DE CAMBIO (USD → PEN) CON PRESETS RÁPIDOS */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-2xl">currency_exchange</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Tipo de Cambio</h3>
                  <p className="text-[11px] text-slate-500">1 USD a Soles (PEN)</p>
                </div>
              </div>
              <button
                onClick={() => setIsRateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-500 block mb-1">
                  Valor en Soles por cada $1.00 USD:
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    S/
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="10"
                    value={rateInput}
                    onChange={(e) => setRateInput(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border-2 border-amber-300 rounded-2xl text-xl font-black text-slate-900 font-mono text-center focus:bg-white focus:outline-none focus:border-amber-500 shadow-inner"
                    autoFocus
                  />
                </div>
              </div>

              {/* Botones de selección rápida (Chips) */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Valores rápidos comunes:
                </span>
                <div className="grid grid-cols-5 gap-1.5">
                  {['3.50', '3.60', '3.70', '3.75', '3.80'].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setRateInput(val)}
                      className={`py-1.5 rounded-xl text-xs font-black font-mono transition-all ${
                        rateInput === val
                          ? 'bg-amber-500 text-slate-950 shadow-xs scale-102 ring-2 ring-amber-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Previsualización en vivo */}
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-center justify-between text-xs">
                <span className="text-amber-900 font-medium text-[11px]">Ejemplo: $100.00 USD</span>
                <span className="text-amber-800 font-black font-mono text-sm">
                  = S/ {(100 * (parseFloat(rateInput) || exchangeRate)).toFixed(2)} PEN
                </span>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsRateModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveRate()}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs shadow-md shadow-amber-500/25 flex items-center justify-center gap-1.5"
              >
                <span className="material-symbols-outlined text-base font-bold">check</span>
                <span>Guardar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 15. VISOR DE ESCÁNER DE CÓDIGO DE BARRAS CON HTML5-QRCODE, FOTO Y ENTRADA MANUAL */}
      {isBarcodeScannerOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 flex flex-col justify-between p-4 backdrop-blur-md">
          {/* Input oculto para escanear código desde foto de la cámara/galería */}
          <input
            ref={barcodePhotoInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleScanFromPhoto}
          />

          <div className="flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-2xl">
                barcode_scanner
              </span>
              <span className="font-bold text-sm">Escáner de Código de Barras</span>
            </div>
            <button
              onClick={stopBarcodeScanner}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Viewport para Html5Qrcode */}
          <div className="relative flex-1 my-3 rounded-3xl overflow-hidden bg-black flex flex-col items-center justify-center border border-slate-800">
            <div
              id="barcode-scanner-viewport"
              className="w-full h-full min-h-[260px] flex items-center justify-center"
            />
          </div>

          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-xs text-slate-300 space-y-3 z-10 shadow-2xl">
            <p className="font-semibold text-center text-amber-300">{scannerStatus}</p>

            {/* Alternativa 1: Tomar foto o subir imagen del código */}
            <button
              type="button"
              onClick={() => barcodePhotoInputRef.current?.click()}
              className="w-full py-2.5 px-3 bg-amber-500/20 border border-amber-500/40 hover:bg-amber-500/30 text-amber-300 rounded-xl font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span className="material-symbols-outlined text-base">photo_camera</span>
              <span>Tomar foto o subir foto del código</span>
            </button>

            {/* Alternativa 2: Ingreso manual inmediato */}
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <label className="text-[11px] font-bold text-slate-400 block">
                O escribe el código de barras manualmente:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej. 195949112233"
                  value={manualBarcodeInput}
                  onChange={(e) => setManualBarcodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs font-mono focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (manualBarcodeInput.trim()) {
                      handleBarcodeSuccess(manualBarcodeInput.trim());
                      setManualBarcodeInput('');
                    }
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition-all"
                >
                  Listo
                </button>
              </div>
            </div>

            <button
              onClick={stopBarcodeScanner}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              Cerrar Cámara
            </button>
          </div>
        </div>
      )}

      {/* 15. MODAL PARA EDICIÓN RÁPIDA DE OBSERVACIÓN DE CUALQUIER PRODUCTO */}
      {editingObs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-amber-600 text-lg">sticky_note_2</span>
              Observación del Producto
            </h4>
            <p className="text-[11px] text-slate-500">
              Especificaciones para la compra en USA (color, talla, modelo, detalles).
            </p>
            <textarea
              rows={3}
              value={editingObs.currentText}
              onChange={(e) => setEditingObs({ ...editingObs, currentText: e.target.value })}
              placeholder="Ej. Color Rosa 40 oz, Talla M, Sellado de tienda USA..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex justify-end gap-2 text-xs pt-1">
              <button
                type="button"
                onClick={() => setEditingObs(null)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 font-bold text-slate-600"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveObservation}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold"
              >
                Guardar Observación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
