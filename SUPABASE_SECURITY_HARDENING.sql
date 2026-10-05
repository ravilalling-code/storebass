-- =========================================================================
-- STORE BASS - SUPABASE SECURITY HARDENING & RLS REMEDIATION
-- Versión: 3.0 Enterprise Security
-- Administrador: Johan Tovar (STORE BASS Perú)
-- =========================================================================

-- -------------------------------------------------------------------------
-- PASO 1: FUNCIÓN DE VERIFICACIÓN DE ADMINISTRADOR (SECURITY DEFINER)
-- -------------------------------------------------------------------------
-- Esta función centraliza la autorización. Solo usuarios autenticados con
-- el correo oficial de administración o la clave interna service_role
-- tendrán privilegios de mutación.
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    auth.role() = 'service_role' OR
    (auth.role() = 'authenticated' AND (
      auth.jwt() ->> 'email' ILIKE '%@storebass.pe' OR
      auth.jwt() ->> 'email' IN (
        'johan@storebass.pe',
        'admin@storebass.pe',
        'johan.storebass@gmail.com'
      )
    )),
    false
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- PASO 2: ACTIVAR Y ENDURECER ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS
-- -------------------------------------------------------------------------

ALTER TABLE IF EXISTS public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.trip_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shipping_tracking ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas permisivas
DROP POLICY IF EXISTS "Categorias visibles para todos" ON public.categories;
DROP POLICY IF EXISTS "Categorias modificables por administrador" ON public.categories;
DROP POLICY IF EXISTS "Productos visibles para todos" ON public.products;
DROP POLICY IF EXISTS "Productos modificables por administrador" ON public.products;
DROP POLICY IF EXISTS "Publicidad visible para todos" ON public.ads;
DROP POLICY IF EXISTS "Publicidad modificable por administrador" ON public.ads;
DROP POLICY IF EXISTS "Configuracion visible para todos" ON public.trip_config;
DROP POLICY IF EXISTS "Configuracion modificable por administrador" ON public.trip_config;
DROP POLICY IF EXISTS "Clientes pueden crear tickets desde la web" ON public.tickets;
DROP POLICY IF EXISTS "Tickets gestionables por administrador" ON public.tickets;
DROP POLICY IF EXISTS "Tracking visible para todos" ON public.shipping_tracking;
DROP POLICY IF EXISTS "Tracking modificable por administrador" ON public.shipping_tracking;

-- 1. CATEGORÍAS
-- Lectura pública para el catálogo web
CREATE POLICY "Categorias - Lectura publica"
    ON public.categories FOR SELECT
    USING (true);

-- Escritura y edición exclusivamente para el administrador
CREATE POLICY "Categorias - Gestion admin estricta"
    ON public.categories FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 2. PRODUCTOS
-- Lectura pública para visitantes
CREATE POLICY "Productos - Lectura publica"
    ON public.products FOR SELECT
    USING (true);

-- Edición, alta y baja exclusivamente para el administrador
CREATE POLICY "Productos - Gestion admin estricta"
    ON public.products FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 3. PUBLICIDAD / TENDENCIAS (ADS)
-- Lectura pública del carrusel de novedades
CREATE POLICY "Ads - Lectura publica"
    ON public.ads FOR SELECT
    USING (true);

-- Gestión del carrusel exclusiva del administrador
CREATE POLICY "Ads - Gestion admin estricta"
    ON public.ads FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 4. CONFIGURACIÓN DEL VIAJE (TRIP CONFIG)
-- Lectura pública de fechas de vuelo y tasas
CREATE POLICY "TripConfig - Lectura publica"
    ON public.trip_config FOR SELECT
    USING (true);

-- Modificación exclusiva del administrador
CREATE POLICY "TripConfig - Modificacion admin estricta"
    ON public.trip_config FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 5. TICKETS DE COMPRA
-- Los clientes web pueden registrar su solicitud con campos validados
CREATE POLICY "Tickets - Insercion publica con validacion"
    ON public.tickets FOR INSERT
    WITH CHECK (
        cliente IS NOT NULL
        AND length(trim(cliente)) >= 2
        AND telefono IS NOT NULL
        AND length(trim(telefono)) >= 6
        AND COALESCE(total, 0) >= 0
    );

-- LECTURA Y ADMINISTRACIÓN: Solo el Administrador puede listar y modificar tickets.
-- Esto protege completamente los datos personales (nombres completos, teléfonos y pedidos).
CREATE POLICY "Tickets - Gestion y lectura exclusiva admin"
    ON public.tickets FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- 6. SHIPPING TRACKING (PROTEGIDA CONTRA EXPOSICIÓN)
