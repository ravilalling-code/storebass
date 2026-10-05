'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { INITIAL_PRODUCTS } from '@/data/initialCatalog';
import { useToast } from '@/context/CartContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const { showToast } = useToast();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [loginUser, setLoginUser] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');

  // Tab Navigation State
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'catalog' | 'categories' | 'shipping' | 'crm' | 'marketing' | 'settings'
  >('dashboard');

  // Catalog Products State
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    category: 'Perfumes',
    delivery: 'Llega el 29 de Octubre',
    regularPrice: 0,
    price: 0,
    img: '',
  });

  // Categories State
  const [categories, setCategories] = useState([
    { id: 1, name: 'Perfumes', icon: 'sanitizer', desc: 'Aromas y esencias de USA', active: true },
    { id: 2, name: 'Belleza', icon: 'spa', desc: 'Skincare, serums y cuidado personal', active: true },
    { id: 3, name: 'Tecnología', icon: 'devices', desc: 'Gadgets, smart home y audio', active: true },
    { id: 4, name: 'Apple', icon: 'phone_iphone', desc: 'iPhone, iPad, Mac y accesorios oficiales', active: true },
    { id: 5, name: 'Relojes', icon: 'watch', desc: 'Relojes de diseñador y automáticos', active: true },
    { id: 6, name: 'Moda', icon: 'apparel', desc: 'Prendas de marcas reconocidas', active: true },
    { id: 7, name: 'Zapatillas', icon: 'steps', desc: 'Calzado deportivo y urbano exclusivo', active: true },
    { id: 8, name: 'Suplementos', icon: 'medication', desc: 'Vitaminas y nutrición deportiva', active: true },
    { id: 9, name: 'Juguetes', icon: 'toys', desc: 'Coleccionables y figuras originales', active: true },
    { id: 10, name: 'Bolsos', icon: 'shopping_bag', desc: 'Carteras, mochilas y billeteras de lujo', active: true },
    { id: 11, name: 'Hogar', icon: 'water_bottle', desc: 'Termos Stanley y accesorios para el hogar', active: true },
  ]);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCatId, setEditingCatId] = useState<number | null>(null);
  const [catForm, setCatForm] = useState({
    name: '',
    icon: 'category',
    desc: '',
    active: true,
  });

  // Tickets / Orders State
  const [tickets, setTickets] = useState<any[]>([]);
  const [ticketFilter, setTicketFilter] = useState<'todos' | 'Web' | 'WhatsApp'>('todos');

  // Shipping Guides State
  const [shippingGuides, setShippingGuides] = useState([
    {
      id: 'SB-84920',
      awb: 'AWB 001-9283-4819',
      client: 'Carlos Mendoza',
      item: 'Apple MacBook Air M3 15"',
      status: 'En tránsito aéreo a Lima',
      date: '20 Oct - 29 Oct',
    },
    {
      id: 'SB-74190',
      awb: 'AWB 001-4432-1192',
      client: 'Mariana Silva',
      item: 'Sony WH-1000XM5 ANC Black',
      status: 'En reparto · Lima Metropolitana',
      date: 'Entrega hoy',
    },
    {
      id: 'SB-63219',
      awb: 'AWB 001-8891-2301',
      client: 'Diego Ramos',
      item: 'iPhone 16 Pro Max 256GB',
      status: 'Comprado en Miami Hub',
      date: '20 Oct',
    },
    {
      id: 'SB-55102',
      awb: 'AWB 001-7723-9081',
      client: 'Lucía Fernández',
      item: 'Dyson Supersonic Edición Especial',
      status: 'Entregado en Surco',
      date: 'Finalizado',
    },
  ]);

  // Trip Settings State
  const [tripSettings, setTripSettings] = useState({
    startDate: '2026-10-20',
    returnDate: '2026-10-29',
    phone: '+51 960 759 244',
    exchangeRate: '3.75',
    activeTripLabel: '20 Oct - 29 Oct',
  });

  // Marketing Banners State
  const [ads, setAds] = useState([
    {
      id: 1,
      badge: 'BLACK FRIDAY EARLY ACCESS',
      title: 'Descuentos de hasta 50% en Best Buy & Amazon',
      desc: 'Compro tus encargos de tecnología y gadgets al precio de oferta oficial de USA sin comisiones ocultas.',
      img: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=800&q=80',
      link: '#pedir-link',
      active: true,
    },
    {
      id: 2,
      badge: 'PERFUMERÍA EXCLUSIVA USA',
      title: 'Perfumes Árabes y Diseñador 100% Originales',
      desc: 'Lattafa, Dior Sauvage, Chanel y Tom Ford comprados en tiendas autorizadas con batch code comprobable.',
      img: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?auto=format&fit=crop&w=800&q=80',
      link: '#catalogo',
      active: true,
    },
  ]);

  // Load Initial Storage & Supabase Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthSession = sessionStorage.getItem('storebass_admin_auth');
      const isAuthLocal = localStorage.getItem('storebass_admin_auth');
      setIsAuthenticated(isAuthSession === 'true' || isAuthLocal === 'true');
      setAuthChecked(true);

      // Load products
      const savedProds = localStorage.getItem('storebass_products');
      if (savedProds) {
        try {
          setProducts(JSON.parse(savedProds));
        } catch (e) {
          console.error(e);
        }
      }

      // Load tickets
      const savedTickets = localStorage.getItem('storebass_tickets');
      if (savedTickets) {
        try {
          setTickets(JSON.parse(savedTickets));
        } catch (e) {
          console.error(e);
        }
      } else {
        const dummyTickets = [
          {
            ticketId: 'TK-1003',
            correlativo: 1003,
            origen: 'Web',
            fecha: '04/10/2026, 19:40',
            cliente: 'Carlos Mendoza',
            telefono: '987654321',
            detalle: 'iPhone 16 Pro Max 256GB Desert Titanium',
            total: 5490,
            estado: 'Cotizado',
          },
          {
            ticketId: 'TK-1002',
            correlativo: 1002,
            origen: 'WhatsApp',
            fecha: '04/10/2026, 18:15',
            cliente: 'Mariana Silva',
            telefono: '912345678',
            detalle: 'Perfume Lattafa Khamrah 100ml',
            total: 219,
            estado: 'Confirmado y pagado',
          },
          {
            ticketId: 'TK-1001',
            correlativo: 1001,
            origen: 'Web',
            fecha: '04/10/2026, 17:05',
            cliente: 'Diego Ramos',
            telefono: '945678123',
            detalle: 'Sony WH-1000XM5 Audífonos Bluetooth',
            total: 1389,
            estado: 'Comprado en USA',
          },
        ];
        setTickets(dummyTickets);
        localStorage.setItem('storebass_tickets', JSON.stringify(dummyTickets));
      }

      // Try reading tickets from Supabase Cloud if available
      const supabase = getSupabaseBrowserClient();
      supabase
        .from('tickets')
        .select('*')
        .order('id', { ascending: false })
        .limit(50)
        .then(({ data, error }) => {
          if (!error && data && data.length > 0) {
            setTickets(data);
            localStorage.setItem('storebass_tickets', JSON.stringify(data));
          }
        });
    }
  }, []);

  // Handle Login Form
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const u = loginUser.trim().toLowerCase();
    const p = loginPassword.trim();
    if (u === 'admin' && p === 'adminpj2026') {
      sessionStorage.setItem('storebass_admin_auth', 'true');
      localStorage.setItem('storebass_admin_auth', 'true');
      setIsAuthenticated(true);
      showToast('Bienvenido', 'Acceso al panel administrativo concedido');
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
      showToast('Acceso denegado', 'Credenciales no válidas');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('storebass_admin_auth');
    localStorage.removeItem('storebass_admin_auth');
    setIsAuthenticated(false);
    showToast('Sesión cerrada', 'Has salido del panel de administración');
  };

  // Product CRUD
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || prodForm.price <= 0) {
      showToast('Campos incompletos', 'Ingresa nombre y precio válido');
      return;
    }

    let updated: any[];
    if (editingProductId) {
      updated = products.map((p) =>
        p.id === editingProductId ? { ...p, ...prodForm } : p
      );
      showToast('Producto actualizado', prodForm.name);
    } else {
      const newP = {
        id: Date.now(),
        ...prodForm,
      };
      updated = [newP, ...products];
      showToast('Nuevo producto guardado', prodForm.name);
    }
    setProducts(updated);
    localStorage.setItem('storebass_products', JSON.stringify(updated));
    setProductModalOpen(false);
    setEditingProductId(null);
  };

  const handleDeleteProduct = (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem('storebass_products', JSON.stringify(updated));
    showToast('Producto eliminado');
  };

  const handleEditProduct = (p: any) => {
    setEditingProductId(p.id);
    setProdForm({
      name: p.name,
      category: p.category,
      delivery: p.delivery,
      regularPrice: p.regularPrice || p.price * 1.15,
      price: p.price,
      img: p.img,
    });
    setProductModalOpen(true);
  };

  // Category CRUD
  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;
    let updated: any[];
    if (editingCatId) {
      updated = categories.map((c) =>
        c.id === editingCatId ? { ...c, ...catForm } : c
      );
      showToast('Categoría modificada', catForm.name);
    } else {
      const newC = { id: Date.now(), ...catForm };
      updated = [...categories, newC];
      showToast('Nueva categoría creada', catForm.name);
    }
    setCategories(updated);
    localStorage.setItem('storebass_categories', JSON.stringify(updated));
    setCatModalOpen(false);
    setEditingCatId(null);
  };

  // Ticket Status update
  const handleUpdateTicketStatus = (ticketId: string, newStatus: string) => {
    const updated = tickets.map((t) =>
      t.ticketId === ticketId ? { ...t, estado: newStatus } : t
    );
    setTickets(updated);
    localStorage.setItem('storebass_tickets', JSON.stringify(updated));

    // Try updating Supabase Cloud
    const supabase = getSupabaseBrowserClient();
    supabase
      .from('tickets')
      .update({ estado: newStatus })
      .eq('ticket_id', ticketId)
      .then();

    showToast(`Ticket #${ticketId} actualizado`, `Nuevo estado: ${newStatus}`);
  };

  // 1. Login Screen Overlay if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
        <div className="absolute -top-12 -left-12 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-7">
            <div className="inline-flex items-center justify-center p-1 rounded-2xl bg-slate-800 border border-slate-700/80 mb-3 shadow-xl">
              <div className="w-16 h-16 rounded-xl overflow-hidden relative">
                <Image src="/Storebass.jpg" alt="Logo" fill className="object-cover" sizes="64px" />
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white font-display">
              STORE <span className="text-amber-500">BASS</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">Acceso Administrativo Restringido</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-red-400 flex-shrink-0">error</span>
                <span>{loginError}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Usuario
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                  person
                </span>
                <input
                  type="text"
                  value={loginUser}
                  onChange={(e) => {
                    setLoginUser(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Usuario"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                  lock
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => {
                    setLoginPassword(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  placeholder="Contraseña"
                  className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl pl-10 pr-10 py-3 text-sm focus:outline-none focus:border-amber-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <span className="material-symbols-outlined text-lg">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-xl">login</span>
              <span>Iniciar Sesión</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-800/80 text-center">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span>Volver a la tienda pública</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Full Admin Dashboard
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Desktop */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between flex-shrink-0 hidden md:flex">
        <div>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden relative border border-amber-500/40">
              <Image src="/Storebass.jpg" alt="Logo" fill className="object-cover" sizes="40px" />
            </div>
            <div>
              <div className="text-base font-black text-white leading-tight font-display">
                STORE <span className="text-amber-500">BASS</span>
              </div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Gestión Central</div>
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-850/50 border-b border-slate-800/60 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-xs border border-amber-500/30">
              JT
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-bold text-white truncate">Johan Tovar</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Administrador
              </p>
            </div>
          </div>

          <nav className="p-4 space-y-1.5">
            {[
              { id: 'dashboard', label: 'Dashboard & Métricas', icon: 'dashboard' },
              {
                id: 'catalog',
                label: 'Catálogo & Precios',
                icon: 'inventory_2',
                badge: products.length,
              },
              {
                id: 'categories',
                label: 'Categorías',
                icon: 'category',
                badge: categories.filter((c) => c.active).length,
              },
              {
                id: 'shipping',
                label: 'Monitoreo de Envíos',
                icon: 'flight_takeoff',
                badge: shippingGuides.length,
              },
              {
                id: 'crm',
                label: 'Tickets & Pedidos',
                icon: 'confirmation_number',
                badge: tickets.length,
              },
              { id: 'marketing', label: 'Publicidad & Banners', icon: 'campaign' },
              { id: 'settings', label: 'Ajustes & Viajes', icon: 'tune' },
            ].map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setCurrentTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                  <div className="flex-1 text-left">{tab.label}</div>
                  {tab.badge !== undefined && (
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <Link
            href="/"
            target="_blank"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-base text-amber-400">open_in_new</span>
            <span>Ver Tienda Pública</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition-colors"
          >
            <span className="material-symbols-outlined text-base">logout</span>
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-950 overflow-y-auto">
        {/* Topbar */}
        <header className="h-16 sm:h-20 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <span className="font-extrabold text-white text-sm">
                STORE <span className="text-amber-500">BASS</span>
              </span>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-base sm:text-lg font-bold text-white capitalize">
                {currentTab === 'dashboard'
                  ? 'Dashboard General & Métricas'
                  : currentTab === 'catalog'
                  ? 'Gestión de Catálogo & Precios'
                  : currentTab === 'categories'
                  ? 'Gestión de Categorías'
                  : currentTab === 'shipping'
                  ? 'Monitoreo de Envíos Courier'
                  : currentTab === 'crm'
                  ? 'Control de Tickets & Pedidos Correlativos'
                  : currentTab === 'marketing'
                  ? 'Publicidad, Banners & Campañas'
                  : 'Ajustes & Gestión de Viajes'}
              </h2>
              <p className="text-xs text-slate-400">
                Administración oficial StoreBass · Johan Tovar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400">USD/PEN:</span>
              <span className="font-black text-emerald-400">S/ {tripSettings.exchangeRate}</span>
              <span className="text-[10px] text-slate-500">SUNAT</span>
            </div>

            <Link
              href="/"
              className="bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm">storefront</span>
              <span className="hidden sm:inline">Ir a la Tienda</span>
            </Link>

            <button
              onClick={handleLogout}
              className="md:hidden p-2 text-rose-400 hover:bg-slate-800 rounded-xl"
              title="Salir"
            >
              <span className="material-symbols-outlined text-lg">logout</span>
            </button>
          </div>
        </header>

        {/* Tab Views */}
        <div className="p-4 sm:p-8 space-y-6 flex-1">
          {/* TAB 1: DASHBOARD */}
          {currentTab === 'dashboard' && (
            <div className="space-y-8">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Ventas del Mes
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <span className="material-symbols-outlined">payments</span>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">S/ 48,920.00</div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-2">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>+18.4% vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Paquetes en Tránsito
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                      <span className="material-symbols-outlined">flight_takeoff</span>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {shippingGuides.length} Guías
                  </div>
                  <div className="text-xs text-blue-300 font-bold mt-2 flex items-center gap-1">
                    <span>✈️ Miami Hub ➔ Lima Callao</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Tickets / Pedidos
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
                      <span className="material-symbols-outlined">confirmation_number</span>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">{tickets.length} Tickets</div>
                  <div className="text-xs text-purple-300 font-bold mt-2 flex items-center gap-1">
                    <span>
                      {tickets.filter((t) => t.estado === 'Pendiente').length} pendientes
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Stock Inmediato Lima
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                      <span className="material-symbols-outlined">local_shipping</span>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">84 Unidades</div>
                  <div className="text-xs text-emerald-300 font-bold mt-2 flex items-center gap-1">
                    <span>⚡ Despacho 24-48 horas</span>
                  </div>
                </div>
              </div>

              {/* Recent activity & flights */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-base font-bold text-white">
                        Últimos Tickets & Pedidos en Vivo
                      </h3>
                      <p className="text-xs text-slate-400">
                        Generados desde la Web y WhatsApp con numeración correlativa
                      </p>
                    </div>
                    <button
                      onClick={() => setCurrentTab('crm')}
                      className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <span>Ver todos</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {tickets.slice(0, 5).map((t, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-xs font-bold flex-shrink-0 font-mono">
                            #{t.correlativo || t.ticketId?.replace('TK-', '') || idx + 1001}
                          </div>
                          <div className="overflow-hidden">
                            <div className="text-xs font-bold text-white truncate">
                              {t.cliente} · {t.telefono}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {t.detalle}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              t.origen === 'Web'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            #{t.ticketId}
                          </span>
                          <span className="text-xs font-bold text-white">
                            S/ {parseFloat(t.total || 0).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400">airlines</span>
                    <span>Itinerario Hub Miami (MIA)</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">Vuelo Latam Cargo MIA-LIM</span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">
                        En Vuelo
                      </span>
                    </div>
                    <div className="text-xs text-slate-400">
                      Guía Máster: 045-8921820 · 142 kg consolidados
                    </div>
                    <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-emerald-400 h-full w-3/4"></div>
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentTab('shipping')}
                    className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 rounded-xl transition-colors"
                  >
                    Administrar todas las guías
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CATALOG */}
          {currentTab === 'catalog' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Catálogo de Productos & Precios en Soles
                  </h3>
                  <p className="text-xs text-slate-400">
                    Añade o edita precios, descuentos y disponibilidad de stock
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Buscar producto..."
                    className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 w-full sm:w-60"
                  />
                  <button
                    onClick={() => {
                      setEditingProductId(null);
                      setProdForm({
                        name: '',
                        category: 'Perfumes',
                        delivery: 'Llega el 29 de Octubre',
                        regularPrice: 0,
                        price: 0,
                        img: '',
                      });
                      setProductModalOpen(true);
                    }}
                    className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 whitespace-nowrap shadow-md shadow-amber-500/20"
                  >
                    <span className="material-symbols-outlined text-sm font-bold">add</span>
                    <span>Nuevo Producto</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs text-slate-300">
                    <thead className="bg-slate-850 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="p-4">Producto</th>
                        <th className="p-4">Categoría</th>
                        <th className="p-4">Precio Lista</th>
                        <th className="p-4">Precio Oferta (S/)</th>
                        <th className="p-4">Disponibilidad</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {products
                        .filter(
                          (p) =>
                            p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                            p.category.toLowerCase().includes(catalogSearch.toLowerCase())
                        )
                        .map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-11 rounded-xl overflow-hidden relative border border-slate-700 bg-slate-800 flex-shrink-0">
                                  <Image
                                    src={p.img}
                                    alt={p.name}
                                    fill
                                    className="object-cover"
                                    sizes="44px"
                                  />
                                </div>
                                <span className="font-bold text-white max-w-xs truncate">
                                  {p.name}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[11px] font-bold text-slate-300">
                                {p.category}
                              </span>
                            </td>
                            <td className="p-4 text-slate-400 line-through">
                              S/ {parseFloat(String(p.regularPrice || p.price * 1.15)).toFixed(2)}
                            </td>
                            <td className="p-4 font-black text-amber-400 text-sm">
                              S/ {parseFloat(String(p.price)).toFixed(2)}
                            </td>
                            <td className="p-4">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                  p.delivery.includes('Lima')
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                }`}
                              >
                                {p.delivery}
                              </span>
                            </td>
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditProduct(p)}
                                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                                  title="Editar"
                                >
                                  <span className="material-symbols-outlined text-base">edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(Number(p.id))}
                                  className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400"
                                  title="Eliminar"
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
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {currentTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">category</span>
                    <span>Gestión de Categorías del Catálogo</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Crea y modifica las categorías que alimentan los filtros de la tienda
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingCatId(null);
                    setCatForm({ name: '', icon: 'category', desc: '', active: true });
                    setCatModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
                >
                  <span className="material-symbols-outlined text-sm">add</span>
                  <span>+ Nueva Categoría</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-xs text-slate-300">
                    <thead className="bg-slate-850 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="p-4">Categoría</th>
                        <th className="p-4">Ícono</th>
                        <th className="p-4">Descripción</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {categories.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4 font-bold text-white">{c.name}</td>
                          <td className="p-4">
                            <span className="material-symbols-outlined text-amber-400 text-base">
                              {c.icon}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{c.desc}</td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                c.active
                                  ? 'bg-emerald-500/15 text-emerald-400'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {c.active ? 'Activa' : 'Inactiva'}
                            </span>
                          </td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => {
                                setEditingCatId(c.id);
                                setCatForm({
                                  name: c.name,
                                  icon: c.icon,
                                  desc: c.desc,
                                  active: c.active,
                                });
                                setCatModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHIPPING */}
          {currentTab === 'shipping' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Monitoreo de Envíos Internacionales & Locales
                  </h3>
                  <p className="text-xs text-slate-400">
                    Actualiza el estado de las guías en tiempo real
                  </p>
                </div>
                <span className="px-3 py-1 rounded-xl bg-blue-500/15 text-blue-400 text-xs font-bold border border-blue-500/30">
                  {shippingGuides.length} Guías Activas
                </span>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs text-slate-300">
                    <thead className="bg-slate-850 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="p-4">Guía / Código</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Artículo</th>
                        <th className="p-4">Estado Logístico</th>
                        <th className="p-4">Itinerario</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {shippingGuides.map((g) => (
                        <tr key={g.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <span className="font-mono font-bold text-amber-400 bg-slate-800 px-2 py-1 rounded-lg">
                              #{g.id}
                            </span>
                            <div className="text-[10px] text-slate-500 mt-1">{g.awb}</div>
                          </td>
                          <td className="p-4 font-bold text-white">{g.client}</td>
                          <td className="p-4 text-slate-300">{g.item}</td>
                          <td className="p-4">
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 font-bold text-[11px] border border-blue-500/30">
                              {g.status}
                            </span>
                          </td>
                          <td className="p-4 text-slate-400">{g.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: CRM / TICKETS */}
          {currentTab === 'crm' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Control de Tickets & Pedidos Correlativos
                  </h3>
                  <p className="text-xs text-slate-400">
                    Numeración consecutiva sincronizada entre la Tienda Web y WhatsApp
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {(['todos', 'Web', 'WhatsApp'] as const).map((orig) => (
                    <button
                      key={orig}
                      onClick={() => setTicketFilter(orig)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        ticketFilter === orig
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                    >
                      {orig === 'todos' ? 'Todos' : orig} (
                      {orig === 'todos'
                        ? tickets.length
                        : tickets.filter((t) => t.origen === orig).length}
                      )
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] text-left text-xs text-slate-300">
                    <thead className="bg-slate-850 border-b border-slate-800 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                      <tr>
                        <th className="p-4">Ticket</th>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Detalle / Links</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {tickets
                        .filter((t) => ticketFilter === 'todos' || t.origen === ticketFilter)
                        .map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-black text-amber-400 text-xs bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                                  #{t.ticketId}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    t.origen === 'Web'
                                      ? 'bg-blue-500/15 text-blue-400'
                                      : 'bg-emerald-500/15 text-emerald-400'
                                  }`}
                                >
                                  {t.origen === 'Web' ? '🌐 Web' : '💬 WA'}
                                </span>
                              </div>
                            </td>
                            <td className="p-4 text-slate-400 text-[11px]">{t.fecha}</td>
                            <td className="p-4">
                              <div className="font-bold text-white text-xs">{t.cliente}</div>
                              <div className="text-[11px] text-amber-400 font-mono">
                                {t.telefono}
                              </div>
                            </td>
                            <td className="p-4 text-xs max-w-xs text-slate-300 truncate">
                              {t.detalle}
                            </td>
                            <td className="p-4 font-black text-slate-100 text-xs">
                              S/ {parseFloat(t.total || 0).toFixed(2)}
                            </td>
                            <td className="p-4">
                              <select
                                value={t.estado || 'Pendiente'}
                                onChange={(e) =>
                                  handleUpdateTicketStatus(t.ticketId, e.target.value)
                                }
                                className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:border-amber-500"
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Cotizado">Cotizado</option>
                                <option value="Confirmado y pagado">Confirmado y pagado</option>
                                <option value="Comprado en USA">Comprado en USA</option>
                                <option value="En camino a Perú">En camino a Perú</option>
                                <option value="Listo para entrega">Listo para entrega</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <a
                                href={`https://wa.me/${(t.telefono || '').replace(
                                  /[^0-9]/g,
                                  ''
                                )}?text=${encodeURIComponent(
                                  `Hola ${t.cliente}, te escribe Johan Tovar de STORE BASS respecto a tu ticket consecutivo #${t.ticketId}`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md"
                              >
                                <span className="material-symbols-outlined text-sm">chat</span>
                                <span>WhatsApp</span>
                              </a>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: MARKETING */}
          {currentTab === 'marketing' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Publicidad, Banners & Campañas Activas
                  </h3>
                  <p className="text-xs text-slate-400">
                    Banners dinámicos sincronizados con la página principal
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ads.map((ad) => (
                  <div
                    key={ad.id}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden flex flex-col justify-between"
                  >
                    <div>
                      <div className="w-full h-40 rounded-2xl overflow-hidden relative mb-4">
                        <Image
                          src={ad.img}
                          alt={ad.title}
                          fill
                          className="object-cover"
                          sizes="400px"
                        />
                        <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">
                          {ad.badge}
                        </span>
                      </div>
                      <h4 className="text-base font-extrabold text-white mb-2">{ad.title}</h4>
                      <p className="text-xs text-slate-400 mb-4">{ad.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
                      <span>Destino: {ad.link}</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        Activo en Web
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SETTINGS */}
          {currentTab === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">tune</span>
                  <span>Configuración General de la Tienda & Próximo Viaje</span>
                </h3>

                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Fecha de Salida a USA
                    </label>
                    <input
                      type="date"
                      value={tripSettings.startDate}
                      onChange={(e) =>
                        setTripSettings({ ...tripSettings, startDate: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Fecha de Regreso a Lima (Llegada de Pedidos)
                    </label>
                    <input
                      type="date"
                      value={tripSettings.returnDate}
                      onChange={(e) =>
                        setTripSettings({ ...tripSettings, returnDate: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      WhatsApp Oficial de Atención
                    </label>
                    <input
                      type="text"
                      value={tripSettings.phone}
                      onChange={(e) =>
                        setTripSettings({ ...tripSettings, phone: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 mb-1">
                      Tipo de Cambio Referencial USD / PEN
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tripSettings.exchangeRate}
                      onChange={(e) =>
                        setTripSettings({ ...tripSettings, exchangeRate: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    onClick={() =>
                      showToast('Ajustes guardados con éxito', 'Configuración del viaje actualizada')
                    }
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs transition-colors shadow-md mt-4"
                  >
                    Guardar Configuración
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Product Modal */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">inventory_2</span>
                <span>{editingProductId ? 'Editar Producto' : 'Añadir Producto al Catálogo'}</span>
              </h3>
              <button
                onClick={() => setProductModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  value={prodForm.name}
                  onChange={(e) => setProdForm({ ...prodForm, name: e.target.value })}
                  placeholder="Ej. iPhone 16 Pro Max 256GB"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Categoría</label>
                  <select
                    value={prodForm.category}
                    onChange={(e) => setProdForm({ ...prodForm, category: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Disponibilidad</label>
                  <select
                    value={prodForm.delivery}
                    onChange={(e) => setProdForm({ ...prodForm, delivery: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  >
                    <option value="En stock en Lima">En stock en Lima (inmediato)</option>
                    <option value="Llega el 29 de Octubre">Llega el 29 de Octubre (viaje)</option>
                    <option value="Últimos cupos">Últimos cupos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Precio Regular (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodForm.regularPrice}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, regularPrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Precio Oferta (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={prodForm.price}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">URL de la Imagen</label>
                <input
                  type="url"
                  required
                  value={prodForm.img}
                  onChange={(e) => setProdForm({ ...prodForm, img: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {catModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">category</span>
                <span>{editingCatId ? 'Modificar Categoría' : 'Nueva Categoría'}</span>
              </h3>
              <button
                onClick={() => setCatModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="Ej. Fotografía"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Ícono Material Symbol
                </label>
                <input
                  type="text"
                  value={catForm.icon}
                  onChange={(e) => setCatForm({ ...catForm, icon: e.target.value })}
                  placeholder="photo_camera"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Descripción</label>
                <input
                  type="text"
                  value={catForm.desc}
                  onChange={(e) => setCatForm({ ...catForm, desc: e.target.value })}
                  placeholder="Cámaras y lentes importados"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCatModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
