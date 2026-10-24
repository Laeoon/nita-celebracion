# Feature: Celebración de Mariana ("Nita") • 29 Oct
Arquitectura modular frontend con Vite + TypeScript puro (sin frameworks), diseño de alta gama y servicios desacoplados para conectividad resiliente.

## Specs
- S1: Sin frameworks (ni React, ni Vue, ni Svelte). Arquitectura Vanilla TypeScript modular con Vite y Tailwind compilado.
- S2: Resiliencia de red para Venezuela: cero dependencias de CDNs externas en runtime (fuentes, estilos e iconos empaquetados localmente en el bundle).
- S3: Diseño Nocturne Gala elevado: estética carbón y champán con texturas de grano sutil, gradientes ambientales, microinteracciones fluidas y componentes sin emojis ordinarios.
- S4: Reproductor maestro de audio con analizador de frecuencias en tiempo real (`AudioContext` / `AnalyserNode`), vinilo interactivo y soporte de playlist oficial.
- S5: Módulo Polaroid con galería filtrable, compresión de fotos client-side vía Canvas (máx 1200px WebP/JPEG) y recortador físico de audio de 30s mediante Web Audio API antes del upload.
- S6: Muro de dedicatorias con monogramas dinámicos, hilos de comentarios y sistema de reacciones sin duplicación.
- S7: Sistema de acceso por QR / token URL (`?invitacion=...`), registro liviano de invitados (Nombre, Apodo, PIN de 4 dígitos) y panel de Administrador con contraseña maestra y generador de QR.
- S8: Capa de servicios desacoplada para persistencia (Supabase / Storage / Realtime) con fallback local ordenado y tipos TypeScript estrictos.

## Tasks
- T1 [S1, S2]: Inicializar proyecto Vite + TypeScript + Tailwind, configurar build local con fuentes y assets empaquetados.
- T2 [S3]: Implementar sistema de diseño y layout base (tokens Nocturne Gala, navegación, cuenta regresiva y atmósfera).
- T3 [S4]: Desarrollar motor de audio y reproductor principal interactivo con analizador de espectro real.
- T4 [S5]: Desarrollar módulo Polaroid: recortador de audio 30s (Web Audio API), compresor de imágenes (Canvas) y galería interactiva.
- T5 [S6]: Desarrollar muro de dedicatorias con monogramas, comentarios y reacciones.
- T6 [S7]: Desarrollar control de acceso: validación de token QR, modal de registro/PIN de invitado y panel de administración con generador de QR.
- T7 [S8]: Conectar capa de servicios para Supabase (tablas, buckets de storage y sincronización en tiempo real).

## Log
- L1: "lee el .md y descomprime el .zip. hay cosas que discutir"
- L2: "claro es que ese unico html es un ejemplo. ahora es que trasladaremos eso y subiremos el nivel... primero estamos en venezuela asi que preferiblemente que no se use vpn para entrar al dominio, segundo el monolitico va para afuera, vamos a hacer las cosas bien, crea carpetas y la estructura bien, lo otro es el diseno, me gusto pero siento que le podemos meter mas."
- L3: "yo pensaba html,css js pero si porque no xd, total tu eres el que lo va a hacer ajajajaj porque no ponernos creativos con typescrip? eso si, no quiero meter frameworks porque ya ahi es terreno muy elevado y seria complicar las cosas"
