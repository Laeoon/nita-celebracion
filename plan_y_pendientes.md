# Hoja de Ruta y Guía de Implementación: Celebración de Mariana (“Nita”) • 29 Oct

Este documento resume el estado actual del proyecto (`index.html` / `celebracion_mariana_nita.html`), las tareas pendientes para que el agente local termine de conectar el sistema multiusuario y las recomendaciones de base de datos, almacenamiento de audio/fotos y despliegue.

## 1. Estado Actual del Proyecto (Ya Implementado en el Frontend)

El archivo `index.html` entregado es una aplicación web *single-file* (HTML + Tailwind CSS + Vanilla JS) completamente funcional en local con las siguientes características:

* **Diseño y estética depurada**: Paleta sobria en tonos carbón (`#0b0a0e`, `#121117`) y dorado champaña (`#d4a86a`, `#e5cb99`), tipografías editoriales (*Cormorant Garamond*, *Plus Jakarta Sans*, *Space Grotesk*), íconos SVG minimalistas y cero emojis.
* **Encabezado y navegación**: Monograma `N`, título **Mariana “Nita” • 29 Oct**, botón de modo **Administrar** y barra de navegación con resaltado activo (**Inicio**, **Música**, **Recuerdos**, **Dedicatorias**, **Publicar**).
* **Cuenta regresiva en tiempo real**: Calcula automáticamente días, horas, minutos y segundos hasta el 29 de octubre a las 21:00.
* **Reproductor Musical principal (Exclusivo para el Organizador)**:
  * Inicia vacío (sin pistas de relleno).
  * Permite cargar archivos `.mp3` desde el dispositivo o definirlos de fábrica en el arreglo `PLAYLIST_OFICIAL`.
  * Incluye controles de reproducción, barra de progreso interactiva, silencio y animación de vinilo/ondas.
* **Galería Polaroid con recorte MP3 de 30 segundos independiente**:
  * Inicia vacía, con filtros para **Todas**, **La Rumba**, **El Grupo** y **Brindis, Tomaderas y Locuras**.
  * El formulario **1. Subir una foto Polaroid** permite seleccionar una foto (con vista previa instantánea) y adjuntar un archivo `.mp3` opcional.
  * Al seleccionar un `.mp3`, se despliega un **recortador interactivo de 30 segundos** con barra deslizante y botón de preescucha (**Escuchar 30s**).
  * Cada tarjeta Polaroid publicada muestra su propio **mini-reproductor independiente** debajo de la foto que reproduce únicamente los 30 segundos elegidos y pausa automáticamente el reproductor principal para no solaparse.
* **Muro de Dedicatorias**: Inicia vacío, genera monogramas automáticos con las iniciales del autor y permite reacciones por tarjeta.

## 2. Pendientes a Desarrollar por el Agente en Computadora

### A. Acceso Privado mediante Código QR
1. **Validación de token de invitación en URL**:
   * Al cargar la página, verificar si la URL contiene el parámetro de invitación (ejemplo: `?invitacion=nita29oct`) o si el navegador ya tiene el pase guardado en `localStorage`.
   * Si alguien entra al dominio sin el parámetro del QR, mostrar una pantalla de bloqueo elegante solicitando el código de acceso del grupo.
2. **Generador de QR en el Panel de Administrador**:
   * Integrar una librería ligera (como `qrcodejs` vía CDN) dentro del modal de Administrador para visualizar y descargar el PNG del código QR apuntando a la URL de producción con el token incluido.

### B. Sistema de Cuentas Ligeras (Amigos vs. Administrador)
1. **Registro / Inicio de sesión de Amigos**:
   * Al entrar por primera vez con el QR, mostrar un modal donde el invitado ingrese:
     * `nombre` (ej. *Andrea*)
     * `apodo` (ej. *La Cómplice*)
     * `pin` de 4 dígitos (para recuperar su sesión si cambia de navegador o teléfono).
   * Guardar el perfil activo y mostrarlo en la barra superior (ocultando los campos manuales de "Tu nombre" en los formularios de fotos y dedicatorias para asignarlos automáticamente desde la sesión).
2. **Inicio de sesión de Administrador**:
   * Al pulsar **Administrar**, solicitar tu contraseña maestra (validada mediante Supabase Auth o hash seguro) para activar los permisos globales.

### C. Matriz de Permisos y Comentarios

| Módulo / Acción | Rol: Amigo (Cuenta propia) | Rol: Administrador (Organizador) |
| :--- | :--- | :--- |
| **Subir fotos Polaroid y dedicatorias** | Permitido (autoría vinculada a su `user_id`) | Permitido |
| **Editar o borrar fotos y dedicatorias** | Solo puede editar/borrar **sus propias publicaciones** | Puede editar/borrar **cualquier publicación** |
| **Comentar en fotos y dedicatorias** | Puede comentar en cualquiera y borrar **solo sus comentarios** | Puede borrar **cualquier comentario** |
| **Reaccionar (Me gusta / Salud)** | 1 reacción por `user_id` en cada foto o dedicatoria | Igual + opción de moderación |
| **Reproductor Musical principal** | Solo reproducir / pausar / cambiar canción | Único que puede **subir, ordenar o eliminar MP3** de la playlist |