-- Ningún usuario no autorizado puede listar la tabla shipping_tracking completa
CREATE POLICY "ShippingTracking - Gestion exclusiva admin"
    ON public.shipping_tracking FOR ALL
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- -------------------------------------------------------------------------
-- PASO 3: FUNCIÓN SEGURA DE CONSULTA DE RASTREO (TELEMETRÍA EN VIVO)
-- -------------------------------------------------------------------------
-- Permite al cliente verificar el estado de su propio pedido sin exponer
-- la base de datos completa ni los datos sensibles de otros compradores.
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_track_order(
    p_code TEXT,
    p_phone TEXT DEFAULT NULL
)
RETURNS TABLE (
    ticket_code TEXT,
    estado TEXT,
    detalle TEXT,
    cliente_primer_nombre TEXT,
    fecha TEXT,
    tipo TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    clean_code TEXT;
BEGIN
    clean_code := upper(replace(trim(p_code), '#', ''));

    RETURN QUERY
    SELECT 
        t.ticket_code,
        t.estado,
        t.detalle,
        -- Protección de privacidad: solo se muestra el primer nombre
        split_part(trim(t.cliente), ' ', 1) as cliente_primer_nombre,
        TO_CHAR(t.created_at, 'DD/MM/YYYY') as fecha,
        t.tipo
    FROM public.tickets t
    WHERE (
        upper(replace(t.ticket_code, '#', '')) = clean_code
        OR (p_phone IS NOT NULL AND length(trim(p_phone)) >= 4 AND t.telefono ILIKE '%' || trim(p_phone))
    )
    ORDER BY t.created_at DESC
    LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_track_order TO anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- PASO 4: FUNCIÓN ATÓMICA GENERADORA DE TICKETS (CONSECUTIVO BLINDADO)
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_create_ticket(
    p_origen TEXT DEFAULT 'Web',
    p_cliente TEXT DEFAULT '',
    p_telefono TEXT DEFAULT '',
    p_detalle TEXT DEFAULT '',
    p_total NUMERIC DEFAULT 0.00,
    p_estado TEXT DEFAULT 'Pendiente',
    p_tipo TEXT DEFAULT 'compra_lista',
    p_items JSONB DEFAULT '[]'::jsonb
)
RETURNS TABLE (
    id UUID,
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
SET search_path = public
AS $$
DECLARE
    v_correlativo INTEGER;
    v_ticket_code TEXT;
    v_new_id UUID;
    v_fecha TEXT;
BEGIN
    IF p_cliente IS NULL OR length(trim(p_cliente)) < 2 THEN
        RAISE EXCEPTION 'El nombre del cliente es obligatorio.';
    END IF;

    IF p_telefono IS NULL OR length(trim(p_telefono)) < 6 THEN
        RAISE EXCEPTION 'El teléfono es obligatorio para contactar la entrega.';
    END IF;

    -- Obtener siguiente correlativo único atómico
    v_correlativo := nextval('public.storebass_ticket_seq');
    v_ticket_code := 'TK-' || v_correlativo::TEXT;
    v_fecha := TO_CHAR(TIMEZONE('America/Lima', NOW()), 'DD/MM/YYYY HH24:MI');

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
        COALESCE(p_origen, 'Web'),
        trim(p_cliente),
        trim(p_telefono),
        p_detalle,
        COALESCE(p_total, 0.00),
        COALESCE(p_estado, 'Pendiente'),
        COALESCE(p_tipo, 'compra_lista'),
        COALESCE(p_items, '[]'::jsonb),
        TIMEZONE('America/Lima', NOW()),
        TIMEZONE('America/Lima', NOW())
    )
    RETURNING public.tickets.id INTO v_new_id;

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

GRANT EXECUTE ON FUNCTION public.fn_create_ticket TO anon, authenticated, service_role;

-- -------------------------------------------------------------------------
-- PASO 5: SEGURIDAD DEL STORAGE BUCKET (storebass-media)
-- -------------------------------------------------------------------------
-- Eliminar políticas públicas permisivas de escritura en el bucket
-- -------------------------------------------------------------------------

DROP POLICY IF EXISTS "Subida de multimedia autorizada" ON storage.objects;
DROP POLICY IF EXISTS "Edicion de multimedia autorizada" ON storage.objects;
DROP POLICY IF EXISTS "Eliminacion de multimedia autorizada" ON storage.objects;
DROP POLICY IF EXISTS "Subida admin storebass" ON storage.objects;
DROP POLICY IF EXISTS "Edicion admin storebass" ON storage.objects;
DROP POLICY IF EXISTS "Eliminacion admin storebass" ON storage.objects;

-- Subida permitida exclusivamente al administrador autenticado
CREATE POLICY "Subida admin storebass"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'storebass-media'
        AND public.is_admin()
    );

-- Modificación permitida exclusivamente al administrador
CREATE POLICY "Edicion admin storebass"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'storebass-media'
        AND public.is_admin()
    );

-- Eliminación permitida exclusivamente al administrador
CREATE POLICY "Eliminacion admin storebass"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'storebass-media'
        AND public.is_admin()
    );

-- =========================================================================
-- GUÍA OBLIGATORIA EN SUPABASE DASHBOARD:
-- 1. Ve a: Authentication -> Providers -> Email
-- 2. Desmarca: "Allow new users to sign up"
--    (Esto bloquea que cualquier extraño cree cuentas con la anon key).
-- 3. Crea tu usuario oficial en Authentication -> Users -> Add User:
--    Email: admin@storebass.pe (o johan@storebass.pe)
--    Password: una contraseña segura de tu elección.
-- =========================================================================
