---
title: "next-app-router"
description: "Arquitectura del App Router de Next.js: Server Components por defecto, fronteras de cliente en las hojas, grupos de rutas y layouts anidados, archivos loading/error/not-found, Metadata API, route handlers, proxy (antes middleware), entorno y configuración, y convenciones de carpetas. Úsala al crear o reestructurar rutas, layouts o páginas; al tocar app/**, src/app/**, page.tsx, layout.tsx, route.ts, loading.tsx, error.tsx, not-found.tsx, proxy.ts o middleware.ts, next.config.*, .env*; al decidir dónde va una directiva 'use client'; o al revisar la estructura de un proyecto Next.js."
source-hash: "4d8ae570f18b24ac"
---

# Next.js App Router

Objetivo: Next.js 16 + React 19.2, TypeScript en modo estricto. Los valores por defecto de abajo asumen solo App Router (sin `pages/`). Para datos y caché consulta `next-data-caching`; para el interior de los componentes consulta `react-components`.

## Principios

1. **Servidor por defecto.** Todo archivo de `app/` es un Server Component mientras no se demuestre lo contrario. El código de servidor no pesa en el bundle; el código de cliente lo paga cada visitante.
2. **Las fronteras de cliente son hojas.** `'use client'` marca un punto de entrada al grafo de cliente, no "este archivo usa React". Empújalo hacia abajo, hasta la isla interactiva más pequeña.
3. **El sistema de archivos es el enrutador, no la arquitectura.** `app/` contiene archivos de enrutado y composición delgada. La lógica de dominio vive en `src/features/*` o `src/lib/*`.
4. **Cada segmento es dueño de sus estados.** La carga, el error y el not-found se diseñan por segmento, no se añaden al final de forma global.
5. **Falla cerrado en el servidor.** La autenticación, la validación y los secretos se aplican en código de servidor (los layouts no son una frontera de seguridad; mira más abajo).

## Convenciones de carpetas

```
src/
  app/
    (marketing)/            # route group: own layout, no URL segment
      layout.tsx
      page.tsx
    (app)/
      layout.tsx            # authed shell
      dashboard/
        page.tsx
        loading.tsx
        error.tsx
        _components/        # private folder: colocated, never routable
    api/webhooks/stripe/route.ts
    layout.tsx              # root: <html>, <body>, fonts, providers
    not-found.tsx
    global-error.tsx
  features/<domain>/        # queries.ts, actions.ts, schema.ts, components/
  lib/                      # db, auth, env, utils (server-only where relevant)
  components/ui/            # design-system primitives (tokens from DESIGN.md)
proxy.ts                    # only if truly needed
```

- Coloca los componentes exclusivos de una ruta en `_components/`; promuévelos a `features/` cuando una segunda ruta los necesite.
- Marca los módulos solo de servidor con `import 'server-only'` (clientes de base de datos, firebase-admin, secretos). Marca los módulos solo de navegador con `import 'client-only'`.
- Árbol completo con su justificación: `references/structure.md`.

## Frontera servidor-cliente

ASÍ SÍ: mantén la página en el servidor y pasa datos serializables a una hoja de cliente pequeña:

```tsx
// app/(app)/products/[id]/page.tsx  (Server Component)
export default async function Page({ params }: PageProps<'/products/[id]'>) {
  const { id } = await params;                 // params is async (Next 15+)
  const product = await getProduct(id);
  if (!product) notFound();
  return (
    <article>
      <h1>{product.name}</h1>
      <ProductGallery images={product.images} />  {/* server */}
      <AddToCartButton productId={product.id} />  {/* 'use client' leaf */}
    </article>
  );
}
```

ASÍ NO: `'use client'` en la página "porque un botón necesita onClick". Eso envía al navegador todo el árbol, sus dependencias y la lógica de su marcado.

- Pasa Server Components *dentro* de componentes de cliente mediante `children` o props de ranura; el componente de cliente nunca los importa.
- Las props que cruzan la frontera deben ser serializables: nada de funciones (salvo Server Actions), instancias de clase, ni un `Date` que esperes que siga siendo `Date` sin cuidado.
- Los proveedores de contexto son componentes de cliente: envuélvelos en un único `app/providers.tsx` y renderízalo lo más profundo posible (no alrededor de `<html>` si solo `(app)` lo necesita).
- Los ayudantes globales `PageProps` / `LayoutProps` vienen de las rutas tipadas; verifica su disponibilidad y el indicador (`typedRoutes`) en la documentación actual; si no, tipa `params: Promise<{ id: string }>`.

## Layouts, grupos, plantillas

