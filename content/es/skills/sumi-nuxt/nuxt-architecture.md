---
title: "nuxt-architecture"
description: "Estructura y convenciones para aplicaciones Nuxt 4 (y Nuxt 3 tardío): srcDir app/, fronteras entre shared/ y server/, layers, disciplina con los auto-imports, composables frente a utils y stores de Pinia, rutas de servidor Nitro, runtimeConfig, renderizado híbrido con routeRules, manejo de errores y tipado de extremo a extremo. Úsala al crear o reorganizar un proyecto Nuxt, al añadir páginas, composables, stores o rutas de servidor, o al editar nuxt.config.ts, app.config.ts, app/**, server/**, shared/**, layers/**, middleware o plugins."
source-hash: "f91e8d65d6ceef61"
---

# Arquitectura de Nuxt

Nuxt te da mucho gratis. El trabajo consiste en evitar que ese extra se convierta en una bola de barro implícita, sin tipos,
donde todo importa todo. La estructura sigue a *dónde se ejecuta el código* (cliente, servidor, ambos)
y a *quién posee el estado* (componente, página, aplicación).

## Principios básicos

1. **La frontera de ejecución es el eje principal.** `app/` se ejecuta en el navegador y durante el SSR. `server/` se ejecuta
   solo en Nitro. `shared/` es código puro e isomórfico (tipos, esquemas, funciones puras) que usan ambos.
   Nunca importes de `server/` a `app/` ni al revés.
2. **Gana el propietario más pequeño.** El estado vive en el componente hasta que dos hermanos lo necesitan, luego en un
   composable o página, después en `useState`, y solo entonces en un store de Pinia.
3. **Los auto-imports son una comodidad, no una arquitectura.** Solo `composables/`, `utils/` y
   `components/` se escanean automáticamente. No amplíes `imports.dirs` a todas las carpetas.
4. **Tipado de extremo a extremo.** Los manejadores del servidor devuelven datos tipados, `$fetch`/`useFetch` los infieren, los esquemas
   de validación en `shared/` son la única fuente de verdad para las formas. Sin `any`, sin `as unknown as`.
5. **El modo de renderizado es una decisión por ruta**, tomada en `routeRules`, no un valor global por defecto dejado en piloto automático.

## Estructura de directorios (Nuxt 4)

```
app/
  assets/ components/ composables/ layouts/ middleware/ pages/ plugins/ utils/
  app.vue  app.config.ts  error.vue
server/
  api/        # /api/* handlers
  routes/     # non-/api endpoints (sitemap, webhooks, feeds)
  middleware/ # Nitro middleware (runs on every request - keep tiny)
  utils/      # server-only helpers, auto-imported inside server/
shared/
  types/  utils/  schemas/   # isomorphic; auto-imported in app and server (verify per version)
layers/       # local layers auto-registered from ~/layers (Nuxt 3.12+/4)
nuxt.config.ts
```

Agrupa por funcionalidad *dentro* de estas carpetas cuando un dominio tenga 4 o más archivos: `components/booking/`,
`composables/booking/` (los nombres de componente pasan a ser `BookingCalendar`). No inventes un árbol
paralelo `src/features/` que choque con las convenciones de Nuxt. Consulta `references/layout-and-layers.md`.

## Qué va dónde

| Tipo | Carpeta | Regla |
| --- | --- | --- |
| Función pura, sin contexto de Vue ni de Nuxt | `shared/utils` o `app/utils` | Se prueba con pruebas unitarias sin montar nada |
| Lógica reactiva que usa `ref`/`useFetch`/`useRoute` | `app/composables` | Nómbrala `useX`, devuelve refs + funciones, llámala solo en setup, plugins o middleware |
| Estado de cliente entre páginas (carrito, interfaz de sesión, asistente que abarca rutas) | Store de Pinia | Sintaxis de setup store, un dominio por store |
| Valor compartido con alcance de petición y seguro para SSR | `useState('key')` | Nunca un `ref()` a nivel de módulo |
| Secretos, llamadas a APIs de terceros, acceso de administración a la base de datos | `server/` | Expuesto mediante `/api/*` con validación |
| Tipos o esquemas que usan ambos lados | `shared/` | Sin importaciones de `#app`, `h3` ni del DOM |

