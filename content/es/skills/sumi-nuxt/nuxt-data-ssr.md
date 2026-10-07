---
title: "nuxt-data-ssr"
description: "Obtención de datos, seguridad de SSR e hidratación, y rendimiento de entrega en Nuxt 4: claves y opciones de useFetch/useAsyncData, $fetch frente a useFetch, prevención de desajustes de hidratación (APIs solo de cliente, fechas, aleatoriedad, configuración regional), tamaño de la carga útil, useState, caché, carga diferida e hidratación diferida, SEO con useSeoMeta, @nuxt/image, @nuxt/fonts y presupuestos de Core Web Vitals. Úsala cuando una página *.vue o un composable cargue datos, cuando veas advertencias de desajuste de hidratación, LCP/INP/CLS lentos, un _payload grande, o al tocar metadatos de SEO, imágenes o fuentes."
source-hash: "a29d33b428d3cda4"
---

# Datos, SSR y rendimiento en Nuxt

El SSR renderiza HTML en el servidor, serializa los datos en una carga útil, y el cliente hidrata el mismo
árbol. Cada regla de aquí protege una de tres cosas: **el servidor y el cliente renderizan HTML idéntico**,
**los datos se obtienen una vez (no dos)** y **la persona usuaria recibe píxeles útiles rápido**.

## Principios básicos

1. **Obtén los datos en setup con `useFetch`/`useAsyncData`**, de modo que los datos se obtengan en el servidor y
   se transfieran en la carga útil. Un `$fetch` directo en setup obtiene los datos dos veces (en el servidor y otra vez en el cliente).
2. **Toda llamada de datos asíncrona tiene una clave deliberada.** Misma clave = datos compartidos y deduplicados entre
   componentes (capa de datos singleton de Nuxt 4). Datos distintos nunca deben compartir una clave.
3. **Envía solo lo que renderiza la página.** Recorta con `pick`/`transform` o con un endpoint de servidor dedicado.
4. **Renderiza marcado determinista.** Sin hora, aleatoriedad, configuración regional ni estado del navegador en la salida del SSR.
5. **Mide contra presupuestos**, no contra impresiones: LCP < 2.5s, INP < 200ms, CLS < 0.1 en un móvil de gama media
   (`sumi:performance`).

## Elegir la primitiva

| Necesidad | Usa |
| --- | --- |
| Datos necesarios para el renderizado inicial, desde tu API | `useFetch('/api/x')` |
| Datos de un SDK o función (Firestore, cliente de CMS) | `useAsyncData('key', () => fn())` |
| Acción iniciada por la persona usuaria (enviar, borrar, cargar más) | `$fetch` en un manejador de eventos |
| Datos no críticos (bajo el pliegue, recomendaciones) | `lazy: true` (+ `server: false` si no es relevante para el SEO) |
| Ejecutar algo una vez por petición entre componentes | `callOnce` (verifica el comportamiento en tu versión) |
| Valor compartido con alcance de petición | `useState('key', init)` |

```ts
// GOOD: typed, keyed, trimmed, with explicit states
const route = useRoute()
const { data: project, status, error } = await useFetch(`/api/projects/${route.params.id}`, {
  pick: ['id', 'name', 'status', 'updatedAt'],
})
if (error.value?.statusCode === 404) throw createError({ statusCode: 404, fatal: true })
```

```ts
// BAD: double fetch, untyped, no error state
const project = ref<any>(null)
onMounted(async () => { project.value = await $fetch(`/api/projects/${id}`) })
```

### Reglas de claves y opciones

- `useFetch` deriva una clave a partir de la URL y las opciones. Con `useAsyncData`, pasa siempre una clave explícita que
  codifique cada entrada: `` `project:${id}` ``, `` `projects:${page}:${sort}` ``.
- Parámetros reactivos: pasa refs o getters en `query`/la URL para que se vuelva a obtener automáticamente. No añadas un
  `watch` que llame a `refresh()` para lo mismo.
