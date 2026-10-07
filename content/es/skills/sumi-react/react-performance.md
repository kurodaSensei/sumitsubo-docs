---
title: "react-performance"
description: "Rendimiento de aplicaciones React/Next.js frente a Core Web Vitals (LCP, INP, CLS): disciplina del bundle de cliente, fronteras de cliente pequeñas, import dinámico, next/image, next/font, next/script y coste de terceros, coste de hidratación, virtualización de listas, gestión de eventos amigable con INP (useTransition, ceder el hilo), y medición con React Profiler, el panel Performance y web-vitals. Úsala cuando una página se sienta lenta, Lighthouse o CrUX señalen LCP/INP/CLS, los bundles crezcan, al añadir imágenes, fuentes, analítica o embebidos, al renderizar listas largas, o al revisar *.tsx, next.config.*, app/**/layout.tsx y nuevas dependencias en package.json."
source-hash: "80c59004f3b09dde"
---

# Rendimiento en React y Next.js

Objetivos (p75, móvil, datos de campo): **LCP <= 2.5s, INP <= 200ms, CLS <= 0.1**. Los presupuestos y la metodología independientes del framework viven en `sumi:performance`; esta skill cubre las palancas de React y Next.js. Recetas de medición: `references/measuring.md`.

## Principios

1. **Mide primero, en el campo.** CrUX/RUM vence a Lighthouse; Lighthouse vence a la intuición. Perfila una compilación de producción (`next build && next start`), nunca `next dev`.
2. **El JS más barato es el que nunca envías.** Primero Server Components y soluciones con HTML/CSS.
3. **La hidratación es un coste por cada isla interactiva.** Menos islas, y más pequeñas.
4. **El hilo principal se comparte con el usuario.** Las tareas largas (> 50ms) matan el INP.
5. **Reserva espacio para todo lo que carga tarde.** El CLS es un contrato de composición.

## Disciplina del bundle

- Mantén `'use client'` en las hojas (`next-app-router`). Una frontera de cliente incluye todos los módulos que importa.
- Antes de añadir una dependencia, comprueba su coste (bundlephobia/pkg-size) y si una API de la plataforma o 20 líneas la reemplazan. Nada de moment.js, nada de lodash completo, nada de paquetes de iconos importados enteros.
- Importa los iconos archivo por archivo (las importaciones con nombre de `lucide-react` están bien con `optimizePackageImports`; verifica los valores por defecto de tu versión de Next).
- Widgets pesados, bajo el pliegue o solo de interacción: `next/dynamic` (o `lazy`) con un fallback dimensionado.

```tsx
const Chart = dynamic(() => import('./revenue-chart'), {
  loading: () => <div className="h-72" aria-hidden />,  // reserve height
});
```

- `ssr: false` solo dentro de componentes de cliente y solo para bibliotecas exclusivas del navegador (mapas, editores). Quita contenido del HTML: nunca lo uses para contenido que importe para el LCP o el SEO.
- Analiza con el analizador de bundles (Next 16 incluye uno para Turbopack; verifica el comando; si no, `@next/bundle-analyzer`). Registra el First Load JS por ruta en CI.
- No serialices props grandes hacia componentes de cliente: cada prop queda incrustada en el payload de RSC. Envía DTOs y pagina.

## Imágenes (next/image)

- Usa siempre `next/image` para las imágenes de contenido. Indica `width`/`height` o `fill` + un padre con tamaño; eso es lo que evita el CLS.
- Imagen LCP: define `priority` (o `preload` / `fetchPriority="high"` según la versión; verifica con la documentación actual). Solo una o dos por página, nunca en todas.
- `sizes` es obligatorio con `fill` o con composiciones adaptables; un `sizes` incorrecto envía imágenes de escritorio a los móviles.
- Imágenes remotas: `images.remotePatterns` (no `domains`). Next 16 cambió algunos valores por defecto (`qualities`, TTL de caché); configúralos explícitamente si dependes de ellos.
- Imágenes decorativas: `alt=""`. Con significado: alt descriptivo (`sumi:a11y`).
- Iconos SVG en línea o como componentes; no los pases por el optimizador de imágenes.

## Fuentes (next/font)

- Autoalójalas con `next/font/google` o `next/font/local` en el layout raíz; exponlas como variables CSS consumidas por los tokens de `DESIGN.md`.
- Fuentes variables, con subconjunto de los alfabetos usados, como máximo 2 familias. `display: 'swap'` (por defecto) y apóyate en fallbacks con tamaño ajustado para limitar el CLS.
- Nunca pongas Google Fonts con `<link>` a mano ni las importes con `@import` en el CSS.

## Scripts de terceros