**NO** pongas estado reactivo a nivel de módulo en un archivo de composable:

```ts
// BAD: shared across every SSR request -> cross-user data leak
const user = ref<User | null>(null)
export const useUser = () => user
```

**SÍ** usa `useState` (con alcance de petición en el servidor, hidratado en el cliente):

```ts
export const useUser = () => useState<User | null>('user', () => null)
```

### Pinia: solo cuando se justifica

Usa Pinia cuando el estado se comparte entre rutas *y* tiene acciones o valores derivados que valga la pena centralizar.
Un store que envuelve un único `useFetch` es ruido. Usa setup stores, devuelve todo lo que quieras que
vean las devtools y el SSR, y nunca llames a `useRoute`/`useFetch` en el nivel superior de la definición del store salvo que
entiendas el contexto de inyección.

```ts
export const useCartStore = defineStore('cart', () => {
  const lines = ref<CartLine[]>([])
  const total = computed(() => lines.value.reduce((s, l) => s + l.qty * l.unitPrice, 0))
  function add(line: CartLine) { /* ... */ }
  return { lines, total, add }
})
```

## Rutas de servidor (Nitro)

- Un archivo por método: `server/api/projects/[id].get.ts`, `[id].patch.ts`.
- Valida cada entrada con un esquema de `shared/schemas` (Zod/Valibot):
  `await readValidatedBody(event, ProjectPatch.parse)`, `getValidatedQuery`, `getValidatedRouterParams`.
- Lanza `createError({ statusCode, statusMessage })` con un mensaje seguro; nunca filtres trazas de pila ni
  cuerpos de error del origen. (h3 v2 puede renombrar los campos a `status`/`statusText`; verifica con la documentación vigente.)
- Devuelve objetos simples y serializables. Deja que la inferencia llegue hasta `useFetch('/api/projects/1')`.
- Usa `defineCachedEventHandler` / `cachedFunction` para lecturas costosas y cacheables con un
  `maxAge` y un `getKey` explícitos.
- Los ayudantes solo de servidor (`requireUser(event)`, clientes de base de datos) viven en `server/utils`.

```ts
// server/api/projects/[id].patch.ts
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { id } = await getValidatedRouterParams(event, IdParam.parse)
  const patch = await readValidatedBody(event, ProjectPatch.parse)
  return updateProject(user.uid, id, patch) // typed Project
})
```

## runtimeConfig frente a app.config

- `runtimeConfig`: valores que difieren por entorno, fijados mediante variables de entorno `NUXT_*` en tiempo de ejecución.
  Las claves de nivel superior son solo de servidor; `public` se envía al cliente. Nunca pongas secretos en `public`.
- `app.config.ts`: ajustes de la aplicación en tiempo de compilación, públicos y no secretos (indicadores de tema, navegación). Reactivo y tipado.
- Nunca leas `process.env` dentro del código de `app/`. Dentro de `server/`, prefiere `useRuntimeConfig(event)`.

```ts
runtimeConfig: {
  stripeSecret: '',            // NUXT_STRIPE_SECRET
  public: { siteUrl: '' },     // NUXT_PUBLIC_SITE_URL
},
```

## Renderizado: routeRules

Decide por ruta y déjalo escrito:

```ts
routeRules: {
  '/':            { prerender: true },
  '/blog/**':     { isr: 3600 },          // CDN-cached, revalidated (platform support varies)
  '/products/**': { swr: 600 },
  '/app/**':      { ssr: false },          // authenticated dashboard, SPA is fine
  '/api/public/**': { cache: { maxAge: 300 }, cors: true },
  '/old-path':    { redirect: { to: '/new-path', statusCode: 301 } },
},
```