- Valores por defecto de Nuxt 4: `data` es un `shallowRef` (usa `deep: true` solo si mutas campos anidados), y
  el valor vacío es `undefined`. Usa `default: () => []` para formas de lista.
- Usa `status` (`idle | pending | success | error`) para los estados de la interfaz, no refs `loading` improvisados.
- `getCachedData` controla la reutilización de datos de la carga útil o estáticos entre navegaciones; úsalo para evitar volver a obtener
  datos estables en la navegación del cliente. `refreshNuxtData(key)` / `clearNuxtData(key)` para invalidar.
- Nunca hagas `await` de varias llamadas `useFetch` independientes en secuencia cuando puedan ejecutarse en paralelo;
  combínalas con `Promise.all` dentro de un solo `useAsyncData`, o haz `lazy` las secundarias.

## Desajustes de hidratación

Causas raíz y soluciones (catálogo completo en `references/hydration.md`):

| Causa | Solución |
| --- | --- |
| `window`, `localStorage`, `matchMedia` leídos durante setup | Lee en `onMounted`, o envuelve en `<ClientOnly>` con un marcador de posición del mismo tamaño |
| `new Date()`, `Date.now()`, tiempo relativo ("hace 3 min") | Da formato a partir de una marca de tiempo proporcionada por el servidor con una zona horaria fija; renderiza el tiempo relativo tras el montaje |
| `Math.random()`, `crypto.randomUUID()` para ids | `useId()` |
| `toLocaleString()` sin configuración regional ni zona horaria explícitas | `Intl.DateTimeFormat('es-CO', { timeZone: 'America/Bogota' })` con argumentos explícitos |
| Marcado que depende de la autenticación cuando el servidor no tiene sesión | Reenvía la autenticación (cookie) al servidor, o renderiza esa región solo en el cliente con un esqueleto |
| Anidamiento de HTML inválido (`<div>` en `<p>`, `<a>` en `<a>`) | Corrige el marcado; el navegador lo reescribe y Vue ve un desajuste |
| Tema o modo oscuro desde localStorage | Preferencia basada en cookies o `@nuxtjs/color-mode`, que inyecta un script previo a la hidratación |

Nunca silencies los desajustes con `<ClientOnly>` alrededor de secciones grandes de la página; eso descarta el SSR para
el SEO y el LCP. Úsalo para islas pequeñas y realmente solo de cliente, y dale un `#fallback` del mismo tamaño
para evitar el CLS.

## Tamaño de la carga útil y del bundle

- Inspecciona `/_payload.json` o `window.__NUXT__` en las páginas pesadas; si es más grande que el HTML que
  renderiza, estás enviando datos sin usar. Usa `pick`, `transform` o un endpoint creado a propósito.
- Nunca pongas secretos ni campos internos en los datos devueltos a `useFetch`; la carga útil es pública.
- Los valores no serializables (instancias de clase, `Timestamp` de Firestore, `Map`) necesitan conversión en
  `transform` o en un reductor de carga útil personalizado.
- Divide el código de los componentes pesados con `Lazy*` + `v-if`; considera la hidratación diferida (`hydrate-on-visible`,
  `hydrate-on-interaction`) para islas interactivas bajo el pliegue (verifica en tu versión de Nuxt).
- Scripts de terceros mediante `@nuxt/scripts` o carga diferida; nunca síncronos en `<head>`.
- Analiza con `nuxi analyze`. Toda dependencia de más de ~20 kB comprimidos con gzip necesita una razón.

## Capas de caché

1. **routeRules** (`prerender`, `isr`, `swr`, `cache`) para respuestas completas en el borde o el servidor.
2. **`defineCachedEventHandler` / `cachedFunction`** en Nitro para llamadas costosas al origen.
3. **Reutilización de la carga útil** en el cliente mediante `getCachedData` para la navegación.
4. **Cabeceras de caché HTTP** en los recursos estáticos (Nuxt les añade un hash; conserva la caché inmutable).
Elige la capa más externa que sea correcta para las necesidades de frescura de los datos. Los datos autenticados
por usuario nunca se cachean en una capa compartida.

