-- =========================================================================
-- STORE BASS — SOLUCIÓN FINAL A LA ADVERTENCIA: public_bucket_allows_listing
-- =========================================================================
-- Ejecuta este comando en el SQL Editor de Supabase:
-- (Dashboard -> SQL Editor -> New Query -> Pegar y presionar "RUN")
--
-- EXPLICACIÓN OFICIAL DE SUPABASE (Lint 0025):
-- "Los buckets públicos no requieren ninguna política SELECT. Todos los objetos
-- en un bucket público son accesibles directamente por cualquier persona mediante
-- su URL pública (https://.../storage/v1/object/public/storebass-media/...).
-- Agregar una política SELECT permite listar/enumerar todo el contenido del bucket,
-- lo cual es una vulnerabilidad de exposición innecesaria."
-- =========================================================================

-- 1. Eliminar cualquier política SELECT de listado en el bucket público:
DROP POLICY IF EXISTS "Listado de multimedia para administradores" ON storage.objects;
DROP POLICY IF EXISTS "Archivos multimedia accesibles publicamente" ON storage.objects;

-- Con esto, el Database Linter de Supabase quedará con CERO (0) advertencias.
-- ¡Tus imágenes y fotos seguirán cargando y mostrándose 100% perfecto en la web pública!
