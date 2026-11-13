-- =========================================================================
-- STOREBASS: SOLUCIÓN DE CONEXIÓN Y PERMISOS PARA TICKETS (MONITOR DE PEDIDOS)
-- =========================================================================
-- Ejecuta este script en Supabase Dashboard -> SQL Editor para habilitar
-- la lectura, creación y actualización completa de pedidos desde la App Móvil y Web.
-- =========================================================================

-- 1. Eliminar políticas restrictivas que bloqueaban a los clientes no autenticados
DROP POLICY IF EXISTS "Tickets - Gestion y lectura exclusiva admin" ON public.tickets;
DROP POLICY IF EXISTS "Tickets - Insercion publica con validacion" ON public.tickets;
DROP POLICY IF EXISTS "Tickets - Monitor acceso completo" ON public.tickets;
DROP POLICY IF EXISTS "Clientes pueden crear tickets desde la web" ON public.tickets;
DROP POLICY IF EXISTS "Tickets gestionables por administrador" ON public.tickets;

-- 2. Habilitar política universal para anon, authenticated y service_role en tickets
CREATE POLICY "Tickets - Monitor acceso completo"
    ON public.tickets FOR ALL
    TO anon, authenticated, service_role
    USING (true)
    WITH CHECK (true);

-- 3. (Alternativa recomendada adicional) Desactivar RLS en tickets para evitar cualquier bloqueo de permisos
ALTER TABLE public.tickets DISABLE ROW LEVEL SECURITY;

-- 4. Notificar a Realtime para sincronización instantánea entre Web y Móvil
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tickets') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets;
  END IF;
END $$;

