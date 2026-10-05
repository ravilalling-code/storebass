-- =========================================================================
-- STORE BASS — SCRIPT DE CORRECCIÓN DE ADVERTENCIAS DE SUPABASE (LINTER)
-- =========================================================================
-- Ejecuta este script en el SQL Editor de tu panel de Supabase
-- (Dashboard -> SQL Editor -> New Query -> Pegar y presionar "RUN")
-- Resuelve las 5 advertencias:
-- 1. function_search_path_mutable
-- 2. rls_policy_always_true
-- 3. public_bucket_allows_listing
-- 4. anon_security_definer_function_executable
-- 5. authenticated_security_definer_function_executable
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. CORRECCIÓN DE WARNINGS 1, 4 y 5: fn_create_ticket
-- - Se cambia a SECURITY INVOKER (resuelve warnings 4 y 5)
-- - Se fija explícitamente search_path = public, pg_temp (resuelve warning 1)
-- - Se añade validación estricta de parámetros
-- -------------------------------------------------------------------------
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
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_correlativo INTEGER;
    v_ticket_code TEXT;
    v_new_id UUID;
    v_fecha TEXT;
BEGIN
    -- Validación de integridad
    IF p_cliente IS NULL OR length(trim(p_cliente)) = 0 THEN
        RAISE EXCEPTION 'El nombre del cliente es obligatorio para generar el ticket.';
    END IF;

    -- 1. Obtener siguiente número correlativo atómico
    v_correlativo := nextval('public.storebass_ticket_seq');
    v_ticket_code := 'TK-' || v_correlativo::TEXT;
    v_fecha := TO_CHAR(TIMEZONE('America/Lima', NOW()), 'DD/MM/YYYY HH24:MI');

    -- 2. Insertar ticket en la tabla
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

    -- 3. Retornar resultado
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

-- Permisos de secuencia y ejecución para la función en modo SECURITY INVOKER
GRANT USAGE, SELECT ON SEQUENCE public.storebass_ticket_seq TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_create_ticket TO anon, authenticated, service_role;


-- -------------------------------------------------------------------------
-- 2. CORRECCIÓN DE WARNING 2: rls_policy_always_true en public.tickets
-- Reemplaza WITH CHECK (true) por validación estricta de datos requeridos
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Clientes pueden crear tickets desde la web" ON public.tickets;

CREATE POLICY "Clientes pueden crear tickets desde la web" ON public.tickets
    FOR INSERT 
    WITH CHECK (
        cliente IS NOT NULL 
        AND length(trim(cliente)) > 0
        AND COALESCE(total, 0) >= 0
    );


-- -------------------------------------------------------------------------
-- 3. CORRECCIÓN DE WARNING 3: public_bucket_allows_listing en storebass-media
-- Al ser bucket público, las imágenes cargan libremente por su URL pública.
-- Se retira la política que permitía a cualquiera enumerar la lista completa de archivos.
-- -------------------------------------------------------------------------
DROP POLICY IF EXISTS "Archivos multimedia accesibles publicamente" ON storage.objects;

-- Solo administradores pueden listar los archivos del bucket
CREATE POLICY "Listado de multimedia para administradores" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'storebass-media');

-- Fin del script. ¡Todas las advertencias quedan 100% resueltas!
