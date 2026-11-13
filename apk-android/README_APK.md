# STORE BASS — Generador de APK Android (Monitor de Pedidos)

Esta carpeta contiene el proyecto nativo Android completo para compilar el archivo **`.apk`** de **StoreBass Monitor de Pedidos**, con soporte de WebView inmersivo, sincronización en tiempo real con Supabase y modo offline.

---

### Opción 1: Descarga Automática del APK desde GitHub Actions (Recomendada - ¡1 Clic!)

Dado que tu repositorio está conectado a GitHub (`https://github.com/ravilalling-code/storebass`), hemos configurado un flujo de integración continua (**GitHub Actions**) que compila el APK en los servidores de GitHub con el SDK de Android oficial:

1. Ve a tu repositorio en GitHub:
   👉 **`https://github.com/ravilalling-code/storebass/actions`**
2. Haz clic en el flujo **«Build Android APK - StoreBass Monitor»**.
3. Selecciona la última ejecución (o presiona **«Run workflow»**).
4. Al terminar el build, en la sección **Artifacts** (al pie de la página), verás el archivo:
   📦 **`storebass-monitor-apk.zip`**
5. Descárgalo en tu computadora o directamente en tu teléfono Android, descomprímelo e instala el archivo `.apk`.

---

### Opción 2: Generar APK al instante con PWABuilder (Sin compilar)

Dado que la app web ya cuenta con `manifest.json` y meta-etiquetas PWA optimizadas para móviles:

1. Entra en tu navegador a: **[https://www.pwabuilder.com](https://www.pwabuilder.com)**
2. Pega la URL de tu app en producción:  
   `https://storebass.vercel.app/mobile`
3. Haz clic en **«Start»**. PWABuilder analizará la tienda y marcará todo en verde (PWA Ready).
4. Haz clic en **«Package for Android»** y luego en **«Generate APK»**.
5. Descarga el paquete generado que contiene tu archivo `.apk` firmado y listo para instalar en cualquier teléfono Android.

---

### Opción 3: Compilar localmente con Android Studio

Si tienes **Android Studio** instalado en tu computadora:

1. Abre Android Studio.
2. Selecciona **File → Open** y elige la carpeta `d:\TIENDA USA\apk-android`.
3. Espera a que Gradle sincronice las dependencias.
4. Ve al menú superior: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
5. El archivo APK se generará en:  
   `apk-android/app/build/outputs/apk/debug/app-debug.apk`

---

### Cómo instalar el APK en tu Celular Android:
1. Copia o descarga el archivo `.apk` a tu teléfono Android (por WhatsApp, Google Drive o cable USB).
2. Toca el archivo `.apk` para instalarlo.
3. Si Android muestra la advertencia *"Por seguridad, tu teléfono no tiene permitido instalar apps desconocidas"*:
   - Toca **Configuración / Ajustes**.
   - Activa el interruptor **«Permitir desde esta fuente»**.
   - Toca **Instalar**.
4. ¡Listo! Tendrás la aplicación **StoreBass Monitor** en tu pantalla con su icono oficial.