- Los layouts persisten entre navegaciones y no se vuelven a renderizar; pon ahí la interfaz de la carcasa y los proveedores, nunca datos por petición en los que el hijo deba confiar.
- **Los layouts no son puertas de autenticación.** Una comprobación en un layout no se vuelve a ejecutar en la navegación de cliente entre hermanos, y a las páginas, acciones y route handlers se puede llegar directamente. Comprueba la autenticación en la capa de acceso a datos y en cada Server Action.
- Usa grupos de rutas `(name)` para carcasas separadas (marketing frente a app) y para varios layouts raíz.
- Usa `template.tsx` solo cuando necesites remontar en cada navegación (animaciones de entrada, reinicio del estado por página).
- Las rutas paralelas (`@slot`) necesitan un `default.tsx` explícito en Next 16. Úsalas para modales con rutas interceptoras `(.)photo/[id]`, no para la composición corriente.

## Loading, error, not-found

- `loading.tsx` = una frontera de Suspense automática para el segmento. Hazlo un esqueleto fiel al layout (mismas dimensiones) para evitar CLS. Prefiere `<Suspense>` granulares dentro de la página para las partes lentas.
- `error.tsx` debe ser `'use client'`; recibe `error` y `reset`. Muestra un mensaje comprensible, registra `error.digest`, y nunca muestres a los usuarios el `error.message` del servidor.
- `global-error.tsx` reemplaza el layout raíz: incluye `<html>` y `<body>`.
- Llama a `notFound()` desde `next/navigation` cuando falte un recurso; da estilo a `not-found.tsx` por segmento donde el contexto importe.
- `redirect()` lanza una excepción: no lo envuelvas en un `try/catch` que se la trague.

## Metadatos

```tsx
export async function generateMetadata({ params }: PageProps<'/blog/[slug]'>): Promise<Metadata> {
  const post = await getPost((await params).slug); // dedupe with React cache()
  return {
    title: post.title,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: { images: [post.ogImage] },
  };
}
```

- Define `metadataBase` y un `title.template` en el layout raíz.
- Usa las convenciones de archivo: `opengraph-image.tsx`, `icon.tsx`, `sitemap.ts`, `robots.ts`, `manifest.ts`.
- `viewport` / `themeColor` van en `export const viewport`, no en `metadata`.
- Define `<html lang>` en el layout raíz (`sumi:a11y`).

## Route handlers

- Usa `route.ts` para webhooks, APIs públicas, callbacks de OAuth y respuestas de archivos o flujos. **No** construyas una capa REST interna para tus propias páginas: los Server Components leen los datos directamente, y las mutaciones pasan por Server Actions.
- Los manejadores `GET` son dinámicos por defecto (desde la 15). Valida la entrada con zod, devuelve `Response.json()` tipado y fija códigos de estado explícitos.
- Verifica las firmas de los webhooks antes de tratar el cuerpo como confiable.

## Proxy (antes middleware)

- Next 16 renombra `middleware.ts` a `proxy.ts` (verifica el runtime y las opciones de matcher en la documentación actual). Resérvalo para: redirecciones y reescrituras, negociación de idioma i18n, comprobaciones baratas de presencia de cookies, cabeceras.
- NO hagas ahí obtención de datos, verificación de autenticación pesada ni llamadas a la base de datos. Se ejecuta en cada petición que coincide. Define siempre un `matcher` estrecho que excluya `_next/static`, imágenes y recursos.
- Una redirección optimista en el proxy está bien; la autorización real sigue ocurriendo en el servidor, junto a los datos.

## Entorno y configuración

- Un único `src/lib/env.ts` valida `process.env` con zod al arrancar; importa desde él y nunca leas `process.env` de forma improvisada.
- `NEXT_PUBLIC_*` se incrusta en los bundles de cliente en tiempo de compilación: nunca pongas secretos ahí; trata su valor como público.
- Mantén `next.config.ts` tipado (`NextConfig`), mínimo y comentado cuando un indicador no sea obvio (`cacheComponents`, `reactCompiler`, `images.remotePatterns`).
- Turbopack es el empaquetador por defecto en la 16; evita la configuración exclusiva de webpack salvo que sea necesaria.
- Firebase: el SDK de cliente solo en componentes de cliente; `firebase-admin` detrás de `server-only`. La verificación de sesión ocurre en el servidor.

## Navegación

- `<Link>` para la navegación interna (la precarga es automática en producción). `useRouter` solo para casos imperativos tras un evento.
- `useSearchParams` fuerza el renderizado en cliente hasta el Suspense más cercano: envuelve al consumidor en `<Suspense>`. En el servidor, lee `searchParams` de las props de la página.
- Usa `next/form` para los formularios de búsqueda o filtro que actualizan la URL.

## Señales de relleno de IA

- `'use client'` al principio de todos los archivos, incluidas páginas y layouts.
- `useEffect(() => fetch('/api/...'))` en un componente de cliente para cargar datos que el servidor podría haber renderizado.
- Una ruta `app/api/*` por cada consulta, llamada desde tus propios Server Components.
- Autenticación comprobada solo en un layout o solo en el proxy.
- Leer `params` de forma síncrona, o `any` para las props de página.
- Un único `layout.tsx` gigante con todos los proveedores envolviendo `<html>`.
- `loading.tsx` con un spinner centrado que desplaza todo el layout.
- `process.env.X!` esparcido por los componentes.