Páginas de marketing y de contenido: prerenderizado o ISR para el LCP. Paneles solo para usuarios autenticados: `ssr: false` evita
la complejidad de la hidratación y la infraestructura de autenticación en el servidor. Detalles de datos y SEO: `nuxt-data-ssr`.

## Manejo de errores

- Páginas: `throw createError({ statusCode: 404, statusMessage: 'Project not found', fatal: true })`
  cuando falten los datos, para que el código de estado sea correcto para los rastreadores.
- `app/error.vue` renderiza los errores de página completa; ofrece `clearError({ redirect: '/' })`.
- `<NuxtErrorBoundary>` alrededor de las islas riesgosas (widgets de terceros) para que un fallo no deje la página en blanco.
- Los composables devuelven `{ data, error, status }`; los componentes renderizan el estado de error. Nada de `catch {}` silenciosos.
- Registra los errores del servidor con contexto (ruta, id de usuario), nunca cargas con datos personales.

## Plugins y middleware

- Los plugins se ejecutan en cada arranque de la aplicación: mantenlos pocos y rápidos. Usa los sufijos `.client.ts`/`.server.ts` y
  `parallel: true` cuando sean independientes. Sin obtención de datos en plugins salvo que sea realmente global.
- Middleware de ruta: solo guardas de autenticación y redirecciones. Middleware con nombre mediante `definePageMeta`; evita
  el middleware global que obtiene datos.

## Tipado

- `nuxi typecheck` (vue-tsc) se ejecuta en la CI. `strict: true`.
- Tipa `definePageMeta`, `useState<T>`, `useRuntimeConfig()` (amplía si hace falta) y el esquema de `app.config`.
- Infiere los tipos de respuesta del servidor; nunca vuelvas a declarar la misma interfaz en el cliente. Consulta `sumi:js-ts`.

## Antipatrones (señales de relleno de IA)

- Rearquitectura al estilo `src/`, carpetas `services/`, `helpers/`, `lib/`, `managers/` que hacen todas lo mismo.
- Añadir todas las carpetas a `imports.dirs` "por comodidad"; globales misteriosos que nadie puede rastrear.
- Un store de Pinia por página, cada uno envolviendo una sola petición.
- `ref()` a nivel de módulo en composables (fuga de estado en el SSR).
- Secretos en `runtimeConfig.public` o `process.env.X` en componentes.
- Manejadores de servidor sin validación, que devuelven `any`, que capturan errores y devuelven `{ success: false }` con un 200.
- `ssr: false` global porque un componente tocó `window`.
- Archivos barril `index.ts` que reexportan código auto-importado.
- Plugins que hacen `await $fetch(...)` en cada carga de página.

## Lista de verificación

- [ ] El código está en la carpeta de ejecución correcta (`app/`, `server/`, `shared/`); sin importaciones cruzadas.
- [ ] Sin estado reactivo a nivel de módulo; el estado compartido usa `useState` o un store de Pinia justificado.
- [ ] Cada ruta de servidor valida la entrada con un esquema compartido y devuelve datos tipados.
- [ ] Secretos solo en `runtimeConfig` privado; nada secreto en `public` ni en `app.config`.
- [ ] `routeRules` declara la estrategia de renderizado de cada grupo de rutas.
- [ ] Los datos ausentes lanzan `createError` con el estado correcto; existe `error.vue`.
- [ ] `nuxi typecheck` pasa con `strict`, cero `any`.
- [ ] Nueva dependencia o layer justificada; impacto en el bundle comprobado (`sumi:performance`).

## Composición, agrupación por funcionalidad y layers

### Agrupación por funcionalidad dentro de las convenciones de Nuxt

Conserva las carpetas de nivel superior de Nuxt y agrupa por dominio dentro de ellas:

```
app/components/booking/Calendar.vue        -> <BookingCalendar>
app/components/booking/SlotPicker.vue      -> <BookingSlotPicker>
app/composables/booking/useAvailability.ts -> auto-imported? only if nested scan enabled
app/pages/booking/[serviceId].vue
server/api/booking/slots.get.ts
shared/schemas/booking.ts
```

