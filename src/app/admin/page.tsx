'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { INITIAL_PRODUCTS } from '@/data/initialCatalog';
import { INITIAL_TRENDS } from '@/components/home/TrendsCarousel';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ProductImageManager, type ProductImageDraft } from '@/components/admin/ProductImageManager';
import { AdBanner } from '@/lib/types';
import { useToast } from '@/context/CartContext';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AdminPage() {
  const { showToast } = useToast();

  // Authentication State via Supabase Auth (Seguridad en Servidor)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authChecked, setAuthChecked] = useState<boolean>(false);
  const [loginEmail, setLoginEmail] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loginError, setLoginError] = useState<string>('');
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');

  // Tab Navigation State
  const [currentTab, setCurrentTab] = useState<
    'dashboard' | 'catalog' | 'categories' | 'crm' | 'marketing' | 'settings'
  >('dashboard');

  // Catalog Products State
  const [products, setProducts] = useState(INITIAL_PRODUCTS);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | number | null>(null);
  const [prodForm, setProdForm] = useState({
    name: '',
    description: '',
    category: 'Perfumes',
    delivery: 'Llega el 29 de Octubre',
    price: 0,
    offerActive: false,
    offerPrice: 0,
    img: '',
  });
  const [productImages, setProductImages] = useState<ProductImageDraft[]>([]);

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


  // Trip Settings State
  const [tripSettings, setTripSettings] = useState({
    startDate: '2026-10-20',
    returnDate: '2026-10-29',
    phone: '+51 960 759 244',
    exchangeRate: '3.75',
    activeTripLabel: '20 Oct - 29 Oct',
    departurePlace: 'Lima',
    arrivalPlace: 'Miami',
    orderDeadlineLima: '',
    orderDeadlineUsa: '',
  });

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [crmConnection, setCrmConnection] = useState('Conectando…');
  const [savingTicket, setSavingTicket] = useState<string | null>(null);

  // Marketing Banners & Tendencias State
  const [ads, setAds] = useState<AdBanner[]>(INITIAL_TRENDS);
  const [bannerModalOpen, setBannerModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | number | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    tag: 'Tendencia USA',
    btn_text: 'Pedir por link',
    link: '#pedir-link',
    img: '',
    active: true,
    display_order: 1,
  });

  // Load Initial Storage & Supabase Sync
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthSession = sessionStorage.getItem('storebass_admin_auth');
      // 1. Validar Sesión Real con Supabase Auth
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        supabase.auth.getSession().then(({ data: { session } }) => {
          if (session?.user) {
            setIsAuthenticated(true);
            setAdminEmail(session.user.email || 'Johan Tovar');
          }
          setAuthChecked(true);
        });

        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
          setIsAuthenticated(!!session?.user);
          setAdminEmail(session?.user?.email || 'Johan Tovar');
        });

        // 2. Cargar Catálogo de Productos desde Supabase Cloud
        supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              setProducts(data);
              localStorage.setItem('storebass_products', JSON.stringify(data));
            } else {
              // Fallback a localStorage si la tabla aún está vacía
              const savedProds = localStorage.getItem('storebass_products');
              if (savedProds) {
                try {
                  setProducts(JSON.parse(savedProds));
                } catch (e) {
                  console.error(e);
                }
              }
            }
          });

        // 4. Cargar Banners y Tendencias desde Supabase Cloud
        supabase
          .from('ads')
          .select('*')
          .order('display_order', { ascending: true })
          .then(({ data, error }) => {
            if (!error && data && data.length > 0) {
              setAds(data);
              localStorage.setItem('storebass_ads', JSON.stringify(data));
            } else {
              const savedAds = localStorage.getItem('storebass_ads');
              if (savedAds) {
                try {
                  const parsed = JSON.parse(savedAds);
                  if (Array.isArray(parsed) && parsed.length > 0) setAds(parsed);
                } catch (e) {
                  console.error(e);
                }
              }
            }
          });

        return () => subscription.unsubscribe();
      } else {
        setAuthChecked(true);
      }
    }
  }, []);

  // Load private orders only after authentication; refresh on reconnect and changes.
  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!isAuthenticated || !supabase) { setTickets([]); return; }
    let disposed = false;
    let request = 0;
    const refresh = async () => {
      const current = ++request;
      const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      if (disposed || current !== request) return;
      if (error) { setCrmConnection('Error al cargar pedidos'); return; }
      setTickets((data || []).map(t => ({ ...t, ticketId: t.ticket_code,
        fecha: new Date(t.created_at).toLocaleString('es-PE', { timeZone: 'America/Lima' }) })));
    };
    void refresh();
    const channel = supabase.channel('admin-crm')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => { void refresh(); })
      .subscribe(status => {
        if (disposed) return;
        setCrmConnection(status === 'SUBSCRIBED' ? 'En tiempo real' : 'Reconectando · respaldo cada 15 s');
        if (status === 'SUBSCRIBED') void refresh();
      });
    const timer = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener('focus', refresh); void supabase.removeChannel(channel); };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    let disposed = false;
    void supabase.from('trip_config').select('*').eq('id', 1).single().then(({ data, error }) => {
      if (disposed || error || !data) return;
      setTripSettings(previous => ({ ...previous,
        startDate: /^\d{4}-\d{2}-\d{2}$/.test(data.date_ida) ? data.date_ida : '',
        returnDate: /^\d{4}-\d{2}-\d{2}$/.test(data.date_regreso) ? data.date_regreso : '',
        phone: data.phone || '', exchangeRate: String(data.exchange_rate ?? 3.75),
        departurePlace: data.departure_place || 'Lima', arrivalPlace: data.arrival_place || 'Miami',
        orderDeadlineLima: data.order_deadline_lima || '', orderDeadlineUsa: data.order_deadline_usa || '',
      }));
    });
    return () => { disposed = true; };
  }, [isAuthenticated]);

  // Handle Login con Supabase Auth (Sin contraseñas en frontend)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);

    const email = loginEmail.trim().toLowerCase();
    const password = loginPassword.trim();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setLoginError('Error de conexión con el servidor Supabase.');
      setLoggingIn(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setLoginError(
          error?.message === 'Invalid login credentials'
            ? 'Credenciales incorrectas. Verifica tu correo y contraseña en Supabase Auth.'
            : (error?.message || 'Error al iniciar sesión.')
        );
        showToast('Acceso denegado', 'Credenciales no válidas');
      } else {
        setIsAuthenticated(true);
        setAdminEmail(data.user.email || 'Johan Tovar');
        showToast('Bienvenido Johan', `Sesión iniciada como ${data.user.email}`);
      }
    } catch (err: any) {
      setLoginError('Error inesperado al conectar con Supabase Auth.');
      console.error(err);
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    setIsAuthenticated(false);
    setAdminEmail('');
    showToast('Sesión cerrada', 'Has salido del panel de administración');
  };

  // Product CRUD
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.name || prodForm.price <= 0 || (prodForm.offerActive && (prodForm.offerPrice <= 0 || prodForm.offerPrice >= prodForm.price))) {
      showToast('Revisa los precios', prodForm.offerActive ? 'El precio de oferta debe ser mayor a 0 y menor que el precio regular' : 'Ingresa nombre y precio regular válido');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || saving || uploading) return;
    setSaving(true);
    try {
      const values = { name: prodForm.name.trim(), description: prodForm.description.trim(),
        category: prodForm.category, delivery: prodForm.delivery, regular_price: prodForm.price,
        price: prodForm.price, offer_active: prodForm.offerActive, offer_price: prodForm.offerActive ? prodForm.offerPrice : null,
        img: productImages[0]?.url || prodForm.img || '', updated_at: new Date().toISOString() };
      const query = editingProductId
        ? supabase.from('products').update(values).eq('id', editingProductId)
        : supabase.from('products').insert(values);
      const { data, error } = await query.select().single();
      if (error) throw error;
      if (data?.id) {
        const { error: imageDeleteError } = await supabase.from('product_images').delete().eq('product_id', data.id);
        if (imageDeleteError) throw imageDeleteError;
        if (productImages.length) {
          const rows = productImages.map((image, index) => ({ product_id: data.id, url: image.url, sort_order: index, is_primary: index === 0 }));
          const { error: imageInsertError } = await supabase.from('product_images').insert(rows);
          if (imageInsertError) throw imageInsertError;
        }
      }
      setProducts(previous => editingProductId ? previous.map(p => p.id === editingProductId ? data : p) : [data, ...previous]);
      window.dispatchEvent(new Event('storebass_products_updated'));
      setProductModalOpen(false);
      setEditingProductId(null);
      showToast('Producto guardado', prodForm.name);
    } catch {
      showToast('No se pudo guardar', 'Revisa tu conexión y permisos. El formulario conserva tus cambios.');
    } finally { setSaving(false); }
  };

  const handleDeleteProduct = async (id: number | string) => {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem('storebass_products', JSON.stringify(updated));
    window.dispatchEvent(new Event('storebass_products_updated'));

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.from('products').delete().eq('id', id);
      } catch (err) {
        console.warn('Error al eliminar producto en Supabase:', err);
      }
    }
    showToast('Producto eliminado');
  };

  const handleEditProduct = (p: any) => {
    setEditingProductId(p.id);
    setProdForm({
      name: p.name,
      description: p.description || '',
      category: p.category,
      delivery: p.delivery,
      price: p.regular_price ?? p.regularPrice ?? p.price,
      offerActive: !!p.offer_active,
      offerPrice: p.offer_price ?? 0,
      img: p.img || '',
    });
    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      void supabase.from('product_images').select('id,url,sort_order,is_primary').eq('product_id', p.id).order('sort_order').then(({ data }) => {
        const loaded = (data || []).map((image: any, index: number) => ({ id: image.id, url: image.url, sort_order: image.sort_order ?? index, is_primary: !!image.is_primary }));
        setProductImages(loaded.length ? loaded : (p.img ? [{ url: p.img, sort_order: 0, is_primary: true }] : []));
      });
    } else setProductImages(p.img ? [{ url: p.img, sort_order: 0, is_primary: true }] : []);
    setProductModalOpen(true);
  };

  // Category CRUD
  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.name) return;
    let updated: any[];
    const supabase = getSupabaseBrowserClient();

    if (editingCatId) {
      updated = categories.map((c) =>
        c.id === editingCatId ? { ...c, ...catForm } : c
      );
      showToast('Categoría modificada', catForm.name);

      if (supabase) {
        try {
          await supabase
            .from('categories')
            .update({
              name: catForm.name,
              icon: catForm.icon,
              description: catForm.desc,
              active: catForm.active,
              updated_at: new Date().toISOString(),
            })
            .eq('id', editingCatId);
        } catch (err) {
          console.warn('Error al actualizar categoría en Supabase:', err);
        }
      }
    } else {
      const newC = { id: Date.now(), ...catForm };
      updated = [...categories, newC];
      showToast('Nueva categoría creada', catForm.name);

      if (supabase) {
        try {
          await supabase.from('categories').insert([
            {
              name: catForm.name,
              icon: catForm.icon,
              description: catForm.desc,
              active: catForm.active,
            },
          ]);
        } catch (err) {
          console.warn('Error al insertar categoría en Supabase:', err);
        }
      }
    }
    setCategories(updated);
    localStorage.setItem('storebass_categories', JSON.stringify(updated));
    window.dispatchEvent(new Event('storebass_categories_updated'));
    setCatModalOpen(false);
    setEditingCatId(null);
  };

  // Guardar Ajustes de Viaje sincronizados con Supabase
  const handleSaveTripSettings = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || saving) return;
    if (!tripSettings.startDate || !tripSettings.returnDate || tripSettings.returnDate < tripSettings.startDate || !tripSettings.departurePlace.trim() || !tripSettings.arrivalPlace.trim()) {
      showToast('Revisa el viaje', 'Indica los lugares y fechas; el regreso debe ser posterior a la salida.'); return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('trip_config').update({
        date_ida: tripSettings.startDate, date_regreso: tripSettings.returnDate,
        phone: tripSettings.phone, phone_digits: tripSettings.phone.replace(/\D/g, ''),
        exchange_rate: Number(tripSettings.exchangeRate),
        departure_place: tripSettings.departurePlace.trim(), arrival_place: tripSettings.arrivalPlace.trim(),
        order_deadline_lima: tripSettings.orderDeadlineLima || null,
        order_deadline_usa: tripSettings.orderDeadlineUsa || null,
        updated_at: new Date().toISOString(),
      }).eq('id', 1).select('id').single();
      if (error) throw error;
      window.dispatchEvent(new Event('storebass_trip_settings_updated'));
      showToast('Ajustes guardados', 'Configuración del viaje actualizada en nube');
    } catch { showToast('No se pudo guardar', 'Revisa tu conexión y permisos.'); }
    finally { setSaving(false); }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: string) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || savingTicket) return;
    setSavingTicket(ticketId);
    try {
      const { data, error } = await supabase.from('tickets')
        .update({ estado: newStatus, updated_at: new Date().toISOString() })
        .eq('ticket_code', ticketId).select().single();
      if (error) throw error;
      setTickets(previous => previous.map(t => t.ticket_code === ticketId ? { ...t, ...data } : t));
      showToast('Estado guardado', `${ticketId}: ${newStatus}`);
    } catch { showToast('No se guardó el estado', 'Inténtalo nuevamente.'); }
    finally { setSavingTicket(null); }
  };

  // ==========================================
  // BANNER & TENDENCIAS CRUD HANDLERS
  // ==========================================
  const handleOpenAddBanner = () => {
    setEditingBannerId(null);
    setBannerForm({
      title: '',
      subtitle: '',
      tag: 'Tendencia USA',
      btn_text: 'Pedir por link',
      link: '#pedir-link',
      img: '',
      active: true,
      display_order: ads.length + 1,
    });
    setBannerModalOpen(true);
  };

  const handleEditBanner = (ad: AdBanner) => {
    setEditingBannerId(ad.id || null);
    setBannerForm({
      title: ad.title || '',
      subtitle: ad.subtitle || '',
      tag: ad.tag || 'Tendencia USA',
      btn_text: ad.btn_text || ad.btnText || 'Pedir por link',
      link: ad.link || '#pedir-link',
      img: ad.img || '',
      active: ad.active !== false,
      display_order: ad.display_order || 1,
    });
    setBannerModalOpen(true);
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerForm.img || !bannerForm.title) {
      alert('Por favor selecciona una imagen y escribe el título del banner');
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase || saving || uploading) return;
    setSaving(true);
    try {
      const query = editingBannerId !== null
        ? supabase.from('ads').update(bannerForm).eq('id', editingBannerId)
        : supabase.from('ads').insert(bannerForm);
      const { data, error } = await query.select().single();
      if (error) throw error;
      setAds(previous => editingBannerId !== null ? previous.map(a => a.id === editingBannerId ? data : a) : [data, ...previous]);
      window.dispatchEvent(new Event('storebass_ads_updated'));
      setBannerModalOpen(false);
      setEditingBannerId(null);
      showToast('Imagen guardada', bannerForm.title);
    } catch { showToast('No se pudo guardar la imagen', 'Revisa tu conexión y permisos.'); }
    finally { setSaving(false); }
  };

  const handleToggleBannerActive = async (id: string | number) => {
    const updated = ads.map((a) => (a.id === id ? { ...a, active: !a.active } : a));
    setAds(updated);
    localStorage.setItem('storebass_ads', JSON.stringify(updated));
    window.dispatchEvent(new Event('storebass_ads_updated'));

    const toggled = updated.find((a) => a.id === id);
    showToast(toggled?.active ? 'Imagen activada en web' : 'Imagen ocultada');

    const supabase = getSupabaseBrowserClient();
    if (supabase && toggled) {
      try {
        await supabase.from('ads').update({ active: toggled.active }).eq('id', id);
      } catch (err) {
        console.warn('Error syncing banner active status to Supabase:', err);
      }
    }
  };

  const handleDeleteBanner = async (id: string | number) => {
    if (!confirm('¿Estás seguro de eliminar esta imagen del carrusel de tendencias?')) return;
    const updated = ads.filter((a) => a.id !== id);
    setAds(updated);
    localStorage.setItem('storebass_ads', JSON.stringify(updated));
    window.dispatchEvent(new Event('storebass_ads_updated'));
    showToast('Imagen eliminada del carrusel');

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      try {
        await supabase.from('ads').delete().eq('id', id);
      } catch (err) {
        console.warn('Error deleting banner in Supabase:', err);
      }
    }
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
                Correo Electrónico Administrador
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                  mail
                </span>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value);
                    if (loginError) setLoginError('');
                  }}
                  required
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="admin@storebass.pe"
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
                  placeholder="••••••••••••"
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
              disabled={loggingIn}
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-slate-950 font-black py-3.5 px-4 rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-xl">
                {loggingIn ? 'sync' : 'login'}
              </span>
              <span>{loggingIn ? 'Verificando con Supabase...' : 'Ingresar al Panel'}</span>
            </button>
          </form>

          <div className="mt-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 text-[11px] text-slate-400 flex items-start gap-2">
            <span className="material-symbols-outlined text-sm text-emerald-400 shrink-0 mt-0.5">verified_user</span>
            <span>Acceso seguro administrado por Supabase Auth (JWT). Solo usuarios con credenciales oficiales.</span>
          </div>

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
              <p className="text-xs font-bold text-white truncate">{adminEmail || 'Johan Tovar'}</p>
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
                id: 'crm',
                label: 'Tickets & Pedidos',
                icon: 'confirmation_number',
                badge: tickets.length,
              },
              {
                id: 'marketing',
                label: 'Tendencias & Banners',
                icon: 'auto_awesome',
                badge: ads.filter((a) => a.active !== false).length,
              },
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
                  <div className="text-2xl font-black text-white">
                    S/ {tickets.reduce((acc, t) => acc + (parseFloat(t.total) || 0), 0).toFixed(2)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold mt-2">
                    <span className="material-symbols-outlined text-sm">trending_up</span>
                    <span>Pedidos sincronizados en tiempo real</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Productos en Catálogo
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
                      <span className="material-symbols-outlined">inventory_2</span>
                    </div>
                  </div>
                  <div className="text-2xl font-black text-white">
                    {products.length} Artículos
                  </div>
                  <div className="text-xs text-blue-300 font-bold mt-2 flex items-center gap-1">
                    <span>📦 Catálogo sincronizado en tiempo real</span>
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
                    {tickets.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-xs bg-slate-800/30 rounded-2xl border border-slate-800">
                        <span className="material-symbols-outlined text-3xl mb-1 text-slate-600 block">inbox</span>
                        Aún no hay tickets ni pedidos registrados. Los nuevos pedidos aparecerán aquí automáticamente.
                      </div>
                    ) : (
                      tickets.slice(0, 5).map((t, idx) => (
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
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-blue-400">airlines</span>
                    <span>Itinerario Hub Miami (MIA)</span>
                  </h3>

                  <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white">Próximo viaje configurado</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-[10px] border border-emerald-500/20">Activo</span>
          </div>
          <div className="text-xs text-slate-400">{tripSettings.departurePlace} → {tripSettings.arrivalPlace}</div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="rounded-xl bg-slate-900/70 p-2 border border-slate-700"><span className="block text-slate-500">Salida</span><span className="font-bold text-white">{tripSettings.startDate || 'Sin fecha'}</span></div>
            <div className="rounded-xl bg-slate-900/70 p-2 border border-slate-700"><span className="block text-slate-500">Regreso</span><span className="font-bold text-white">{tripSettings.returnDate || 'Sin fecha'}</span></div>
          </div>
        </div>
                  <button
                    onClick={() => setCurrentTab('settings')}
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
                        description: '',
                        category: 'Perfumes',
                        delivery: 'Llega el 29 de Octubre',
                        price: 0,
                        offerActive: false,
                        offerPrice: 0,
                        img: '',
                      });
                      setProductImages([]);
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
                              S/ {parseFloat(String(p.regular_price ?? p.regularPrice ?? p.price)).toFixed(2)}
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
                        <th className="p-4">Ticket <span className="block text-[10px] normal-case" role="status">{crmConnection}</span></th>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Cliente</th>
                        <th className="p-4">Detalle / Links</th>
                        <th className="p-4">Total</th>
                        <th className="p-4">Estado</th>
                        <th className="p-4 text-right">WhatsApp</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {tickets.filter((t) => ticketFilter === 'todos' || t.origen === ticketFilter).length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400">
                            <span className="material-symbols-outlined text-3xl mb-1 text-slate-600 block">inbox</span>
                            No hay tickets ni pedidos registrados aún. Los pedidos entrantes desde la web y WhatsApp aparecerán aquí automáticamente.
                          </td>
                        </tr>
                      ) : (
                        tickets
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
                            <td className="p-4 text-xs max-w-xs text-slate-300">
                              <details><summary className="cursor-pointer font-bold text-amber-400">Ver pedido, entrega y observaciones</summary>
                                <p className="mt-2 whitespace-pre-wrap break-words">{t.detalle}</p>
                              </details>
                            </td>
                            <td className="p-4 font-black text-slate-100 text-xs">
                              S/ {parseFloat(t.total || 0).toFixed(2)}
                            </td>
                            <td className="p-4">
                              <select
                                disabled={savingTicket !== null}
                                value={t.estado || 'Pendiente'}
                                onChange={(e) =>
                                  handleUpdateTicketStatus(t.ticket_code, e.target.value)
                                }
                                className="bg-slate-800 border border-slate-700 text-xs text-white rounded-lg px-2 py-1 focus:border-amber-500"
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="Cotizado">Cotizado</option>
                                <option value="Confirmado y pagado">Confirmado y pagado</option>
                                <option value="Comprado en USA">Comprado en USA</option>
                                <option value="En camino a Perú">En camino a Perú</option>
                                <option value="Listo para entrega">Listo para entrega</option>
                                <option value="Entregado">Entregado</option>
                                <option value="Cancelado">Cancelado</option>
                              </select>
                            </td>
                            <td className="p-4 text-right">
                              <a
                                href={`https://wa.me/${(t.telefono || '').replace(
                                  /[^0-9]/g,
                                  ''
                                )}?text=${encodeURIComponent(
                                  `🛍️ *STORE BASS — CONFIRMACIÓN DE PEDIDO* 🇺🇸✈️🇵🇪\n─────────────────────────\n👋 ¡Hola ${t.cliente}! Te escribe Johan Tovar respecto a tu ticket consecutivo #${t.ticketId || t.ticket_code}.\n\n✅ *ESTADO:* ${t.estado || 'Confirmado'}\n📦 *DETALLE:* ${t.detalle || 'Productos del pedido'}\n💰 *TOTAL EN SOLES:* S/ ${parseFloat(t.total || 0).toFixed(2)}\n✈️ *ENTREGA EN LIMA:* 29 de Octubre\n─────────────────────────\n¿Deseas coordinar los datos de entrega o hacer alguna consulta adicional? ¡Estoy a tu servicio! 🙌`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-transform active:scale-95"
                              >
                                <span className="material-symbols-outlined text-sm">chat</span>
                                <span>Confirmar WA</span>
                              </a>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: TENDENCIAS & BANNERS DEL CARRUSEL */}
          {currentTab === 'marketing' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-amber-500">auto_awesome</span>
                    <span>Gestor de Imágenes: Carrusel de Tendencias & Novedades</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Modifica las imágenes, textos y enlaces que se exhiben en el carrusel de la página de inicio.
                  </p>
                </div>
                <button
                  onClick={handleOpenAddBanner}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 transition-transform active:scale-95 shadow-md flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-base">add_photo_alternate</span>
                  <span>Añadir Imagen / Novedad</span>
                </button>
              </div>

              {ads.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center text-slate-400 space-y-3">
                  <span className="material-symbols-outlined text-4xl text-slate-600">collections</span>
                  <p className="text-sm font-bold text-slate-300">No hay imágenes en el carrusel</p>
                  <p className="text-xs text-slate-500">Haz clic en &ldquo;Añadir Imagen / Novedad&rdquo; para agregar tu primera diapositiva.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ads.map((ad, idx) => (
                    <div
                      key={ad.id || idx}
                      className="bg-slate-900 border border-slate-800 rounded-3xl p-5 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all shadow-xl group"
                    >
                      <div>
                        {/* Previsualización de la Imagen */}
                        <div className="w-full h-44 rounded-2xl overflow-hidden relative mb-4 bg-slate-950 border border-slate-800">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ad.img}
                            alt={ad.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                          <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-sm">
                            {ad.tag || 'Tendencia USA'}
                          </span>
                          <span className="absolute bottom-2.5 right-3 text-[10px] text-white/80 font-bold bg-slate-900/80 px-2 py-0.5 rounded-md backdrop-blur-sm">
                            Posición #{idx + 1}
                          </span>
                        </div>

                        <h4 className="text-base font-extrabold text-white mb-1.5 leading-snug">
                          {ad.title}
                        </h4>
                        {ad.subtitle && (
                          <p className="text-xs text-slate-400 mb-3 line-clamp-2 leading-relaxed">
                            {ad.subtitle}
                          </p>
                        )}

                        <div className="text-[11px] text-slate-500 space-y-1 mb-4">
                          <p className="truncate">
                            <span className="text-slate-400 font-semibold">Enlace:</span> {ad.link || '#catalogo'}
                          </p>
                          <p>
                            <span className="text-slate-400 font-semibold">Botón:</span> {ad.btn_text || ad.btnText || 'Pedir'}
                          </p>
                        </div>
                      </div>

                      {/* Barra de Acciones: Cambiar Imagen, Toggle Activo y Eliminar */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleBannerActive(ad.id!)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            ad.active !== false
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {ad.active !== false ? '● Activo en Web' : '○ Oculto'}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditBanner(ad)}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-300 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                            title="Cambiar imagen o editar textos"
                          >
                            <span className="material-symbols-outlined text-sm">edit</span>
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteBanner(ad.id!)}
                            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-400 text-slate-400 flex items-center justify-center transition-all active:scale-95"
                            title="Eliminar del carrusel"
                          >
                            <span className="material-symbols-outlined text-sm">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                      Fecha de salida
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
                      Fecha de regreso (llegada de pedidos)
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

                  <label className="block text-xs font-bold text-slate-400">Lugar de salida
                    <input type="text" value={tripSettings.departurePlace} onChange={e => setTripSettings({ ...tripSettings, departurePlace: e.target.value })} className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2" />
                  </label>
                  <label className="block text-xs font-bold text-slate-400">Lugar de llegada (destino de ida)
                    <input type="text" value={tripSettings.arrivalPlace} onChange={e => setTripSettings({ ...tripSettings, arrivalPlace: e.target.value })} className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2" />
                  </label>
                  <label className="block text-xs font-bold text-slate-400">Recibimos pedidos en Lima hasta
                    <input type="date" value={tripSettings.orderDeadlineLima} onChange={e => setTripSettings({ ...tripSettings, orderDeadlineLima: e.target.value })} className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2" />
                  </label>
                  <label className="block text-xs font-bold text-slate-400">Recibimos pedidos en USA hasta
                    <input type="date" value={tripSettings.orderDeadlineUsa} onChange={e => setTripSettings({ ...tripSettings, orderDeadlineUsa: e.target.value })} className="mt-1 w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2" />
                  </label>
                  <button
                    onClick={handleSaveTripSettings}
                    disabled={saving}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs transition-colors shadow-md mt-4 cursor-pointer"
                  >
                    Guardar Configuración en Nube
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl space-y-4">
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
                    <option value="Solo a pedido">Solo a pedido</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Precio Regular (S/)</label>
                  <input type="number" min="0.01" step="0.01" required value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" />
                </div>
                <label className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800/40 px-3 py-2.5 cursor-pointer">
                  <input type="checkbox" checked={prodForm.offerActive} onChange={e => setProdForm({ ...prodForm, offerActive: e.target.checked, offerPrice: e.target.checked ? prodForm.offerPrice : 0 })} className="h-4 w-4 accent-amber-500" />
                  <span className="font-bold text-white">Activar oferta</span>
                </label>
              </div>

              {prodForm.offerActive && <div>
                <label className="block text-slate-400 font-bold mb-1">Precio Oferta (S/)</label>
                <input type="number" min="0.01" step="0.01" required value={prodForm.offerPrice || ''}
                  onChange={e => setProdForm({ ...prodForm, offerPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500" />
              </div>}

              <div>
                <label className="block text-slate-400 font-bold mb-1">Descripción del producto</label>
                <textarea aria-label="Descripción del producto" value={prodForm.description} onChange={e => setProdForm({ ...prodForm, description: e.target.value })} rows={3} className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 mb-3" />
                <ProductImageManager images={productImages} onChange={setProductImages} onBusy={setUploading} />
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
                  type="submit" disabled={saving || uploading}
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
                  type="submit" disabled={saving || uploading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Banner / Tendencias Modal */}
      {bannerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-500">auto_awesome</span>
                <span>{editingBannerId !== null ? 'Modificar Imagen de Tendencia' : 'Añadir Nueva Imagen al Carrusel'}</span>
              </h3>
              <button
                onClick={() => setBannerModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleSaveBanner} className="space-y-4 text-xs">
              {/* Previsualización en Vivo de la Imagen */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">Previsualización de la Imagen</label>
                <div className="w-full h-40 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative flex items-center justify-center">
                  {bannerForm.img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bannerForm.img}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center gap-1">
                      <span className="material-symbols-outlined text-3xl">image</span>
                      <span className="text-[11px]">Selecciona una imagen para ver la previsualización</span>
                    </div>
                  )}
                  {bannerForm.tag && (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[9px] font-black uppercase shadow-md">
                      {bannerForm.tag}
                    </span>
                  )}
                </div>
              </div>

              <ImageUpload onUpload={url => setBannerForm(previous => ({ ...previous, img: url }))} onBusy={setUploading} />

              {/* Título Principal */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Título del Producto o Novedad <span className="text-amber-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  placeholder="Ej. Stanley Quencher H2.0 FlowState 40oz"
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Subtítulo / Descripción */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Descripción o Detalle de Oportunidad
                </label>
                <textarea
                  rows={2}
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                  placeholder="Ej. El termo viral de TikTok traído en colores exclusivos directamente de tiendas oficiales de USA."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              {/* Grid: Etiqueta y Texto del Botón */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Etiqueta / Badge
                  </label>
                  <input
                    type="text"
                    value={bannerForm.tag}
                    onChange={(e) => setBannerForm({ ...bannerForm, tag: e.target.value })}
                    placeholder="Ej. Viral en TikTok USA"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">
                    Texto del Botón CTA
                  </label>
                  <input
                    type="text"
                    value={bannerForm.btn_text}
                    onChange={(e) => setBannerForm({ ...bannerForm, btn_text: e.target.value })}
                    placeholder="Ej. Pedir por link"
                    className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Enlace de Destino */}
              <div>
                <label className="block text-slate-400 font-bold mb-1">
                  Enlace de Destino (Link)
                </label>
                <input
                  type="text"
                  value={bannerForm.link}
                  onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                  placeholder="#pedir-link, #catalogo o https://wa.me/..."
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Toggle Activo */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="banner-active"
                  checked={bannerForm.active}
                  onChange={(e) => setBannerForm({ ...bannerForm, active: e.target.checked })}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-0 bg-slate-800 border-slate-700 cursor-pointer"
                />
                <label htmlFor="banner-active" className="text-slate-300 font-semibold cursor-pointer">
                  Mostrar esta imagen activamente en el carrusel de la tienda
                </label>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBannerModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={saving || uploading}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl shadow-md transition-transform active:scale-95"
                >
                  Guardar Imagen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
