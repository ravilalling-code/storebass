# STORE BASS — Shopper & Courier 🇵🇪 ✈️ 🇺🇸

Landing page oficial y suite web para **STORE BASS (Shopper & Courier)**, tienda online peruana que vende artículos originales importados desde USA con envío a todo el Perú y precio final garantizado en Soles con aduanas e impuestos incluidos.

---

## 🚀 Cómo ejecutar y previsualizar en tu máquina

Tienes varias opciones sencillas para trabajar con esta web:

### Opción 1: Abrir directamente en el navegador (Sin instalar nada)
Haz doble clic sobre el archivo [index.html](file:///d:/TIENDA%20USA/index.html) en el Explorador de Windows o ábrelo directamente en Google Chrome / Microsoft Edge.

### Opción 2: Iniciar servidor local con npm
Abre la terminal en esta carpeta (`d:\TIENDA USA`) y ejecuta:
```bash
npm start
```
Luego abre tu navegador en [http://localhost:3000](http://localhost:3000).

---

## 🌟 Características Implementadas

1. **Modo Claro y Modo Oscuro integrados:**
   - Botón interactivo de cambio de tema (☀️ / 🌙) en el header.
   - Guarda tu preferencia en `localStorage`.

2. **100% Adaptativo (Responsive):**
   - Diseñado para pantallas de escritorio, laptops, tablets y smartphones (Mobile Touch-First).
   - Menú móvil táctil y carrusel de categorías deslizable horizontalmente.

3. **Las 7 secciones solicitadas en orden estricto:**
   - **1. Header fijo y translúcido (Glassmorphism):** Logotipo `Directo USA` con insignias binacionales 🇺🇸 ➔ 🇵🇪, enlaces de navegación (*Envíos, Preguntas, Reseñas, Rastreo*) y botón interactivo `Carrito (0)`.
   - **2. Hero Banner & Tarjeta "Así se arma tu precio":**
     - Titular: *"Compra en USA. Recíbelo en Perú con aduana incluida."*
     - Subtítulo explicativo, botones primario (*Ver productos*) y secundario (*Cotizar un link*).
     - Fila interactiva de chips de categorías (*Tecnología, Apple, Perfumes, Belleza, Relojes, Moda, Juguetes, Deportes, Hogar, Mascotas, Autos*). Al hacer clic en un chip, la tarjeta de precio actualiza en vivo el desglose en USD y PEN.
   - **3. Pricing / Modalidades de envío:**
     - Título: *"Elige qué tan rápido lo quieres"*.
     - 3 tarjetas con beneficios y botón: **Económico** (7–11 días), **Express** (5–8 días, tarjeta central destacada con badge *Más Elegido*) y **Entrega inmediata** (stock en Lima 24–48h).
   - **4. CTA Motivacional de alto contraste:**
     - *"Si existe en USA, te lo traemos."*
     - Input funcional para pegar links de tiendas oficiales americanas con retroalimentación instantánea.
   - **5. Preguntas Frecuentes (FAQ) + Asistente Virtual:**
     - Acordeón interactivo con 5 preguntas clave sobre SUNAT, tiempos de entrega, originalidad y tracking.
     - Asistente inteligente con caja de consulta en vivo que responde dudas frecuentes sobre laptops, provincias, métodos de pago y aranceles.
   - **6. Reseñas Verificadas:**
     - 3 testimonios con calificación de 5 estrellas de compradores en **Arequipa**, **Lima** y **Trujillo**.
   - **7. Footer Corporativo:**
     - Logotipo, RUC 20609876543, enlace directo a WhatsApp oficial (+51 987 654 321), columnas organizadas y enlace al **Libro de Reclamaciones**.

---

## 📄 Páginas Disponibles en este Proyecto

1. **[index.html](file:///d:/TIENDA%20USA/index.html)** — **Landing Page Oficial**
   - Header translúcido con glassmorphism y cambio de tema (☀️ / 🌙).
   - Hero banner, chips de categorías y tarjeta interactiva *"Así se arma tu precio"*.
   - 3 modalidades de envío con pricing (*Económico, Express, Entrega Inmediata*).
   - CTA motivacional con cotizador en vivo.
   - Acordeón de 5 preguntas frecuentes y asistente virtual interactivo.
   - Reseñas de clientes verificados (Arequipa, Lima, Trujillo).
   - Footer corporativo con RUC y Libro de Reclamaciones.

2. **[tracking.html](file:///d:/TIENDA%20USA/tracking.html)** — **Rastreo en Vivo (Live Tracking)**
   - Buscador por código de guía (con códigos de prueba como `DUSA-89421-PE` y `DUSA-74190-PE`).
   - Radar y telemetría de vuelo en tiempo real (Miami MIA ✈️ Lima LIM).
   - Stepper cronológico con los 5 hitos logísticos:
     1. Compra e invoice verificado en tienda USA
     2. Almacén Directo USA Miami Hub con pesaje de 1.8 kg
     3. Vuelo internacional en ruta con hora de aterrizaje
     4. Desaduanaje express SUNAT garantizado sin trámites (S/ 0 extra)
     5. En reparto final a domicilio
   - Transparencia aduanera (AWB, aranceles pagados S/ 0 extra, factura original descargable).

3. **[stock-lima.html](file:///d:/TIENDA%20USA/stock-lima.html)** — **Catálogo con Stock en Lima (Entrega 24-48h)**
   - Artículos 100% originales ya nacionalizados listos para entrega inmediata.
   - Buscador en tiempo real y filtros por categoría (*Apple, Audio & Tech, Perfumes & Belleza, Gaming, Termos Stanley, Calzado Nike*).
   - 8 productos con stock local verificado, precio en Soles y USD, y botón de compra instantánea.
   - Información de despacho Same-Day (2 a 4 horas) para Lima Metropolitana y Olva Courier para provincias.

---

## 🎨 Diseños en Google Stitch
Este proyecto fue modelado en **Google Stitch** bajo el ID `7735971908505365462`:
- **Desktop Claro:** Pantalla `262627dccfc4499a9f3c802ed0ef3b71`
- **Desktop Oscuro:** Pantalla `87086d5e96a844c9a386b76d08b38710`
- **Móvil Claro:** Pantalla `a38b2e9b87bd49008103509ecf2ab534`
- **Móvil Oscuro:** Pantalla `674d65ce94344985bcb97133b6f77d0e`
- **Rastreo en Vivo (Live Tracking):** Pantalla `2551f2f65f714639b9c0a667ddb90655`
- **Catálogo Stock en Lima:** Pantalla `5a7da6b0fb764400b56591f8e6d447c9`