- Cada tercero justifica su coste. Audita los gestores de etiquetas cada trimestre.
- Estrategias de `next/script`: `afterInteractive` (por defecto, analítica), `lazyOnload` (widgets de chat, baja prioridad), `beforeInteractive` (solo consentimiento o polyfills realmente bloqueantes, solo en el layout raíz). `worker` (Partytown) es experimental; verifícalo.
- Prefiere `@next/third-parties` para los embebidos de GTM/GA/YouTube/Maps; usa fachadas (carga al hacer clic) para vídeo y chat.
- Los banners de consentimiento no deben causar CLS (superpuestos, no empujando hacia abajo) y no deben ser el elemento LCP.

## Coste de hidratación

- Renderiza en el servidor las partes estáticas; las partes interactivas son hojas pequeñas. Una sección estática de marketing no debería hidratar nada.
- Evita los desajustes de hidratación (Date/idioma/aleatorios en el renderizado, ramas con `typeof window`). Arregla la causa; `suppressHydrationWarning` solo para casos conocidos como la clase del tema en `<html>`.
- Usa `<Activity>` (React 19.2) para conservar el estado de pestañas y paneles ocultos sin renderizarlos con prioridad alta; verifica su estabilidad en tu versión.
- Temas: define la clase del tema con un pequeño script en línea antes del pintado para evitar el parpadeo, no con un efecto de cliente.

## INP: interacciones que responden

- Los manejadores hacen lo mínimo de forma síncrona: actualizan el estado visible y difieren el resto.
- `useTransition` / `startTransition` para actualizaciones de estado costosas (filtrar listas grandes, cambios de pestaña) para que la entrada siga respondiendo.
- `useDeferredValue` para una vista derivada y costosa de una entrada que cambia rápido.
- Divide el trabajo largo: cede el hilo con `await scheduler.yield()` (detecta la función y recurre a `setTimeout(0)`), o muévelo a un Web Worker.
- Aplica debounce de ~200-300ms a las entradas ligadas a la red (búsqueda); no lo apliques a la respuesta visual.
- Evita el thrashing de composición en los manejadores (leer la composición después de escribir estilos dentro de bucles).

```tsx
const [isPending, startTransition] = useTransition();
function onFilterChange(value: string) {
  setQuery(value);                              // urgent: input reflects keystroke
  startTransition(() => setFilter(value));      // non-urgent: heavy list re-render
}
```

## Listas largas

- Pagina o usa "cargar más" en el servidor primero. Virtualiza las listas de cliente de más de ~200 filas con elementos complejos (`@tanstack/react-virtual`).
- Las listas virtualizadas deben conservar la accesibilidad: semántica de lista real, alcanzables con teclado, `aria-rowcount`/`aria-rowindex` para las cuadrículas. Si eso no es posible, pagina en su lugar.
- `content-visibility: auto` con `contain-intrinsic-size` es una alternativa barata en CSS para secciones estáticas largas.

## Coste de renderizado

- Con React Compiler, la mayoría de los renderizados innecesarios ya están resueltos. Sin él, arregla primero la estructura (coloca el estado cerca, divide el contexto, pasa `children`) antes de recurrir a `memo`.
- No crees en línea valores de contexto que cambien en cada renderizado en proveedores con mucha difusión (el compilador lo gestiona cuando está activo; verifícalo).
- Anima solo `transform`/`opacity`; respeta `prefers-reduced-motion`.

## Caché como rendimiento

- Una carcasa estática más huecos dinámicos transmitidos en streaming (Cache Components) da un TTFB/LCP rápido. Consulta `next-data-caching`.
- No conviertas toda una ruta en dinámica porque un widget lea cookies; aíslalo detrás de Suspense.

## Señales de relleno de IA

- `'use client'` en layouts y páginas, inflando el JS de cada ruta.
- Etiquetas `<img>` sin dimensiones; `priority` en todas las imágenes; falta de `sizes` con `fill`.
- Google Fonts mediante `<link>`; cinco pesos de fuente cargados "por si acaso".
- Analítica, chat y mapas de calor, todos con `beforeInteractive`.
- `useMemo` por todas partes como "optimización" sin perfil; mientras tanto, una lista de 3.000 filas se renderiza sin virtualizar.
- `dynamic(..., { ssr: false })` sobre contenido por encima del pliegue.
- Spinners que reemplazan contenido y desplazan la composición en lugar de esqueletos dimensionados.
- Afirmaciones de rendimiento respaldadas solo por tiempos de `next dev`.

## Lista de verificación