### D. Recorte Físico del Audio de 30 Segundos (Optimización Crítica para Móviles)
* Actualmente el recortador guarda `clipStart` y `clipDuration = 30`. Cuando se conecte a la nube para que todos los amigos lo escuchen desde sus teléfonos, conviene que el navegador **recorte físicamente el archivo de audio** antes de subirlo al Storage:
  1. Usar `AudioContext.decodeAudioData(arrayBuffer)` para decodificar el MP3 elegido por el amigo.
  2. Extraer únicamente las muestras entre `clipStart` y `clipStart + 30` segundos en un nuevo `AudioBuffer`.
  3. Codificar ese segmento de 30 segundos en un archivo ligero (WAV mono a 22.05 kHz o WebM/Opus mediante `MediaRecorder`, que ocupa ~300–500 KB en lugar de 8 MB) y subir solo ese fragmento al bucket de la nube.

## 3. Recomendación de Base de Datos y Almacenamiento (Gratis y Rápido)

La mejor opción gratuita, sin servidor propio y con sincronización en tiempo real para este proyecto es **Supabase** (PostgreSQL + Storage + Realtime en el plan gratuito).

### Esquema SQL Recomendado para Supabase

Tu agente local puede ejecutar este script directamente en el **SQL Editor** de Supabase:

```sql
-- 1. Tabla de Usuarios (Amigos y Admin)
create table public.usuarios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  apodo text,
  pin_hash text not null,
  es_admin boolean default false,
  creado_en timestamptz default now()
);

-- 2. Tabla de Recuerdos Polaroid
create table public.recuerdos (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete cascade,
  autor_nombre text not null,
  autor_apodo text,
  titulo text not null,
  fecha_lugar text default '29 de Octubre',
  categoria text not null check (categoria in ('rumba', 'grupo', 'brindis')),
  historia text,
  foto_url text not null,
  audio_clip_url text,
  cancion_titulo text,
  clip_inicio numeric default 0,
  clip_duracion numeric default 30,
  creado_en timestamptz default now()
);

-- 3. Tabla de Dedicatorias (Muro)
create table public.dedicatorias (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete cascade,
  autor_nombre text not null,
  autor_apodo text,
  mensaje text not null,
  creado_en timestamptz default now()
);

-- 4. Tabla de Comentarios (Polimórfica para Fotos y Dedicatorias)
create table public.comentarios (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete cascade,
  autor_nombre text not null,
  autor_apodo text,
  tipo_objetivo text not null check (tipo_objetivo in ('recuerdo', 'dedicatoria')),
  objetivo_id uuid not null,
  texto text not null,
  creado_en timestamptz default now()
);

-- 5. Tabla de Reacciones (1 por usuario y publicación)
create table public.reacciones (
  id uuid primary key default gen_random_uuid(),
  usuario_id uuid references public.usuarios(id) on delete cascade,
  tipo_objetivo text not null check (tipo_objetivo in ('recuerdo', 'dedicatoria')),
  objetivo_id uuid not null,
  creado_en timestamptz default now(),
  unique (usuario_id, tipo_objetivo, objetivo_id)
);
```

### Configuración de Buckets (Supabase Storage)
Crear 3 *buckets* públicos en **Storage**:
1. `playlist-oficial`: Donde tú subes los `.mp3` completos para el reproductor principal de la fiesta.
2. `fotos-polaroid`: Donde se suben las fotos de los amigos (recomendado comprimir en el navegador con un `<canvas>` a máximo `1200px` de ancho en formato WebP/JPEG al 80 % antes de subir).
3. `clips-30s`: Donde se guardan los fragmentos de audio de 30 segundos de cada foto.

## 4. Recomendaciones para Subir y Publicar la Página

| Plataforma | Ventaja Principal | Pasos para tu Agente Local |
| :--- | :--- | :--- |
| **Vercel** (Recomendada) | Despliegue en 15 segundos, HTTPS automático y URLs limpias | Instalar `vercel` CLI o conectar el repositorio de GitHub; desplegar la carpeta raíz con `vercel --prod`. |
| **Netlify** | Permite arrastrar la carpeta directamente o desplegar por CLI | Ejecutar `npx netlify-cli deploy --prod --dir=.` desde la carpeta del proyecto. |
| **Cloudflare Pages** | Ancho de banda ilimitado gratuito (ideal si hay muchos MP3 y fotos) | Conectar el repositorio en el panel de Cloudflare Pages sin comando de compilación (sitio estático). |

## 5. Estructura de Carpetas Entregada en el `.zip`

```text
proyecto_mariana_nita/
├── index.html               # Aplicación web interactiva actual lista para extender
├── PLAN_Y_PENDIENTES.md     # Este documento de arquitectura e instrucciones para el agente
├── DESIGN.md                # Tokens de color y tipografía del proyecto
└── assets/
    ├── audio/               # Carpeta para tus archivos MP3 del reproductor principal
    └── fotos/               # Carpeta opcional para imágenes fijas
```