Los composables anidados NO se auto-importan por defecto (solo los archivos de nivel superior y `index.ts` en
las subcarpetas). Opciones, por orden de preferencia:

1. Mantén los composables planos con un prefijo de dominio: `useBookingAvailability.ts`.
2. Importación explícita desde la ruta anidada (procedencia clara, adecuado para código privado de la funcionalidad).
3. Añade un único patrón de escaneo: `imports: { dirs: ['composables/**'] }`; solo si el equipo está de acuerdo.

### Cuándo usar layers

Un layer es una aplicación Nuxt parcial (con su propio `nuxt.config.ts`, componentes, composables, rutas de servidor)
fusionada en el anfitrión. Úsalo cuando:

- Varios sitios de clientes comparten una base (autenticación, kit de interfaz, analítica, páginas legales). Publícala como layer de git o npm
  y `extends: ['github:org/base-layer#v1.2.0']`; fija una etiqueta, nunca una rama móvil.
- Una aplicación grande tiene dominios claramente separables (administración frente a tienda) y quieres fronteras impuestas.

No uses un layer para organizar código puntual en una aplicación pequeña; las carpetas bastan.

Reglas:
- Los layers poseen sus valores por defecto de `runtimeConfig`; el anfitrión los sobrescribe mediante variables de entorno.
- Prefija los componentes del layer (`components: [{ path: './components', prefix: 'Base' }]`) para evitar
  colisiones de nombres y hacer evidente la procedencia.
- Resuelve las rutas relativas al layer con `fileURLToPath(new URL('./x', import.meta.url))`, nunca con cadenas
  relativas que se rompen al consumirse.
- Documenta la superficie pública del layer (componentes, composables, claves de configuración) en su README.

### Forma de un composable

```ts
// app/composables/useProjectList.ts
export function useProjectList(filters: MaybeRefOrGetter<ProjectFilters>) {
  const query = computed(() => toValue(filters))
  const { data, status, error, refresh } = useFetch('/api/projects', {
    query,
    key: () => `projects:${JSON.stringify(query.value)}`, // reactive keys: verify support in your version
    default: () => [],
  })
  const isEmpty = computed(() => status.value === 'success' && data.value.length === 0)
  return { projects: data, status, error, isEmpty, refresh }
}
```

- Acepta `MaybeRefOrGetter<T>` y normaliza con `toValue`, para que quien llama pueda pasar un ref, un getter o un valor.
- Devuelve refs (no `reactive()`), para que quien llama pueda desestructurar.
- Sin efectos secundarios en el momento de la importación.

### Patrón de utils de servidor

```ts
// server/utils/auth.ts
export async function requireUser(event: H3Event) {
  const token = getHeader(event, 'authorization')?.replace(/^Bearer /, '')
  if (!token) throw createError({ statusCode: 401, statusMessage: 'Unauthorized' })
  const decoded = await verifyIdToken(token) // firebase-admin, server-only
  return decoded
}
```

Los utils de servidor se auto-importan solo dentro de `server/`. Mantén ahí firebase-admin y otros SDK pesados.

### Base de nuxt.config.ts

```ts
export default defineNuxtConfig({
  compatibilityDate: '2026-01-01',   // set when the project is created, bump deliberately
  future: { compatibilityVersion: 4 }, // only needed on Nuxt 3.x opting into v4 behavior
  devtools: { enabled: true },
  typescript: { strict: true, typeCheck: false }, // run vue-tsc in CI instead of dev
  modules: ['@nuxt/image', '@nuxt/fonts', '@pinia/nuxt'],
  routeRules: { /* per-route render strategy */ },
  runtimeConfig: { public: {} },
})
```

Cada módulo añadido debe ganarse su lugar: envía código, aumenta el tiempo de compilación y se convierte en una dependencia
de mantenimiento. Comprueba que admita la versión mayor actual de Nuxt antes de instalarlo.