## Lista de verificación

- [ ] Ningún `'use client'` en páginas o layouts salvo que se justifique en un comentario; las islas de cliente son hojas.
- [ ] Los módulos solo de servidor importan `server-only`; sin secretos en `NEXT_PUBLIC_*`.
- [ ] Cada segmento nuevo tiene un estado de carga, una frontera de error y una ruta not-found deliberados.
- [ ] Metadatos (título, descripción, canonical, OG) definidos; `lang` en `<html>`.
- [ ] La autenticación y la autorización se aplican en el acceso a datos y en las acciones, no solo en el layout o el proxy.
- [ ] `params`/`searchParams` con await y tipados; sin `any`.
- [ ] El proxy (si existe) tiene un matcher estrecho y no obtiene datos.
- [ ] Contrastado con `sumi:a11y`, `sumi:performance`, `sumi:js-ts`.

## Referencia de estructura del proyecto

Organización con criterio para una aplicación Next.js de escala freelance (sitio de marketing + aplicación autenticada), con backend Firebase o SQL.

```
.
├── next.config.ts
├── proxy.ts                         # optional; redirects/i18n only
├── src/
│   ├── app/
│   │   ├── layout.tsx               # <html lang>, <body>, next/font, metadataBase
│   │   ├── not-found.tsx
│   │   ├── global-error.tsx         # 'use client', includes <html>/<body>
│   │   ├── sitemap.ts
│   │   ├── robots.ts
│   │   ├── (marketing)/
│   │   │   ├── layout.tsx           # header/footer, no auth providers
│   │   │   ├── page.tsx
│   │   │   └── blog/[slug]/
│   │   │       ├── page.tsx
│   │   │       └── opengraph-image.tsx
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (app)/
│   │   │   ├── layout.tsx           # app shell + providers.tsx
│   │   │   ├── providers.tsx        # 'use client': theme, toasts, query client if any
│   │   │   └── projects/
│   │   │       ├── page.tsx
│   │   │       ├── loading.tsx
│   │   │       ├── error.tsx
│   │   │       ├── [id]/page.tsx
│   │   │       └── _components/
│   │   │           ├── project-table.tsx
│   │   │           └── project-filters.tsx   # 'use client'
│   │   └── api/
│   │       └── webhooks/stripe/route.ts
│   ├── features/
│   │   └── projects/
│   │       ├── schema.ts            # zod schemas + inferred types (shared)
│   │       ├── queries.ts           # 'server-only'; reads, auth-scoped, cached
│   │       ├── actions.ts           # 'use server'; mutations
│   │       └── components/          # domain components reused across routes
│   ├── components/
│   │   └── ui/                      # primitives (Button, Dialog...) built on Radix/React Aria + DESIGN.md tokens
│   ├── lib/
│   │   ├── env.ts                   # zod-validated env
│   │   ├── auth.ts                  # 'server-only'; getSession(), requireUser()
│   │   ├── db.ts | firebase-admin.ts# 'server-only'
│   │   ├── firebase-client.ts       # 'client-only'
│   │   └── utils.ts                 # cn(), formatters
│   └── styles/globals.css           # tokens + Tailwind layers (sumi:css-architecture)
└── tests/
    └── e2e/                         # Playwright
```

### Reglas detrás de la organización

- Los archivos de `app/` se mantienen delgados: obtén datos vía `features/*/queries.ts`, renderiza componentes de dominio, y listo. Una página de más de ~80 líneas es una señal de alarma.
- `features/<domain>` es la unidad de propiedad. Las importaciones entre funcionalidades pasan por los archivos públicos de la funcionalidad (`queries.ts`, `actions.ts`, `components/index.ts`), no por rutas profundas.
- `queries.ts` es la capa de acceso a datos: cada función resuelve al usuario actual y autoriza antes de devolver datos. Devuelve DTOs (solo los campos que necesita la interfaz), nunca documentos crudos de la base de datos con campos internos.
- `components/ui` no sabe nada de dominios. Los componentes de dominio no saben nada de enrutado.
- Las pruebas viven junto al código (`*.test.ts(x)`), excepto las E2E.
- Alias de ruta: `@/*` -> `src/*`. Nada de `../../../`.

### Nomenclatura

- Archivos: kebab-case (`project-table.tsx`). Componentes: exportaciones en PascalCase. Un componente exportado por archivo; se permiten pequeños ayudantes privados.
- Acciones: verbo primero (`createProject`, `archiveProject`). Consultas: `getX`, `listX`.
- Los grupos de rutas nombran la carcasa, no la funcionalidad: `(marketing)`, `(app)`, `(auth)`.

### Esbozo de env.ts

```ts
import 'server-only';
import { z } from 'zod';

const schema = z.object({
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.string().url(),
});

export const env = schema.parse(process.env);
```

Los valores visibles para el cliente necesitan un módulo aparte que lea cada `NEXT_PUBLIC_*` de forma explícita (el acceso estático es necesario para la incrustación).
