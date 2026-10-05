# Despliegue en Vercel & Conexión con Supabase — Next.js 15

Esta guía explica detalladamente cómo sincronizar la nueva versión de **STORE BASS** (migrada a Next.js 15 + TypeScript + Tailwind 4) en **GitHub**, **Vercel** y **Supabase**.

---

## 1. Estado Actual de la Migración

- **Frontend:** 100% migrado a Next.js 15 (App Router). Probado localmente con `npm run build` exitoso (código de salida 0).
- **Backend (Supabase):** Intacto y funcionando. Consume las tablas existentes (`products`, `tickets`, `categories`, `ads`, `trip_config`) y el RPC `fn_create_ticket`.
- **Rutas limpias de Next.js:**
  - `/` : Tienda principal
  - `/admin` : Panel de gestión de Johan Tovar
  - `/stock-lima` : Stock inmediato 24-48h
  - `/tracking` : Rastreo en vivo de envíos

---

## 2. Actualizar en GitHub (Paso fundamental para que Vercel actualice)

Vercel está vinculado a tu repositorio de GitHub `https://github.com/ravilalling-code/storebass.git`. Para que Vercel despliegue la nueva versión, debes subir los cambios con estos comandos:

```bash
# 1. Agregar todos los archivos migrados y registrar los eliminados
git add -A

# 2. Crear el commit de la migración
git commit -m "feat(migration): migrar frontend a Next.js 15 + TypeScript + Tailwind CSS 4"

# 3. Subir los cambios a GitHub
git push origin main
```

---

## 3. Despliegue Automático en Vercel

Tan pronto como hagas el `git push origin main`:
1. Vercel detectará el commit automáticamente.
2. Vercel identificará que ahora es un proyecto **Next.js 15**.
3. Ejecutará automáticamente `npm run build` y generará las páginas estáticas optimizadas.
4. Tu sitio web cambiará de inmediato a la nueva versión sin tiempo de inactividad.

### Variables de Entorno en Vercel:
En tu proyecto de Vercel (**Settings ➔ Environment Variables**), asegúrate de tener configuradas:
- `NEXT_PUBLIC_SUPABASE_URL`: `https://iolvevkovlogbsluqkwe.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlvbHZldmtvdmxvZ2JzbHVxa3dlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTExNTM2NTIsImV4cCI6MjEwNjcyOTY1Mn0.2bMKVlFx1SNCOEWlZ8vtgI-iklMDUo2nhAWl-KccBT4`
- `NEXT_PUBLIC_ADMIN_NAME`: `Johan Tovar`
- `NEXT_PUBLIC_WHATSAPP_PHONE`: `51960759244`

---

## 4. Verificación de Supabase

El backend no requiere ninguna modificación:
- Tablas utilizadas: `tickets`, `products`, `categories`, `ads`, `trip_config`.
- Función RPC: `fn_create_ticket`.
- En caso de que la conexión a Supabase falle o no haya internet, la aplicación cuenta con fallback automático a `localStorage` para garantizar que la tienda y el carrito nunca dejen de funcionar.
