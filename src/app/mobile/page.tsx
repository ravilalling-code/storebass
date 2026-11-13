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

export default function MobileMonitorPage() {
  const { showToast } = useToast();

  // Estados principales
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'cliente' | 'producto'>('cliente');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [exchangeRate, setExchangeRate] = useState<number>(3.5);
  const [editingRate, setEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('3.50');
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

  // Estado del Formulario de Nuevo Pedido
  const [orderForm, setOrderForm] = useState({
    cliente: '',
    telefono: '',
    productName: '',
    category: 'Tecnología',
    quantity: 1,
    costUsd: 50,
    saleUsd: 70,
    observation: '',
    img: '',
    barcode: '',
  });

  // Escáner de Código de Barras
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [scannerTargetField, setScannerTargetField] = useState<'new' | 'edit'>('new');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerStreamRef = useRef<MediaStream | null>(null);
  const [scannerStatus, setScannerStatus] = useState('Iniciando cámara...');

  // Referencia para input de foto nativa
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const editFileInputRef = useRef<HTMLInputElement | null>(null);

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

  // Cargar datos en tiempo real con Supabase
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

      if (!error && data) {
        setTickets(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    // Cargar tipo de cambio
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
        const saleUsd = it.sale_usd ? Number(it.sale_usd) : Number((penPrice / rate).toFixed(2));
        const costUsd = it.cost_usd ? Number(it.cost_usd) : Number((saleUsd * 0.72).toFixed(2));
        const subtotalPen = it.subtotal_pen ? Number(it.subtotal_pen) : penPrice * qty;

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
      const totalCostUSD = items.reduce((acc, i) => acc + i.cost_usd * i.quantity, 0);
      const totalSaleUSD = items.reduce((acc, i) => acc + i.sale_usd * i.quantity, 0);
      const totalProfitUSD = totalSaleUSD - totalCostUSD;
      const totalPEN = items.reduce((acc, i) => acc + i.subtotal_pen, 0);

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

    try {
      const { error } = await supabase.from('tickets').delete().eq('id', ticketId);
      if (error) throw error;
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
  };

  // 7. ESCÁNER DE CÓDIGO DE BARRAS EN TIEMPO REAL
  const startBarcodeScanner = async (target: 'new' | 'edit') => {
    setScannerTargetField(target);
    setIsBarcodeScannerOpen(true);
    setScannerStatus('Iniciando cámara trasera...');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      scannerStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setScannerStatus('Apunta el código de barras al marco rojo');

        // Verificar soporte de BarcodeDetector
        if ('BarcodeDetector' in window) {
          const detector = new (window as any).BarcodeDetector({
            formats: ['ean_13', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
          });

          const scanInterval = setInterval(async () => {
            if (!videoRef.current || videoRef.current.readyState < 2) return;
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const code = barcodes[0].rawValue;
                clearInterval(scanInterval);
                stopBarcodeScanner();

                if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                  navigator.vibrate([80, 40, 80]);
                }

                if (target === 'new') {
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
              }
            } catch (err) {
              // detección continua
            }
          }, 250);
        } else {
          setScannerStatus('Cámara lista. Si no detecta automáticamente, puedes escribir el código abajo.');
        }
      }
    } catch (err) {
      console.error(err);
      setScannerStatus('No se pudo acceder a la cámara. Revisa los permisos en tu navegador.');
    }
  };

  const stopBarcodeScanner = () => {
    if (scannerStreamRef.current) {
      scannerStreamRef.current.getTracks().forEach((track) => track.stop());
      scannerStreamRef.current = null;
    }
    setIsBarcodeScannerOpen(false);
  };

  // 8. REGISTRAR NUEVO PEDIDO MANUAL
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
      img: orderForm.img || '',
      barcode: orderForm.barcode || '',
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
        showToast('¡Pedido Guardado!', `Registrado en Supabase para ${orderForm.cliente}`);
        fetchTickets();
      } catch (err) {
        console.error(err);
        showToast('Error', 'No se pudo guardar el pedido en la base de datos.');
      }
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
      img: '',
      barcode: '',
    });
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
            onClick={() => startBarcodeScanner('new')}
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-blue-900/40 transition-colors"
          >
            <span className="material-symbols-outlined text-xl text-amber-400">qr_code_scanner</span>
            <span>Escanear Código de Barras</span>
          </button>

          <button
            onClick={handleClearAllTickets}
            className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-300 hover:text-rose-200 hover:bg-rose-950/40 transition-colors"
          >
            <span className="material-symbols-outlined text-lg text-rose-400">delete_forever</span>
            <span>Limpiar todo (Empezar de 0)</span>
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

      {/* 4. SUBHEADER CON FECHA Y TIPO DE CAMBIO */}
      <div className="bg-white border-b border-slate-200/80 px-4 py-2.5 flex items-center justify-between text-xs text-slate-600 shadow-2xs">
        <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
          <span className="material-symbols-outlined text-sm">schedule</span>
          <span>
            {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })},{' '}
            {new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-1 font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg text-[11px]">
          <span className="text-slate-500 font-medium">USD a PEN:</span>
          <span className="text-blue-700 font-black">S/ {exchangeRate.toFixed(2)}</span>
        </div>
      </div>

      {/* 5. CAROUSEL HORIZONTAL DE TARJETAS KPIS */}
      <div className="p-4 pb-2">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory">
          <div className="snap-start shrink-0 w-36 bg-white border border-purple-100 p-3.5 rounded-2xl shadow-xs flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">group</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Clientes</div>
              <div className="text-xl font-black text-slate-900">{kpis.clientes}</div>
            </div>
          </div>

          <div className="snap-start shrink-0 w-36 bg-white border border-blue-100 p-3.5 rounded-2xl shadow-xs flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">inventory_2</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Productos</div>
              <div className="text-xl font-black text-slate-900">{kpis.productos}</div>
            </div>
          </div>

          <div className="snap-start shrink-0 w-40 bg-white border border-emerald-100 p-3.5 rounded-2xl shadow-xs flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">shopping_cart</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Unidades</div>
              <div className="text-xl font-black text-slate-900">{kpis.unidades} und</div>
            </div>
          </div>

          <div className="snap-start shrink-0 w-44 bg-white border border-amber-100 p-3.5 rounded-2xl shadow-xs flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-xl">payments</span>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">Inversión USA</div>
              <div className="text-lg font-black text-slate-900">$ {kpis.inversion.toFixed(2)}</div>
            </div>
          </div>

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

      {/* 6. SELECTOR DE VISTAS (PRODUCTO / CLIENTE) */}
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
            /* ESTADO LIMPIO: EMPEZAR DESDE 0 */
            <div className="bg-white border border-slate-200/90 rounded-3xl p-8 text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-600 shadow-xs">
                <span className="material-symbols-outlined text-3xl font-bold">
                  add_shopping_cart
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Monitor Limpio: Listo para empezar desde 0
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Aún no tienes pedidos registrados en la base de datos. Comienza agregando tu primer cliente o pedido.
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
                <button
                  onClick={() => startBarcodeScanner('new')}
                  className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base text-amber-600">
                    barcode_scanner
                  </span>
                  <span>Escanear Código de Barras</span>
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

                      {/* Botones de Modificar / Eliminar Cliente */}
                      <div className="flex items-center gap-1 shrink-0 ml-2">
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

                        <div className="bg-[#0b2447] text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-xs ml-1">
                          <span className="text-emerald-300">S/ {cust.totalPEN.toFixed(2)}</span>
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
                                S/ {it.subtotal_pen.toFixed(2)}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono">
                                Costo: ${it.cost_usd.toFixed(2)}
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

                          {/* Observación y Checkbox "¿Comprado?" */}
                          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                            <span className="text-[11px] text-slate-600 truncate max-w-[150px]">
                              {it.observation || it.subtitle || 'Sin especificaciones'}
                            </span>

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
                      <div className="p-3 bg-white border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                        <div className="flex justify-between text-slate-600 text-[11px]">
                          <span>Inversión USA requerida:</span>
                          <strong className="text-slate-900 font-black font-mono">
                            $ {cust.totalCostUSD.toFixed(2)}
                          </strong>
                        </div>
                        <div className="flex justify-between text-emerald-700 text-[11px]">
                          <span>Ganancia estimada:</span>
                          <strong className="font-mono">$ {cust.totalProfitUSD.toFixed(2)}</strong>
                        </div>
                        <div className="flex justify-between text-slate-900 font-black pt-1 border-t border-slate-100 text-xs">
                          <span>Total a cobrar en Perú:</span>
                          <span className="text-blue-700 font-mono">
                            S/ {cust.totalPEN.toFixed(2)}
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

      {/* 10. BOTTOM NAVIGATION BAR */}
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
              {/* Botones de Captura Rápida: Foto con Cámara y Escáner */}
              <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 border border-slate-200 rounded-2xl">
                {/* Input invisible para foto con cámara */}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={fileInputRef}
                  onChange={(e) => handlePhotoCapture(e, 'new')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-blue-400 font-bold text-slate-800 flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-blue-600 text-lg">
                    photo_camera
                  </span>
                  <span>Tomar Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => startBarcodeScanner('new')}
                  className="py-2.5 px-3 rounded-xl bg-white border border-slate-200 hover:border-amber-400 font-bold text-slate-800 flex items-center justify-center gap-1.5 shadow-xs active:scale-95 transition-all"
                >
                  <span className="material-symbols-outlined text-amber-600 text-lg">
                    barcode_scanner
                  </span>
                  <span>Escanear Código</span>
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

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Producto a Traer de USA *
                </label>
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
                    <option value="Relojes">Relojes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Cantidad</label>
                  <input
                    type="number"
                    inputMode="numeric"
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
                    inputMode="decimal"
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
                    inputMode="decimal"
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
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={editFileInputRef}
                  onChange={(e) => handlePhotoCapture(e, 'edit')}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => editFileInputRef.current?.click()}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-blue-600 text-base">
                    photo_camera
                  </span>
                  <span>Tomar Nueva Foto</span>
                </button>

                <button
                  type="button"
                  onClick={() => startBarcodeScanner('edit')}
                  className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-amber-600 text-base">
                    barcode_scanner
                  </span>
                  <span>Escanear Código</span>
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
                    step="0.1"
                    value={editingProduct.item.cost_usd}
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
                    step="0.1"
                    value={editingProduct.item.sale_usd}
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

      {/* 14. VISOR DE ESCÁNER DE CÓDIGO DE BARRAS EN PANTALLA COMPLETA */}
      {isBarcodeScannerOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col justify-between p-4">
          <div className="flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-amber-400 text-2xl">
                barcode_scanner
              </span>
              <span className="font-bold text-sm">Escáner de Código de Barras</span>
            </div>
            <button
              onClick={stopBarcodeScanner}
              className="w-10 h-10 rounded-full bg-white/20 text-white flex items-center justify-center"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Visor de Cámara con marco animado */}
          <div className="relative flex-1 my-4 rounded-3xl overflow-hidden bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Marco de enfoque rojo con animación láser */}
            <div className="relative w-64 h-48 border-2 border-amber-400 rounded-2xl shadow-2xl flex items-center justify-center pointer-events-none">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-rose-500 animate-pulse shadow-lg shadow-rose-500/50"></div>
              <span className="text-[10px] text-white/70 font-mono bg-black/60 px-2 py-1 rounded-lg">
                Centra el código de barras
              </span>
            </div>
          </div>

          <div className="bg-slate-900/90 text-center p-4 rounded-2xl text-xs text-slate-300 space-y-3 z-10">
            <p className="font-medium text-amber-300">{scannerStatus}</p>
            <button
              onClick={stopBarcodeScanner}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
            >
              Cerrar Cámara
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