## SEO y metadatos

```ts
useSeoMeta({
  title: () => project.value?.name ?? 'Project',
  description: () => project.value?.summary,
  ogTitle: () => project.value?.name,
  ogImage: () => project.value?.coverUrl,
  twitterCard: 'summary_large_image',
})
```

- `useSeoMeta` (tipado) en lugar de `useHead({ meta })` directo. Usa getters para los valores reactivos.
- Define `app.head.htmlAttrs.lang` y una plantilla de título una sola vez. URLs canónicas mediante `useHead({ link })`.
- Códigos de estado correctos para el contenido ausente (`createError` 404) para que las páginas no sean soft-404.
- Datos estructurados (JSON-LD) solo cuando reflejen contenido visible; considera `nuxt-schema-org`.

## Imágenes y fuentes

- `@nuxt/image`: `<NuxtImg>`/`<NuxtPicture>` con `width`/`height` (o aspect-ratio) para evitar el CLS,
  `sizes` para un srcset adaptable, `<NuxtPicture format="avif,webp">` cuando necesites varios formatos (`<NuxtImg>` admite un único `format`).
- La imagen del LCP: `loading="eager"`, `fetchpriority="high"`, `preload`; nunca la cargues de forma diferida.
  Todo lo que está bajo el pliegue: `loading="lazy"`.
- `@nuxt/fonts`: autoalojadas, con subconjuntos, `font-display: swap`, con alternativas de métricas equivalentes para reducir
  el CLS. Limita las familias y los pesos (dos familias y tres o cuatro pesos en total es un tope razonable).
- Las decisiones de fuentes e imágenes salen de los tokens de `DESIGN.md`; no introduzcas familias nuevas de forma improvisada.

## Antipatrones (señales de relleno de IA)

- `onMounted` + `$fetch` + `ref` para los datos iniciales de la página (hábito de `useEffect` de React).
- `useAsyncData` sin clave, o dos consultas distintas que comparten una clave.
- Un `watch` sobre los parámetros de ruta que llama a `refresh()` cuando la URL ya es reactiva.
- `<ClientOnly>` alrededor de toda la página para "arreglar la hidratación".
- `new Date().toLocaleDateString()` en las plantillas.
- Devolver documentos completos de Firestore (con campos internos) a la carga útil del cliente.
- Awaits secuenciales de peticiones independientes que provocan cascadas.
- Imagen principal con `loading="lazy"`, sin dimensiones, o un JPEG de 3000px.
- Importar una biblioteca de utilidades entera (`lodash`, `moment`) para una sola función.
- `ssr: false` de forma global para no pensar en la hidratación.

## Lista de verificación

- [ ] Los datos del renderizado inicial usan `useFetch`/`useAsyncData`; las acciones usan `$fetch`.
- [ ] Toda llamada asíncrona tiene una clave única que incluye todas las entradas; la interfaz maneja `pending`, `error` y vacío.
- [ ] Sin advertencias de hidratación en la consola del navegador al recargar por completo cada página tocada.
- [ ] La carga útil contiene solo los campos renderizados; sin secretos; valores no serializables transformados.
- [ ] La imagen del LCP es eager y de prioridad alta con dimensiones; las demás son diferidas; fuentes mediante `@nuxt/fonts`.
- [ ] `useSeoMeta` definido; estado 404 correcto para las entidades ausentes.
- [ ] Capa de caché elegida por ruta; sin caché compartida de datos por usuario.
- [ ] Lighthouse y Web Vitals con perfil móvil cumplen los presupuestos (`sumi:performance`).

## Catálogo de desajustes de hidratación y soluciones

### Cómo diagnosticar

