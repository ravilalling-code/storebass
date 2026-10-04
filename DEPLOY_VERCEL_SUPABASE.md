# Guía de Despliegue: STORE BASS con Supabase & Vercel

Esta guía detalla los pasos para conectar la base de datos PostgreSQL en **Supabase** y desplegar la tienda online con su CRM en **Vercel** para producción.

---

## 🚀 Paso 1: Configurar Supabase (PostgreSQL en la Nube)

1. Ingresa a [supabase.com](https://supabase.com) e inicia sesión (o crea una cuenta gratuita).
2. Haz clic en **"New Project"**:
   - **Name:** `store-bass-db`
   - **Database Password:** Crea una contraseña segura y anótala.
   - **Region:** Selecciona la más cercana (ej. `South America (São Paulo)` o `East US`).
3. Una vez creado el proyecto, dirígete al menú lateral izquierdo y haz clic en **"SQL Editor"**.
4. Haz clic en **"New query"**, abre el archivo [`supabase_schema.sql`](supabase_schema.sql), copia todo su contenido, pégalo en el editor de Supabase y presiona **"Run"** (o `Ctrl + Enter`).
   - Esto creará automáticamente las tablas: `categories`, `products`, `tickets`, `ads`, `trip_config`, `shipping_tracking`.
   - Creará la secuencia correlativa consecutiva `storebass_ticket_seq`.
   - Creará la función atómica concurrente `fn_create_ticket(...)`.
   - Configurará las políticas de seguridad **Row Level Security (RLS)** y el bucket `storebass-media`.
   - Cargará los datos iniciales y de prueba.
5. Ve a **Project Settings** (el ícono de engranaje) ➔ **API** y copia dos valores:
   - **Project URL** (ej: `https://xyzcompany.supabase.co`)
   - **Project API Keys ➔ `anon` `public`** (la clave que empieza con `eyJhbGci...`)

---

## ⚡ Paso 2: Desplegar en Vercel

El proyecto ya cuenta con el archivo de configuración [`vercel.json`](vercel.json) con rutas limpias y reglas de seguridad.

### Opción A: Vercel Dashboard (Recomendada con GitHub)
1. Sube tu carpeta del proyecto a un repositorio de GitHub (público o privado).
2. Ve a [vercel.com/new](https://vercel.com/new) e importa tu repositorio.
3. En la sección **Environment Variables**, añade:
   - `SUPABASE_URL`: Tu Project URL de Supabase.
   - `SUPABASE_ANON_KEY`: Tu clave anónima pública de Supabase.
4. Haz clic en **"Deploy"**. En 30 segundos tu tienda estará activa con SSL HTTPS gratuito y CDN global.

### Opción B: Vercel CLI (Línea de Comandos)
Desde la terminal en la carpeta del proyecto:
```bash
npx vercel
```
Sigue las instrucciones en pantalla y luego para producción ejecuta:
```bash
npx vercel --prod
```

---

## 🔐 Paso 3: Conectar el CRM de Johan Tovar con Supabase

Puedes vincular Supabase directamente desde el panel administrativo:

1. Entra a tu panel administrativo en Vercel:
   - En Vercel: `https://storebass.vercel.app/admin.html` (o tu dominio asignado por Vercel)
2. Inicia sesión en modo administrador:
   - Usuario: `admin`
   - Contraseña: `adminpj2026`
3. En el menú lateral, haz clic en **Ajustes & Viajes**.
4. Desplázate a la tarjeta **"Base de Datos Cloud (Supabase PostgreSQL)"**:
   - Pega tu **Supabase Project URL**.
   - Pega tu **Supabase Anon Public Key**.
   - Haz clic en **"Probar y Conectar Supabase"**. Verás la insignia cambiar a `🟢 Conectado a Supabase Cloud`.
   - Haz clic en **"Migrar Datos Locales a Supabase"** para transferir cualquier producto, categoría, publicidad o ticket creado localmente hacia la nube.

---

## 🔗 Estructura de Rutas en Vercel

Gracias a [`vercel.json`](vercel.json), las URLs se sirven limpias:

| Ruta | Descripción |
| :--- | :--- |
| `/` | Tienda Pública STORE BASS (Catálogo, Viajes, Cotizador por Link y Banners) |
| `/admin` | Panel Administrador & CRM Central de Johan Tovar |
| `/tracking` | Módulo de Monitoreo de Guías y Envíos Miami ➔ Lima |
| `/stock` | Catálogo de Productos con Stock Inmediato en Lima |
| `/Storebass.jpg` | Logo oficial optimizado con caché inmutable |

---

## 🛡️ Respaldo y Funcionamiento Offline

El motor [`supabase-client.js`](supabase-client.js) opera con arquitectura híbrida:
- Si Supabase está conectado, sincroniza en tiempo real contra PostgreSQL.
- Si no hay conexión o no se han configurado credenciales todavía, opera de forma 100% autónoma en `localStorage` sin romperse nunca.
- Los tickets correlativos (`TK-1004`, `TK-1005`...) se mantienen correlativos tanto en la web como en WhatsApp.
