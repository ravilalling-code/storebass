-- =========================================================================
-- STORE BASS - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Versión: 2.0 Pro - Administrador: Johan Tovar (STORE BASS Perú)
-- =========================================================================

-- 1. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- 2. SECUENCIA CORRELATIVA PARA TICKETS (CONSECUTIVO ESTRICTO)
-- Inicia en 1004 para continuar después de los 3 tickets de prueba iniciales
-- =========================================================================
CREATE SEQUENCE IF NOT EXISTS storebass_ticket_seq START WITH 1004 INCREMENT BY 1;

-- =========================================================================
-- 3. TABLA: CATEGORÍAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    icon TEXT DEFAULT 'category',
    description TEXT,
    active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW())
);

-- =========================================================================
-- 4. TABLA: PRODUCTOS DEL CATÁLOGO
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL REFERENCES public.categories(name) ON UPDATE CASCADE ON DELETE RESTRICT,
    regular_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    delivery TEXT NOT NULL DEFAULT 'Llega en mi próximo regreso',
    img TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW())
);

-- =========================================================================
-- 5. TABLA: TICKETS CORRELATIVOS (WEB & WHATSAPP UNIFICADOS)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_code TEXT UNIQUE NOT NULL, -- e.g. TK-1004
    correlativo INTEGER UNIQUE NOT NULL, -- e.g. 1004
    origen TEXT NOT NULL CHECK (origen IN ('Web', 'WhatsApp')),
    cliente TEXT NOT NULL,
    telefono TEXT NOT NULL,
    detalle TEXT NOT NULL,
    total NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    estado TEXT NOT NULL DEFAULT 'Pendiente' CHECK (estado IN (
        'Pendiente',
        'Cotizado',
        'Confirmado y pagado',
        'Comprado en USA',
        'En camino a Perú',
        'Listo para entrega',
        'Entregado',
        'Cancelado'
    )),
    tipo TEXT DEFAULT 'compra_lista' CHECK (tipo IN ('compra_lista', 'cotizacion_links', 'whatsapp_manual')),
    items JSONB DEFAULT '[]'::jsonb,
    notas_admin TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW())
);

-- =========================================================================
-- 6. TABLA: PUBLICIDAD, BANNERS Y CAMPAÑAS
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    subtitle TEXT,
    tag TEXT DEFAULT 'Campaña Oficial',
    btn_text TEXT DEFAULT 'Ver productos',
    link TEXT DEFAULT '#catalogo',
    img TEXT NOT NULL,
    active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW())
);

-- =========================================================================
-- 7. TABLA: CONFIGURACIÓN DEL VIAJE & ANUNCIOS SUPERIORES
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.trip_config (
    id INTEGER PRIMARY KEY DEFAULT 1,
    brand_name TEXT DEFAULT 'STORE BASS',
    admin_name TEXT DEFAULT 'Johan Tovar',
    phone TEXT DEFAULT '960 759 244',
    phone_digits TEXT DEFAULT '51960759244',
    date_ida TEXT DEFAULT '20 de Octubre',
    date_regreso TEXT DEFAULT '29 de Octubre',
    status TEXT DEFAULT 'Pedidos abiertos',
    announcements JSONB DEFAULT '[
        "Próximo viaje: voy el 20 de Octubre y regreso el 29 de Octubre",
        "Reserva ahora lo que llega en mi regreso",
        "Productos en stock disponibles en Lima"
    ]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW()),
    CONSTRAINT single_row_trip_config CHECK (id = 1)
);

-- =========================================================================
-- 8. TABLA: MONITOREO DE ENVÍOS (TRACKING COURIER)
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.shipping_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT UNIQUE NOT NULL, -- e.g. SB-89421-PE
    client TEXT NOT NULL,
    item TEXT NOT NULL,
    route TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('America/Lima', NOW())
);

