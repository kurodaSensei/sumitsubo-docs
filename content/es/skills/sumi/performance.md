---
title: "performance"
description: "Rendimiento web con Core Web Vitals como criterios de aceptación: presupuestos, guías para LCP, INP y CLS, imágenes, fuentes, coste de JavaScript y de terceros, caché y entrega, estrategia de renderizado, y cómo medir (laboratorio y campo) con evidencia. Úsala al construir páginas o componentes, añadir dependencias, scripts, imágenes o fuentes, elegir la estrategia de renderizado, o cuando algo vaya lento. Base independiente del framework: cuando se aplique una skill de un paquete de stack (nuxt-data-ssr, react-performance, shopify-performance-a11y, wp-performance-audit), úsala para lo específico del stack."
source-hash: "9f07a1a71fcadda9"
---

# Rendimiento — Core Web Vitals como requisitos

Los presupuestos se fijan antes de construir (`.sumi/config.json` → `performanceBudget`) y se comprueban antes de entregar. Valores por defecto, medidos en p75 en un móvil de gama media:

| Métrica | Presupuesto |
|---|---|
| LCP | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| JS inicial (gzip) | ≤ 170 KB en sitios de contenido; justifica más en las apps |
| Tamaño total de transferencia | ≤ 1.5 MB para una página de contenido típica |

## LCP — haz que el hero llegue rápido

1. Identifica el elemento LCP (normalmente la imagen hero o el titular).
2. Debe estar en el HTML inicial (no inyectado por JS), sin carga diferida, con `fetchpriority="high"`; precárgalo solo si se descubre tarde (fondo CSS, dentro de un componente).
3. Sírvelo adaptable (`srcset`/`sizes`), en AVIF/WebP, desde un CDN y dimensionado para el hueco real.
4. Reduce el TTFB: caché estática/ISR/en el edge donde el contenido lo permita; evita las cascadas bloqueantes en el servidor.
5. Elimina lo que bloquea el renderizado: CSS crítico pequeño, CSS no crítico diferido; sin scripts de terceros bloqueantes en el `<head>`.

## INP — mantén las interacciones instantáneas

- Mantén pequeños los manejadores de eventos: actualiza primero la UI y difiere el trabajo no urgente (`scheduler.yield()`, `requestIdleCallback`, transiciones en React).
- Divide las tareas largas de más de 50 ms; evita las lecturas síncronas de composición después de escribir.
- Envía menos JS: renderiza en el servidor el contenido estático, hidrata solo las islas interactivas, divide el código por ruta y por interacción (carga el código del modal en la primera apertura).
- Vigila a los terceros (widgets de chat, herramientas de A/B, gestores de etiquetas): cárgalos tras una interacción o en reposo, mediante una fachada cuando sea posible.
- Listas grandes: virtualiza o pagina; evita volver a renderizar árboles completos con cada pulsación de tecla.

## CLS — nada salta

- Dimensiones o `aspect-ratio` en cada imagen, vídeo, iframe y hueco de anuncio o embed.
- Reserva espacio para el contenido tardío (banners, barras de cookies, bloques de apps, widgets de reseñas) o muéstralo en superposiciones que no empujen el contenido.
- Fuentes: `font-display: swap` con alternativas de métricas equivalentes (`size-adjust`, `ascent-override`) u `optional` para el texto del cuerpo.
- Anima solo `transform`/`opacity`; nunca animes propiedades de composición.

## Fuentes

- Máximo 2 familias, con subconjunto, WOFF2, alojadas por ti (o con el optimizador de fuentes del framework), y precarga solo los 1–2 archivos usados sobre el pliegue. Fuentes variables cuando reemplacen ≥ 3 archivos estáticos.

## Imágenes y medios

- Formato y tamaño correctos por hueco; `loading="lazy"` bajo el pliegue; `decoding="async"`.
- Usa el pipeline de imágenes de la plataforma (Nuxt Image, next/image, `image_url` de Shopify con anchos, `wp_get_attachment_image` de WordPress con sizes).
- Vídeo: sin vídeos hero con reproducción automática en móvil salvo que sean diminutos y sin sonido, con póster; carga diferida de los embeds tras una fachada.

## Entrega y caché

- Caché inmutable de larga duración para los recursos con hash; caché corta o revalidada para el HTML.
- HTTP/2+ con compresión (Brotli). Preconecta solo con los orígenes necesarios en los primeros segundos (máximo 2–3).
- Elige el renderizado por ruta: estático/ISR para contenido, SSR para lo personalizado, CSR solo tras autenticación para pantallas de tipo aplicación.

## Dependencias

Comprueba el coste antes de añadir (bundlephobia / `pkg-size`, o el analizador de bundles). Prefiere las APIs nativas y las bibliotecas pequeñas y enfocadas. Elimina los polyfills sin usar para objetivos evergreen.

## Medición (evidencia obligatoria)

- **Laboratorio**: Lighthouse (móvil, con limitación) o Unlighthouse para sitios de varias páginas; WebPageTest para las cascadas. Las ejecuciones de navegación no pueden medir el INP: usa el TBT como su indicador sustituto, o una ejecución timespan de Lighthouse sobre la interacción. Registra las cifras de antes y después en el expediente de funcionalidad.
- **Campo**: CrUX / Search Console / la biblioteca `web-vitals` informando a analítica para datos reales de p75. Pasar en laboratorio no garantiza pasar en campo.
- **Bundles**: el analizador del framework (`nuxi analyze`, `@next/bundle-analyzer`, `vite-bundle-visualizer`).
- **Interacciones**: el panel Performance de Chrome DevTools con limitación de CPU 4× para depurar el INP.

## Señales de relleno genérico

- Carga diferida de la imagen hero; `loading="lazy"` en todo.
- Importar una biblioteca entera para una sola función (`lodash`, `moment`, paquetes de iconos sin tree-shaking).
- Obtención de contenido en el cliente que podría renderizarse en el servidor; `'use client'` / envoltorios solo de cliente en lo alto del árbol.
- Animaciones sobre `top/left/width/height`; listeners de scroll sin passive ni throttling.
- Scripts de terceros sin límite en el head.

## Lista de verificación

- [ ] Elemento LCP identificado y priorizado; imágenes dimensionadas, formatos modernos, dimensiones fijadas.
- [ ] Sin recursos nuevos que bloqueen el renderizado; terceros nuevos diferidos o justificados.
- [ ] El JS añadido para la funcionalidad, medido; presupuesto respetado o excepción justificada.
- [ ] Cifras de Lighthouse móvil de antes y después registradas como evidencia.