- [ ] Cifras de campo o de laboratorio registradas antes y después (LCP, INP, CLS, First Load JS por ruta).
- [ ] Elemento LCP identificado; precargado o priorizado; servido desde el HTML (no renderizado en el cliente).
- [ ] Todas las imágenes con tamaño y `sizes` correcto; fuentes mediante `next/font`; sin saltos de composición por contenido tardío.
- [ ] Nuevas dependencias justificadas por su tamaño; widgets pesados importados dinámicamente con fallbacks dimensionados.
- [ ] Los scripts de terceros usan la estrategia menos agresiva que funcione.
- [ ] Actualizaciones costosas envueltas en transiciones; sin tareas largas de más de 50ms en las interacciones clave.
- [ ] Listas largas paginadas o virtualizadas con semántica accesible.
- [ ] Contrastado con `sumi:performance`.

## Medición del rendimiento en React y Next.js

### 1. Datos de campo (fuente de verdad)

- CrUX (PageSpeed Insights, panel de CrUX / BigQuery) para sitios públicos con tráfico.
- RUM para todo lo demás: reporta los Web Vitals desde la aplicación.

```tsx
// app/_components/web-vitals.tsx
'use client';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // metric: { name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB', value, rating, id, navigationType }
    const body = JSON.stringify({ ...metric, path: location.pathname });
    navigator.sendBeacon?.('/api/vitals', body) || fetch('/api/vitals', { body, method: 'POST', keepalive: true });
  });
  return null;
}
```

Renderiza `<WebVitals />` una sola vez en el layout raíz. Para la atribución (qué elemento es el LCP, qué interacción es lenta), usa directamente el paquete `web-vitals` en su compilación `attribution` y envía los selectores `attribution.interactionTarget`, `attribution.lcpEntry`.

Vercel Speed Insights o cualquier proveedor de RUM sirve; lo importante son las cifras de campo p75 por ruta.

### 2. Laboratorio: Lighthouse / Chrome DevTools

- Siempre sobre una compilación de producción: `next build && next start`.
- Emulación móvil con CPU limitada 4x para un INP/TBT representativo.
- Panel Performance: graba una interacción, busca tareas largas, cadenas de "Recalculate style"/"Layout", y qué trabajo de React (pista Components en compilaciones con React DevTools habilitado) domina.
- "Live metrics" del panel Performance muestra LCP/INP/CLS mientras interactúas: un bucle de respuesta rápido.

### 3. React Profiler

- Profiler de React DevTools: graba, inspecciona los commits, "Why did this render?" (actívalo en los ajustes).
- Perfila con una compilación de profiling cuando midas tiempos precisos; las compilaciones de desarrollo son más lentas y renderizan dos veces en Strict Mode.
- Por código: `<Profiler id="ProjectTable" onRender={(id, phase, actualDuration) => ...}>` alrededor de un subárbol sospechoso; registra solo `actualDuration` > 16ms.
- React 19.2 añade las React Performance Tracks en el panel Performance de Chrome (pistas Scheduler y Components); verifica su disponibilidad en tu versión de DevTools.

### 4. Bundles

- El analizador de bundles de Turbopack en Next 16 (experimental al momento de escribir esto; verifica el comando) o `@next/bundle-analyzer` con webpack.
- Busca: bibliotecas duplicadas, importaciones de bibliotecas enteras, bibliotecas solo de servidor que se filtran a los chunks de cliente (añade `server-only` para detectarlas al compilar), JSON grande importado en código de cliente.
- Registra el First Load JS por ruta a partir de la salida de `next build`; haz fallar el CI ante regresiones que superen un presupuesto acordado.

### 5. Interpretación

| Síntoma | Causa probable | Primera palanca |
|---|---|---|
| LCP alto, TTFB bajo | Imagen LCP sin priorizar, hero renderizado en el cliente, fuente bloqueante | `priority`/precarga, renderizar el hero en el servidor, `next/font` |
| LCP alto, TTFB alto | Ruta dinámica bloqueada por datos lentos | Cachear la carcasa, transmitir en streaming las partes lentas con Suspense |
| INP alto | Tareas largas en manejadores, renderizados grandes, scripts de terceros | Transiciones, ceder el hilo, dividir el estado, diferir scripts |
| CLS alto | Medios sin tamaño, banners tardíos, cambio de fuente, esqueleto que no coincide | Dimensiones, superposiciones, fuentes con tamaño ajustado, esqueletos fieles |
| First Load JS grande | Frontera de cliente demasiado alta, dependencias pesadas | Empujar `'use client'` hacia abajo, import dinámico, reemplazar dependencias |

### 6. Formato del informe

Al reportar un cambio de rendimiento, incluye: ruta, perfil de dispositivo, métrica antes -> después, método (campo/laboratorio) y el cambio que lo causó. Sin afirmaciones sin medir.
