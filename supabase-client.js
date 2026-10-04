/**
 * STORE BASS - Supabase Client & Data Synchronization Engine
 * Administrador: Johan Tovar
 * Permite operar conectado a Supabase Cloud (PostgreSQL) o en modo local (LocalStorage)
 */

(function () {
  const DEFAULT_SEQ_START = 1004;

  class StoreBassDatabase {
    constructor() {
      this.client = null;
      this.isConnected = false;
      this.initClient();
    }

    getCredentials() {
      // 1. URL detectada de tu proyecto Supabase
      const defaultUrl = 'https://zaokqljaadbidnamklvb.supabase.co';

      // 2. Verificar variables globales inyectadas (Vercel / Window)
      const envUrl = window.STOREBASS_SUPABASE_URL || (window.process && window.process.env && window.process.env.SUPABASE_URL);
      const envKey = window.STOREBASS_SUPABASE_KEY || (window.process && window.process.env && window.process.env.SUPABASE_ANON_KEY);

      // 3. Verificar configuración en LocalStorage guardada por Johan Tovar en el CRM
      const storedUrl = localStorage.getItem('storebass_supabase_url');
      const storedKey = localStorage.getItem('storebass_supabase_key');

      const url = storedUrl || envUrl || defaultUrl;
      const key = storedKey || envKey || '';

      return { url: url.trim(), key: key.trim() };
    }

    initClient() {
      const { url, key } = this.getCredentials();
      if (url && key && window.supabase && typeof window.supabase.createClient === 'function') {
        try {
          this.client = window.supabase.createClient(url, key, {
            auth: {
              persistSession: true,
              autoRefreshToken: true
            }
          });
          this.isConnected = true;
          console.log('[STORE BASS] Conectado a Supabase Cloud:', url);
        } catch (err) {
          console.warn('[STORE BASS] Error al inicializar cliente Supabase:', err);
          this.client = null;
          this.isConnected = false;
        }
      } else {
        this.client = null;
        this.isConnected = false;
      }
    }

    isConfigured() {
      const { url, key } = this.getCredentials();
      return Boolean(url && key);
    }

    async testConnection() {
      const { url, key } = this.getCredentials();
      if (!url || !key) {
        return { success: false, message: 'Falta ingresar la URL y la Anon Key de Supabase' };
      }
      try {
        if (!window.supabase) {
          return { success: false, message: 'La librería @supabase/supabase-js no se cargó correctamente' };
        }
        const tempClient = window.supabase.createClient(url, key);
        const { data, error } = await tempClient.from('categories').select('count', { count: 'exact', head: true });
        if (error) {
          return { success: false, message: `Error Supabase: ${error.message}` };
        }
        this.client = tempClient;
        this.isConnected = true;
        return { success: true, message: '¡Conexión exitosa a la base de datos de Supabase!' };
      } catch (err) {
        return { success: false, message: `Excepción de red: ${err.message}` };
      }
    }

    setCredentials(url, key) {
      if (url) localStorage.setItem('storebass_supabase_url', url.trim());
      else localStorage.removeItem('storebass_supabase_url');

      if (key) localStorage.setItem('storebass_supabase_key', key.trim());
      else localStorage.removeItem('storebass_supabase_key');

      this.initClient();
    }

    // =========================================================================
    // CATEGORÍAS
    // =========================================================================
    async getCategories() {
      if (this.isConnected && this.client) {
        try {
          const { data, error } = await this.client
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: true });
          if (!error && data && data.length > 0) {
            // Sincronizar copia local
            localStorage.setItem('storebass_categories', JSON.stringify(data));
            return data;
          }
        } catch (e) {
          console.warn('[STORE BASS] Fallo al consultar categorías en nube, usando local:', e);
        }
      }
      return JSON.parse(localStorage.getItem('storebass_categories') || '[]');
    }

    async saveCategory(cat) {
      // 1. Guardar siempre en local para reactividad inmediata
      let local = JSON.parse(localStorage.getItem('storebass_categories') || '[]');
      if (cat.id) {
        local = local.map(c => (c.id == cat.id || c.name === cat.name ? { ...c, ...cat } : c));
      } else {
        cat.id = cat.id || Date.now();
        local.push(cat);
      }
      localStorage.setItem('storebass_categories', JSON.stringify(local));

      // 2. Si está conectado a Supabase, sincronizar en la nube
      if (this.isConnected && this.client) {
        try {
          const payload = {
            name: cat.name,
            icon: cat.icon || 'category',
            description: cat.desc || cat.description || '',
            active: cat.active !== false,
            updated_at: new Date().toISOString()
          };
          await this.client.from('categories').upsert(payload, { onConflict: 'name' });
        } catch (e) {
          console.warn('[STORE BASS] Error guardando categoría en Supabase:', e);
        }
      }
      return cat;
    }

    async deleteCategory(idOrName) {
      let local = JSON.parse(localStorage.getItem('storebass_categories') || '[]');
      const target = local.find(c => c.id == idOrName || c.name === idOrName);
      local = local.filter(c => c.id != idOrName && c.name !== idOrName);
      localStorage.setItem('storebass_categories', JSON.stringify(local));

      if (this.isConnected && this.client && target) {
        try {
          await this.client.from('categories').delete().eq('name', target.name);
        } catch (e) {
          console.warn('[STORE BASS] Error borrando categoría en Supabase:', e);
        }
      }
    }

    // =========================================================================
    // PRODUCTOS
    // =========================================================================
    async getProducts() {
      if (this.isConnected && this.client) {
        try {
          const { data, error } = await this.client
            .from('products')
            .select('*')
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const mapped = data.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category,
              regularPrice: p.regular_price,
              price: p.price,
              delivery: p.delivery,
              img: p.img,
              active: p.active
            }));
            localStorage.setItem('storebass_products', JSON.stringify(mapped));
            return mapped;
          }
        } catch (e) {
          console.warn('[STORE BASS] Fallo al consultar productos en nube, usando local:', e);
        }
      }
      return JSON.parse(localStorage.getItem('storebass_products') || '[]');
    }

    async saveProduct(prod) {
      let local = JSON.parse(localStorage.getItem('storebass_products') || '[]');
      if (prod.id) {
        local = local.map(p => (p.id == prod.id ? { ...p, ...prod } : p));
      } else {
        prod.id = prod.id || Date.now();
        local.unshift(prod);
      }
      localStorage.setItem('storebass_products', JSON.stringify(local));

      if (this.isConnected && this.client) {
        try {
          const payload = {
            name: prod.name,
            category: prod.category,
            regular_price: prod.regularPrice || prod.regular_price || prod.price,
            price: prod.price,
            delivery: prod.delivery,
            img: prod.img,
            active: prod.active !== false,
            updated_at: new Date().toISOString()
          };
          if (typeof prod.id === 'string' && prod.id.length > 20) {
            payload.id = prod.id;
          }
          await this.client.from('products').upsert(payload);
        } catch (e) {
          console.warn('[STORE BASS] Error guardando producto en Supabase:', e);
        }
      }
      return prod;
    }

    async deleteProduct(id) {
      let local = JSON.parse(localStorage.getItem('storebass_products') || '[]');
      local = local.filter(p => p.id != id);
      localStorage.setItem('storebass_products', JSON.stringify(local));

      if (this.isConnected && this.client) {
        try {
          await this.client.from('products').delete().eq('id', id);
        } catch (e) {
          console.warn('[STORE BASS] Error borrando producto en Supabase:', e);
        }
      }
    }

    // =========================================================================
    // PUBLICIDAD, BANNERS Y CAMPAÑAS
    // =========================================================================
    async getAds() {
      if (this.isConnected && this.client) {
        try {
          const { data, error } = await this.client
            .from('ads')
            .select('*')
            .order('display_order', { ascending: true })
            .order('created_at', { ascending: false });
          if (!error && data && data.length > 0) {
            const mapped = data.map(a => ({
              id: a.id,
              title: a.title,
              subtitle: a.subtitle,
              tag: a.tag,
              btnText: a.btn_text,
              link: a.link,
              img: a.img,
              active: a.active
            }));
            localStorage.setItem('storebass_ads', JSON.stringify(mapped));
            return mapped;
          }
        } catch (e) {
          console.warn('[STORE BASS] Fallo al consultar publicidad en nube:', e);
        }
      }
      return JSON.parse(localStorage.getItem('storebass_ads') || '[]');
    }

    async saveAd(ad) {
      let local = JSON.parse(localStorage.getItem('storebass_ads') || '[]');
      if (ad.id) {
        local = local.map(a => (a.id == ad.id ? { ...a, ...ad } : a));
      } else {
        ad.id = ad.id || Date.now();
        local.unshift(ad);
      }
      localStorage.setItem('storebass_ads', JSON.stringify(local));

      if (this.isConnected && this.client) {
        try {
          const payload = {
            title: ad.title,
            subtitle: ad.subtitle,
            tag: ad.tag || 'Campaña Oficial',
            btn_text: ad.btnText || ad.btn_text || 'Ver productos',
            link: ad.link || '#catalogo',
            img: ad.img,
            active: ad.active !== false,
            updated_at: new Date().toISOString()
          };
          if (typeof ad.id === 'string' && ad.id.length > 20) {
            payload.id = ad.id;
          }
          await this.client.from('ads').upsert(payload);
        } catch (e) {
          console.warn('[STORE BASS] Error guardando anuncio en Supabase:', e);
        }
      }
      return ad;
    }

    async deleteAd(id) {
      let local = JSON.parse(localStorage.getItem('storebass_ads') || '[]');
      local = local.filter(a => a.id != id);
      localStorage.setItem('storebass_ads', JSON.stringify(local));

      if (this.isConnected && this.client) {
        try {
          await this.client.from('ads').delete().eq('id', id);
        } catch (e) {
          console.warn('[STORE BASS] Error borrando anuncio en Supabase:', e);
        }
      }
    }

    // =========================================================================
    // TICKETS CORRELATIVOS (WEB Y WHATSAPP)
    // =========================================================================
    async getTickets() {
      if (this.isConnected && this.client) {
        try {
          const { data, error } = await this.client
            .from('tickets')
            .select('*')
            .order('correlativo', { ascending: false });
          if (!error && data && data.length > 0) {
            const mapped = data.map(t => ({
              id: t.id,
              ticketId: t.ticket_code,
              correlativo: t.correlativo,
              origen: t.origen,
              fecha: new Date(t.created_at).toLocaleString('es-PE'),
              cliente: t.cliente,
              telefono: t.telefono,
              detalle: t.detalle,
              total: parseFloat(t.total || 0),
              estado: t.estado,
              tipo: t.tipo,
              items: t.items || []
            }));
            localStorage.setItem('storebass_tickets', JSON.stringify(mapped));
            return mapped;
          }
        } catch (e) {
          console.warn('[STORE BASS] Fallo al consultar tickets en nube:', e);
        }
      }
      return JSON.parse(localStorage.getItem('storebass_tickets') || '[]');
    }

    async createTicket(ticketData) {
      let seq = parseInt(localStorage.getItem('storebass_ticket_seq') || `${DEFAULT_SEQ_START}`, 10);
      let ticketCode = `TK-${seq}`;

      // 1. Intentar llamar a función atómica en Supabase si está disponible
      if (this.isConnected && this.client) {
        try {
          const { data, error } = await this.client.rpc('fn_create_ticket', {
            p_origen: ticketData.origen || 'Web',
            p_cliente: ticketData.cliente,
            p_telefono: ticketData.telefono,
            p_detalle: ticketData.detalle,
            p_total: ticketData.total || 0,
            p_estado: ticketData.estado || 'Pendiente',
            p_tipo: ticketData.tipo || 'compra_lista',
            p_items: ticketData.items || []
          });

          if (!error && data && data.length > 0) {
            const res = data[0];
            ticketCode = res.ticket_code;
            seq = res.correlativo;
            localStorage.setItem('storebass_ticket_seq', (seq + 1).toString());
          }
        } catch (e) {
          console.warn('[STORE BASS] Error al ejecutar RPC fn_create_ticket en Supabase:', e);
        }
      }

      // Si no usó RPC o falló, usar secuencia local
      if (!ticketData.ticketId) {
        ticketData.ticketId = ticketCode;
        ticketData.correlativo = seq;
        localStorage.setItem('storebass_ticket_seq', (seq + 1).toString());
      }

      ticketData.fecha = ticketData.fecha || new Date().toLocaleString('es-PE');

      // Guardar en LocalStorage
      let tickets = JSON.parse(localStorage.getItem('storebass_tickets') || '[]');
      tickets.unshift(ticketData);
      localStorage.setItem('storebass_tickets', JSON.stringify(tickets));

      // Sincronizar inserción manual si Supabase está activo pero no usó RPC
      if (this.isConnected && this.client) {
        try {
          await this.client.from('tickets').insert([{
            ticket_code: ticketData.ticketId,
            correlativo: ticketData.correlativo,
            origen: ticketData.origen,
            cliente: ticketData.cliente,
            telefono: ticketData.telefono,
            detalle: ticketData.detalle,
            total: ticketData.total || 0,
            estado: ticketData.estado || 'Pendiente',
            tipo: ticketData.tipo || 'compra_lista',
            items: ticketData.items || []
          }]);
        } catch (err) {
          console.warn('[STORE BASS] Error de respaldo en tickets:', err);
        }
      }

      return ticketData;
    }

    async updateTicketStatus(ticketCode, newStatus) {
      let tickets = JSON.parse(localStorage.getItem('storebass_tickets') || '[]');
      tickets = tickets.map(t => (t.ticketId === ticketCode ? { ...t, estado: newStatus } : t));
      localStorage.setItem('storebass_tickets', JSON.stringify(tickets));

      if (this.isConnected && this.client) {
        try {
          await this.client
            .from('tickets')
            .update({ estado: newStatus, updated_at: new Date().toISOString() })
            .eq('ticket_code', ticketCode);
        } catch (e) {
          console.warn('[STORE BASS] Error actualizando estado de ticket en Supabase:', e);
        }
      }
    }

    // =========================================================================
    // CONFIGURACIÓN DEL VIAJE
    // =========================================================================
    async getTripConfig() {
      if (this.isConnected && this.client) {
        try {
          const { data, error } = await this.client
            .from('trip_config')
            .select('*')
            .eq('id', 1)
            .single();
          if (!error && data) {
            const cfg = {
              brandName: data.brand_name,
              adminName: data.admin_name,
              phone: data.phone,
              phoneDigits: data.phone_digits,
              dateIda: data.date_ida,
              dateRegreso: data.date_regreso,
              status: data.status,
              announcements: data.announcements || []
            };
            localStorage.setItem('storebass_trip_config', JSON.stringify(cfg));
            return cfg;
          }
        } catch (e) {
          console.warn('[STORE BASS] Fallo al consultar configuración en nube:', e);
        }
      }
      return JSON.parse(localStorage.getItem('storebass_trip_config') || 'null');
    }

    async saveTripConfig(cfg) {
      localStorage.setItem('storebass_trip_config', JSON.stringify(cfg));

      if (this.isConnected && this.client) {
        try {
          await this.client.from('trip_config').upsert({
            id: 1,
            brand_name: cfg.brandName || 'STORE BASS',
            admin_name: cfg.adminName || 'Johan Tovar',
            phone: cfg.phone || '960 759 244',
            phone_digits: cfg.phoneDigits || '51960759244',
            date_ida: cfg.dateIda,
            date_regreso: cfg.dateRegreso,
            status: cfg.status,
            announcements: cfg.announcements || [],
            updated_at: new Date().toISOString()
          });
        } catch (e) {
          console.warn('[STORE BASS] Error guardando config en Supabase:', e);
        }
      }
      return cfg;
    }
  }

  // Instanciar motor global
  window.storebassDb = new StoreBassDatabase();
})();
