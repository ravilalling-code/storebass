# STORE BASS — Shopper & Courier 🇵🇪 ✈️ 🇺🇸

Web oficial y suite de comercio electrónico para **STORE BASS**, personal shopper y courier que viaja personalmente a Estados Unidos para traer productos 100% originales a Perú con precio final en Soles, aduanas incluidas y fecha de entrega garantizada.

Construido con **Next.js (App Router)**, **TypeScript**, **Tailwind CSS 4** y conectado a **Supabase**.

---

## 🏗️ Estructura del Proyecto

```text
TIENDA USA/
├── public/                     # Recursos estáticos públicos (logos, imágenes)
│   ├── Storebass.jpg
│   └── StoreBass/
├── src/
│   ├── app/                    # Rutas de Next.js 15 App Router
│   │   ├── layout.tsx          # Layout raíz con fuentes, temas y providers
│   │   ├── globals.css         # Estilos globales y tokens Tailwind CSS 4
│   │   ├── page.tsx            # Página de inicio completa
│   │   ├── admin/page.tsx      # Panel de gestión y CRM de Johan Tovar
│   │   ├── stock-lima/page.tsx # Catálogo de entrega inmediata (24-48h)
│   │   └── tracking/page.tsx   # Rastreo en vivo Miami ➔ Lima con telemetría
│   ├── components/
│   │   ├── cart/               # Carrito deslizable y modal de ticket
│   │   ├── home/               # Secciones de la página principal
│   │   ├── layout/             # Header, Footer, AnnouncementBar, Navegación
│   │   ├── providers/          # Envoltorios de contexto cliente
│   │   └── ui/                 # Notificaciones y componentes base
│   ├── context/                # Estados globales (CartContext, ThemeContext)
│   ├── data/                   # Catálogo inicial de productos y datos base
│   └── lib/                    # Tipos TypeScript y clientes de Supabase
├── .env.example                # Plantilla de variables de entorno
├── next.config.mjs             # Configuración oficial de Next.js 15
├── postcss.config.mjs          # Integración PostCSS + Tailwind CSS 4
├── supabase_schema.sql         # Esquema de referencia de Supabase (solo lectura)
└── tsconfig.json               # Configuración TypeScript estricta
```

---

## 🚀 Ejecución en Desarrollo y Producción

### 1. Requisitos
- Node.js 18.18+ o Node.js 20+
- npm, pnpm o yarn

### 2. Comandos Principales
```bash
# Instalar dependencias
npm install

# Iniciar servidor local de desarrollo
npm run dev

# Compilar para producción (validación de TypeScript y páginas estáticas)
npm run build

# Iniciar en modo producción
npm start
```

---

## 🌐 Rutas de la Aplicación

- `/` : **Tienda Principal:** Catálogo general, ofertas, cotizador multi-link, seguimiento, preguntas frecuentes y reseñas.
- `/stock-lima` : **Stock Inmediato en Lima:** Artículos disponibles para entrega en 24 a 48h con compra directa.
- `/tracking` : **Rastreo en Vivo:** Telemetría de vuelo (AA-917), radar satelital e historial de hitos aduaneros.
- `/admin` : **Portal de Gestión:** Métricas, inventario, categorías, monitoreo de guías de envío y tickets correlativos (login: `admin` / `adminpj2026`).

---

## 🔒 Regla del Backend

El backend en Supabase está intacto y funcionando. El frontend consume las tablas existentes (`products`, `tickets`, `categories`, `ads`, `trip_config`) y la función RPC atómica `fn_create_ticket` con tolerancia a fallos offline en `localStorage`.