1. Recarga la página por completo con la consola de las devtools abierta. Vue registra el nodo que no coincide en desarrollo.
2. Compara Ver código fuente (HTML del servidor) con el panel Elementos justo después de la carga.
3. Biseca: envuelve temporalmente los subárboles sospechosos en `<ClientOnly>` para localizar al culpable, luego corrige la
   causa y quita el envoltorio.
4. Comprueba si hay extensiones del navegador que inyecten marcado (prueba en un perfil limpio) antes de culpar al código.

### Patrones

#### APIs solo de navegador

```ts
// BAD: crashes on server or renders different branch
const isMobile = window.innerWidth < 768

// GOOD: server and first client render agree (false), then update after mount
const isMobile = ref(false)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 767px)')
  isMobile.value = mq.matches
  mq.addEventListener('change', (e) => { isMobile.value = e.matches })
})
```

Aún mejor: resuelve las diferencias de composición con CSS (media queries o container queries) para que no haya una rama de JS.

#### Fechas y zonas horarias

Lo probable es que el servidor se ejecute en UTC; el navegador de la persona usuaria no. Dar formato sin una zona horaria explícita
produce cadenas distintas.

```ts
const fmt = new Intl.DateTimeFormat('es-CO', {
  dateStyle: 'medium', timeZone: 'America/Bogota',
})
const label = computed(() => fmt.format(new Date(event.value.startsAt)))
```

Para las etiquetas de "hace X tiempo": renderiza la fecha absoluta en el servidor dentro de `<time datetime="...">`, y luego
cámbiala por texto relativo en `onMounted`. O renderiza el texto relativo solo en el cliente con un marcador de posición de ancho fijo.

#### Contenido específico de la persona usuaria

Si el servidor no puede ver la sesión, renderiza la vista sin sesión iniciada y el cliente renderiza la vista
con sesión iniciada. Opciones:
- Una cookie de sesión legible en el servidor (`useCookie`, o cookies de sesión de Firebase verificadas en un middleware
  de Nitro) para que ambos lados coincidan.
- La ruta es `ssr: false` (paneles).
- Una isla pequeña que depende de la autenticación (`<ClientOnly>`) con un esqueleto de dimensiones idénticas.

#### Estado de interfaz persistido (tema, avisos descartados)

localStorage es invisible para el servidor. Usa una cookie (`useCookie('theme')`) para que el SSR renderice la
variante correcta, o un módulo que inyecte un script en línea bloqueante antes de la hidratación
(`@nuxtjs/color-mode`).

#### HTML inválido

El analizador del navegador corrige en silencio el anidamiento inválido, así que su DOM difiere del árbol virtual de Vue.
Infractores habituales: elementos de bloque dentro de `<p>`, interactivos dentro de interactivos (`<button>` en `<a>`),
`<tr>` directamente dentro de `<table>` sin `<tbody>` en algunos casos, `<li>` fuera de las listas.
Ejecuta el validador de HTML sobre la salida renderizada si tienes dudas.

#### Orden no determinista

`Object.keys` sobre datos ensamblados en distinto orden, iteración de `Set` con datos rellenados de forma asíncrona, o
`sort()` con un comparador inestable. Ordena de forma determinista en el servidor y transfiere el resultado.

### Trampas de la obtención de datos que parecen errores de hidratación

- `useAsyncData` con `server: false` no devuelve datos durante la hidratación; el primer renderizado del cliente debe
  coincidir con el estado vacío o pendiente del servidor. Renderiza un esqueleto para `pending`.
- Colisión de claves: dos componentes que usan la misma clave para datos distintos reciben la carga útil del otro.
- Mutar in situ el objeto de datos de la carga útil en el cliente antes del montaje.

### Datos de Firestore en la carga útil

`Timestamp`, `DocumentReference` y `GeoPoint` no son JSON simple. Convierte en `transform`:

```ts
const { data } = await useAsyncData(`post:${slug}`, () => getPost(slug), {
  transform: (p) => p && ({ ...p, publishedAt: p.publishedAt.toMillis() }),
})
```

O convierte en la frontera del repositorio para que los componentes nunca vean tipos del SDK.
