# STORE BASS — Shopper & Courier 🇵🇪 ✈️ 🇺🇸

Web oficial y plataforma de comercio electrónico de **STORE BASS**, personal shopper y courier que viaja personalmente a Estados Unidos para comprar y traer artículos 100% originales a Perú con precio final garantizado en Soles, flete y trámites aduaneros incluidos.

Construido con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS 4** y conectado a **Supabase** (Auth, RLS, Storage & Base de Datos PostgreSQL en tiempo real).

---

## 🏗️ Arquitectura del Proyecto

```text
TIENDA USA/
├── public/                         # Recursos estáticos públicos optimizados
│   └── Storebass.jpg               # Logo oficial corporativo
├── src/
│   ├── app/                        # Next.js App Router (Rutas limpias)
│   │   ├── layout.tsx              # Layout raíz con metadata, fonts y theme provider
│   │   ├── globals.css             # Directivas Tailwind CSS 4 y micro-animaciones
│   │   ├── page.tsx                # Landing page principal completa
│   │   ├── admin/page.tsx          # Panel de Gestión & CRM de Johan Tovar (Protegido)
│   │   ├── crm/page.tsx            # Acceso directo al CRM
│   │   ├── stock-lima/page.tsx     # Catálogo con entrega inmediata (24-48h)
│   │   └── tracking/page.tsx       # Telemetría de rastreo Miami ➔ Lima en vivo
│   ├── components/
│   │   ├── assistant/              # Asistente virtual de compras interactivas
│   │   ├── cart/                   # Carrito deslizable y modal de ticket correlativo
│   │   ├── home/                   # Componentes modulares del landing
│   │   │   ├── CatalogSection.tsx  # Catálogo reactivo conectado a Supabase Cloud
│   │   │   ├── FlightScheduleBanner.tsx # Fechas dinámicas de viaje
│   │   │   ├── HeroBanner.tsx      # Presentación y showcase "Voy a USA"
│   │   │   ├── TrendsCarousel.tsx  # Carrusel dinámico de novedades y tendencias
│   │   │   └── TrackingPreview.tsx # Consulta rápida de pedidos en vivo
│   │   ├── layout/                 # Header, Footer, AnnouncementBar, BottomNav
│   │   ├── providers/              # Theme & Cart Providers
│   │   └── ui/                     # Toasts, iconos y utilidades visuales
│   ├── context/                    # Contextos globales (CartContext, ThemeContext)
│   ├── data/                       # Catálogo y configuración base de respaldo
│   ├── lib/
│   │   ├── constants.ts            # Teléfono WhatsApp y constantes centralizadas
│   │   ├── types.ts                # Interfaces TypeScript estrictas
│   │   └── supabase/               # Clientes Supabase SSR (Browser & Server)
│   └── middleware.ts               # Protección perimetral de rutas administrativas
├── .env.example                    # Plantilla de variables de entorno seguras
├── SUPABASE_SECURITY_HARDENING.sql # Script de blindaje RLS y funciones SQL
├── supabase_schema.sql             # Esquema DDL maestro de la base de datos
├── next.config.mjs                 # Configuración de Next.js
└── tsconfig.json                   # Configuración estricta de TypeScript
```

---

## 🛡️ Seguridad y Autenticación

1. **Supabase Auth Nativo con Cookies Seguras**:
   - Acceso al panel `/admin` y `/crm` autenticado con Email + Password.
   - Cero contraseñas o tokens sensibles en el código fuente del cliente.
   - La sesión se gestiona con `@supabase/ssr` vía cookies `httpOnly`, impidiendo la manipulación de credenciales desde las herramientas del navegador.
2. **Protección Perimetral con `middleware.ts`**:
   - Cada solicitud a rutas administrativas es validada en el servidor Next.js antes de procesar el contenido.
3. **Row Level Security (RLS) Endurecido**:
   - Mutaciones (`INSERT`, `UPDATE`, `DELETE`) en tablas críticas (`products`, `categories`, `ads`, `trip_config`, `storage.objects`) restringidas exclusivamente al correo del administrador autenticado mediante la función `public.is_admin()`.
   - Consulta de rastreo protegida mediante la función `public.fn_track_order` para impedir la extracción masiva de datos personales o teléfonos de clientes.

---

## 🚀 Despliegue en Vercel & Supabase

### 1. Variables de Entorno en Vercel
En la configuración del proyecto en **Vercel** (`Settings` ➔ `Environment Variables`), configura:

| Variable | Descripción | Ejemplo / Valor |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave anónima pública de Supabase | `eyJhbGci...` |
| `NEXT_PUBLIC_ADMIN_NAME` | Nombre del Shopper Administrador | `Johan Tovar` |
| `NEXT_PUBLIC_WHATSAPP_PHONE` | Número de WhatsApp oficial | `51960759244` |

### 2. Base de Datos Supabase
Ejecuta en el **SQL Editor** de Supabase:
1. `supabase_schema.sql` (creación de tablas, secuencias y columnas).
2. `SUPABASE_SECURITY_HARDENING.sql` (activación de RLS, funciones seguras y políticas administrativas).

Desactiva el registro público de nuevos usuarios en:
- **Authentication** ➔ **Providers** ➔ **Email** ➔ Desmarcar *"Allow new users to sign up"*.

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción (Validación TypeScript y SSG)
npm run build

# Iniciar servidor de producción local
npm start
```

---

## 📦 Licencia & Autoría

Desarrollado para **STORE BASS Perú**. Todos los derechos reservados.
Shopper y Courier: **Johan Tovar**.