-- =========================================================================
-- 9. FUNCIÓN ATÓMICA PARA CREAR TICKET CORRELATIVO CONSECUTIVO
-- Garantiza que nunca existan dos tickets con el mismo número bajo alta concurrencia
-- =========================================================================
CREATE OR REPLACE FUNCTION public.fn_create_ticket(
    p_origen TEXT,
    p_cliente TEXT,
    p_telefono TEXT,
    p_detalle TEXT,
    p_total NUMERIC,
    p_estado TEXT,
    p_tipo TEXT DEFAULT 'compra_lista',
    p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
    ticket_id UUID,
    ticket_code TEXT,
    correlativo INTEGER,
    fecha TEXT,
    cliente TEXT,
    telefono TEXT,
    total NUMERIC,
    estado TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_correlativo INTEGER;
    v_ticket_code TEXT;
    v_new_id UUID;
    v_fecha TEXT;
BEGIN
    -- 1. Obtener siguiente número correlativo atómico
    v_correlativo := nextval('public.storebass_ticket_seq');
    v_ticket_code := 'TK-' || v_correlativo::TEXT;
    v_fecha := TO_CHAR(TIMEZONE('America/Lima', NOW()), 'DD/MM/YYYY HH24:MI');

    -- 2. Insertar ticket
    INSERT INTO public.tickets (
        ticket_code,
        correlativo,
        origen,
        cliente,
        telefono,
        detalle,
        total,
        estado,
        tipo,
        items,
        created_at,
        updated_at
    ) VALUES (
        v_ticket_code,
        v_correlativo,
        p_origen,
        p_cliente,
        p_telefono,
        p_detalle,
        COALESCE(p_total, 0.00),
        COALESCE(p_estado, 'Pendiente'),
        COALESCE(p_tipo, 'compra_lista'),
        COALESCE(p_items, '[]'::jsonb),
        TIMEZONE('America/Lima', NOW()),
        TIMEZONE('America/Lima', NOW())
    )
    RETURNING id INTO v_new_id;

    -- 3. Retornar resultado estructurado
    RETURN QUERY
    SELECT 
        v_new_id,
        v_ticket_code,
        v_correlativo,
        v_fecha,
        p_cliente,
        p_telefono,
        COALESCE(p_total, 0.00),
        COALESCE(p_estado, 'Pendiente');
END;
$$;

-- =========================================================================
-- 10. POLÍTICAS DE SEGURIDAD (ROW LEVEL SECURITY - RLS)
-- =========================================================================
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipping_tracking ENABLE ROW LEVEL SECURITY;

-- CATEGORÍAS: Lectura pública; Escritura para usuarios autenticados y clave de servicio
CREATE POLICY "Categorias visibles para todos" ON public.categories
    FOR SELECT USING (true);

CREATE POLICY "Categorias modificables por administrador" ON public.categories
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- PRODUCTOS: Lectura pública; Escritura para administrador
CREATE POLICY "Productos visibles para todos" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Productos modificables por administrador" ON public.products
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- PUBLICIDAD: Lectura pública; Escritura para administrador
CREATE POLICY "Publicidad visible para todos" ON public.ads
    FOR SELECT USING (true);

CREATE POLICY "Publicidad modificable por administrador" ON public.ads
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- TICKETS: Inserción pública (clientes web); Lectura y gestión para administrador
CREATE POLICY "Clientes pueden crear tickets desde la web" ON public.tickets
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Tickets gestionables por administrador" ON public.tickets
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- TRIP CONFIG: Lectura pública; Escritura para administrador
CREATE POLICY "Configuracion visible para todos" ON public.trip_config
    FOR SELECT USING (true);

CREATE POLICY "Configuracion modificable por administrador" ON public.trip_config
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- SHIPPING TRACKING: Lectura pública; Escritura para administrador
CREATE POLICY "Tracking visible para todos" ON public.shipping_tracking
    FOR SELECT USING (true);

CREATE POLICY "Tracking modificable por administrador" ON public.shipping_tracking
    FOR ALL USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Permiso de ejecución pública para la función de creación de tickets
GRANT EXECUTE ON FUNCTION public.fn_create_ticket TO anon, authenticated, service_role;

-- =========================================================================
-- 11. STORAGE BUCKET (OPCIONAL: PARA IMÁGENES ALMACENADAS EN LA NUBE)
-- =========================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('storebass-media', 'storebass-media', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Archivos multimedia accesibles publicamente" ON storage.objects
    FOR SELECT USING (bucket_id = 'storebass-media');

CREATE POLICY "Subida de multimedia autorizada" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'storebass-media');

CREATE POLICY "Edicion de multimedia autorizada" ON storage.objects
    FOR UPDATE USING (bucket_id = 'storebass-media');

CREATE POLICY "Eliminacion de multimedia autorizada" ON storage.objects
    FOR DELETE USING (bucket_id = 'storebass-media');

-- =========================================================================
-- 12. DATOS INICIALES (SEED DATA)
-- =========================================================================

-- Configuración del Viaje
INSERT INTO public.trip_config (id, brand_name, admin_name, phone, phone_digits, date_ida, date_regreso, status, announcements)
VALUES (
    1,
    'STORE BASS',
    'Johan Tovar',
    '960 759 244',
    '51960759244',
    '20 de Octubre',
    '29 de Octubre',
    'Pedidos abiertos',
    '[
        "Próximo viaje: voy el 20 de Octubre y regreso el 29 de Octubre",
        "Reserva ahora lo que llega en mi regreso",
        "Productos en stock disponibles en Lima"
    ]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Categorías Iniciales
INSERT INTO public.categories (name, icon, description, active, display_order)
VALUES
    ('Perfumes', 'local_florist', 'Fragancias originales de marcas reconocidas de USA', true, 1),
    ('Belleza', 'spa', 'Maquillaje Sephora, cuidado facial y skincare', true, 2),
    ('Tecnología', 'devices', 'Gadgets, audio, accesorios y electrónica', true, 3),
    ('Apple', 'smartphone', 'iPhones, MacBooks, iPads, Apple Watch y AirPods', true, 4),
    ('Relojes', 'watch', 'Relojes analógicos, automáticos y deportivos', true, 5),
    ('Moda', 'checkroom', 'Ropa de marcas estadounidenses originales', true, 6),
    ('Calzado', 'footwear', 'Zapatillas Nike, Jordan, Adidas y calzado importado', true, 7),
    ('Suplementos', 'pill', 'Proteínas, vitaminas y suplementación deportiva', true, 8),
    ('Hogar', 'home', 'Cocina, decoración y gadgets para el hogar', true, 9),
    ('Mascotas', 'pets', 'Accesorios y productos importados para mascotas', true, 10),
    ('Autos', 'directions_car', 'Herramientas y accesorios automotrices', true, 11)
ON CONFLICT (name) DO NOTHING;

-- Productos Iniciales
INSERT INTO public.products (name, category, regular_price, price, delivery, img, active)
VALUES
    ('Apple MacBook Air 15" M3 (512GB SSD)', 'Apple', 6299.00, 5490.00, 'Llega en mi próximo regreso', 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80', true),
    ('Perfume Árabe Lattafa Khamrah Eau de Parfum 100ml', 'Perfumes', 280.00, 199.00, 'En stock en Lima', 'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=600&q=80', true),
    ('Sony WH-1000XM5 Audífonos ANC Cancelación Ruido', 'Tecnología', 1699.00, 1399.00, 'Llega en mi próximo regreso', 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80', true),
    ('Reloj Fossil Neutra Cronógrafo Cuero Marrón', 'Relojes', 699.00, 489.00, 'En stock en Lima', 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80', true),
    ('Parlante Inteligente Amazon Echo Spot 2024', 'Tecnología', 380.00, 289.00, 'En stock en Lima', 'https://images.unsplash.com/photo-1543512214-318c7553f230?auto=format&fit=crop&w=600&q=80', true),
    ('Dior Sauvage Eau de Parfum 100ml Original USA', 'Perfumes', 649.00, 529.00, 'Últimos cupos', 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=600&q=80', true);

-- Tickets Iniciales Correlativos
INSERT INTO public.tickets (ticket_code, correlativo, origen, cliente, telefono, detalle, total, estado, tipo)
VALUES
    ('TK-1001', 1001, 'Web', 'Manuel Carpio', '984123456', '1x Apple AirPods Pro 2da Gen USB-C', 949.00, 'Confirmado y pagado', 'compra_lista'),
    ('TK-1002', 1002, 'WhatsApp', 'Fiorella Wong', '991765432', '2x Perfume Lattafa Khamrah 100ml', 398.00, 'Comprado en USA', 'whatsapp_manual'),
    ('TK-1003', 1003, 'Web', 'Giancarlo Soto', '945998112', 'Cotización Link BestBuy: iPad Air M2 11"', 2450.00, 'Cotizado', 'cotizacion_links')
ON CONFLICT (ticket_code) DO NOTHING;

-- Publicidad y Banners Iniciales
INSERT INTO public.ads (title, subtitle, tag, btn_text, link, img, active)
VALUES
    (
        'Lanzamientos Apple USA Miami',
        'AirPods Pro 2, iPhone 16 Pro y MacBook Air M3 comprados directamente en Apple Store oficial.',
        'Especial Viaje',
        'Ver catálogo Apple',
        '#catalogo',
        'https://images.unsplash.com/photo-1510017803434-a899398421b3?auto=format&fit=crop&w=800&q=80',
        true
    ),
    (
        'Perfumes Árabes & Nicho Originales',
        'Lattafa Khamrah, Asad, Dior y Tom Ford con batch code verificado en tiendas oficiales de USA.',
        '100% Originales',
        'Explorar fragancias',
        '#catalogo',
        'https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=800&q=80',
        true
    ),
    (
        'Stanley Quencher 40oz FlowState',
        'Colores y ediciones exclusivas de USA (Target y Dick''s). Separa tu cupo con el 50%.',
        'Tendencia Viral',
        'Reservar ahora',
        '#catalogo',
        'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?auto=format&fit=crop&w=800&q=80',
        true
    );

-- Guías de Envío Iniciales
INSERT INTO public.shipping_tracking (code, client, item, route, status)
VALUES
    ('SB-89421-PE', 'Lucía Paredes', 'Apple Watch Series 10 Titanium', 'MIA ✈️ LIM', 'En Vuelo Internacional a Lima'),
    ('SB-74190-PE', 'Diego Arrieta', 'Sony WH-1000XM5 Black', 'Almacén Callao ➔ Surco', 'En Camioneta de Reparto'),
    ('SB-60142-PE', 'Karla Montes', 'Lattafa Khamrah & Asad Perfumes', 'Lima ➔ Arequipa (Shalom)', 'Entregado con Éxito'),
    ('SB-55912-PE', 'Rodrigo Vargas', 'Stanley Quencher H2.0 FlowState 40oz', 'Miami Hub Consolidation', 'Recibido en Hub Miami (USA)')
ON CONFLICT (code) DO NOTHING;
