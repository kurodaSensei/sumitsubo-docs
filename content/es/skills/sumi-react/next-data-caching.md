---
title: "next-data-caching"
description: "Obtención de datos, caché y mutaciones en el App Router de Next.js: fetch en Server Components, el modelo de Cache Components ('use cache', cacheLife, cacheTag), revalidateTag/updateTag/revalidatePath, APIs dinámicas (cookies, headers, searchParams), Server Actions con validación zod y autenticación por acción, streaming con Suspense y cómo evitar cascadas. Úsala al escribir queries.ts/actions.ts, cualquier código con 'use server' o 'use cache', llamadas a fetch() en app/**, formularios que mutan datos, lógica de revalidación, indicadores de caché en next.config.*, o al depurar datos obsoletos, un TTFB lento o cascadas de peticiones."
source-hash: "d31193e3eced9152"
---

# Datos, caché y Server Actions en Next.js

Objetivo: Next.js 16 con `cacheComponents: true`. La semántica de la caché cambió bastante entre la 14, la 15 y la 16; si el proyecto usa una versión anterior o tiene el indicador desactivado, **verifica con la documentación actual** antes de aplicar las secciones de caché. El patrón completo de Server Actions: `references/server-actions.md`.

## Modelo mental (Next 16, Cache Components)

- **Nada se cachea salvo que lo indiques.** `fetch` no usa caché por defecto (desde la 15). Los datos son frescos en cada petición.
- **Activa la caché con `'use cache'`** a nivel de archivo, componente o función. Los argumentos y los valores capturados pasan a formar parte de la clave de caché; deben ser serializables.
- **Los datos dinámicos deben estar dentro de `<Suspense>`** (o cacheados). Leer `cookies()`, `headers()`, `searchParams`, `params` (no estáticos) o E/S sin caché fuera de una frontera de Suspense es un error en tiempo de compilación con Cache Components. Eso es lo que produce una carcasa estática más huecos dinámicos transmitidos en streaming (el antiguo "PPR").
- **Perfiles en lugar de números mágicos:** `cacheLife('minutes' | 'hours' | 'days' | 'max' | custom)`.
- **Las etiquetas dirigen la invalidación:** `cacheTag('project:123')`, y luego invalida desde las mutaciones.

```ts
// features/projects/queries.ts
import 'server-only';
import { cacheLife, cacheTag } from 'next/cache';

export async function getPublicProject(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag('projects', `project:${slug}`);
  return db.project.findUnique({ where: { slug }, select: publicFields });
}
```

- No leas `cookies()`/`headers()` dentro de un ámbito `'use cache'`. Léelos fuera y pasa el valor necesario como argumento (pasa a formar parte de la clave), o usa la variante de caché privada (`'use cache: private'`; verifica su estado actual).
- Datos por usuario: déjalos sin caché (frescos en cada petición dentro de Suspense) o cachéalos con el id del usuario como argumento. Nunca caches una función que lee la sesión de forma implícita.

## Invalidación

| API | Dónde | Semántica |
|---|---|---|
| `updateTag(tag)` | Solo Server Actions | Expira ya; la siguiente lectura espera datos frescos. Úsala para leer tus propias escrituras. |
| `revalidateTag(tag, profile)` | Acciones, route handlers | Stale-while-revalidate. Next 16 espera un perfil de cacheLife como segundo argumento (p. ej. `'max'`); la forma con un solo argumento está obsoleta. |
| `revalidatePath(path)` | Acciones, route handlers | Tosca; úsala cuando no hay etiquetas modeladas. |
| `refresh()` | Server Actions | Vuelve a renderizar los datos sin caché de la página actual sin tocar las cachés (verifica). |

- Prefiere etiquetas llamadas `entity` y `entity:id`. Invalida la etiqueta más estrecha que cubra el cambio.
- Webhooks (CMS, Stripe, disparadores de Firestore que llaman a un route handler) -> `revalidateTag(tag, 'max')` después de verificar la firma.

## Obtención de datos en Server Components

ASÍ SÍ: inicia el trabajo independiente en paralelo y haz await al final:

```tsx
export default async function Dashboard() {
  const user = await requireUser();
  const [projects, invoices] = await Promise.all([
    listProjects(user.id),
    listInvoices(user.id),
  ]);
  return <DashboardView projects={projects} invoices={invoices} />;
}
```

ASÍ SÍ: mejor aún, separa las partes lentas detrás de Suspense para que la carcasa se transmita en streaming:

```tsx
<Suspense fallback={<InvoicesSkeleton />}>
  <Invoices userId={user.id} />   {/* async server component, fetches its own data */}
</Suspense>
```

ASÍ NO: await secuenciales para datos independientes (`const a = await x(); const b = await y();`).
ASÍ NO: obtener datos en un padre solo para pasarlos por cinco capas de props. Deja que el componente que necesita los datos los obtenga; deduplica con `cache()` de React.

- Envuelve las lecturas por petición usadas en varios sitios (`getCurrentUser`, `getPost` usado por la página y por `generateMetadata`) con `cache()` de `react` para deduplicar dentro de la petición. Esto no es caché persistente.
- Pasa promesas a los componentes de cliente y desenvuélvelas con `use()` cuando el cliente deba empezar a renderizar antes de que los datos se resuelvan.
- Las llamadas a base de datos o SDK (Prisma, Drizzle, firebase-admin) no pasan por `fetch`; su caché es solo la que declares con `'use cache'`.
- Usa `connection()` de `next/server` para marcar explícitamente un componente como dinámico cuando no lee nada específico de la petición pero no debe prerenderizarse (p. ej. `Math.random`, `Date.now`).
- Usa `after()` de `next/server` para el trabajo que no bloquea tras enviar la respuesta (analítica, registros).

## Server Actions

Toda Server Action es un **endpoint HTTP público**. Trátala como una ruta de API.

Orden obligatorio dentro de cada acción:
1. Autentica (`requireUser()`), aunque la página esté detrás de autenticación.
2. Valida la entrada con zod (`safeParse` sobre `FormData`/los argumentos). Nunca confíes en los tipos que vienen del cliente.
3. Autoriza el recurso concreto (propiedad o rol).
4. Muta.
5. Invalida (`updateTag` / `revalidateTag`) y/o `redirect()` (fuera de try/catch).
6. Devuelve un resultado tipado y serializable: `{ status: 'success', ... } | { status: 'error', fieldErrors?, message? }`.

```ts
'use server';
export async function renameProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  const parsed = RenameSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { status: 'error', fieldErrors: z.flattenError(parsed.error).fieldErrors };
  const project = await getOwnedProject(parsed.data.id, user.id);
  if (!project) return { status: 'error', message: 'Not found' };
  await db.project.update({ where: { id: project.id }, data: { name: parsed.data.name } });
  updateTag(`project:${project.id}`);
  return { status: 'success', message: 'Renamed' };
}
```

- Consúmela con `useActionState` + `<form action>` para mejora progresiva; `useFormStatus` para la interfaz de pendiente en los botones de envío; `useOptimistic` para respuesta instantánea (`react-components`).
- Mantén las acciones en `features/<domain>/actions.ts` con `'use server'` al principio. Los cierres `'use server'` en línea dentro de Server Components capturan variables: ten cuidado con lo que capturas (va cifrado, pero se envía igualmente).
- No devuelvas errores crudos de la base de datos ni trazas de pila. Regístralos en el servidor y devuelve un mensaje seguro para el usuario.
- Las acciones son para mutaciones. No las uses para obtener datos que se van a renderizar.
- Limita la tasa de las acciones sensibles (autenticación, formularios de contacto) y añade protección contra bots a los formularios públicos.

## Streaming y experiencia de carga

- Una frontera de Suspense por cada región lenta independiente. Los fallbacks coinciden con las dimensiones finales (CLS, `sumi:performance`).
- Orden: renderiza lo que tienes, transmite en streaming lo que esperas. No bloquees la carcasa por una API de terceros lenta.
- Los fallbacks de Suspense no anuncian nada por defecto; para cargas largas en interfaces de aplicación, ayuda una región viva educada o `aria-busy` en la región (`sumi:a11y`).

## Datos en el cliente

- Por defecto: datos renderizados en el servidor + Server Actions + invalidación mediante etiquetas, sin `router.refresh()`.
- Recurre a TanStack Query (o SWR) solo para datos realmente dirigidos por el cliente: sondeo, scroll infinito, tiempo real, sin conexión. Los oyentes en tiempo real de Firestore (`onSnapshot`) pertenecen a hojas de cliente con limpieza.
- Nunca reflejes datos del servidor en `useState` + un fetch en `useEffect`.

## Señales de relleno de IA

- `export const dynamic = 'force-dynamic'` o `revalidate = 0` esparcidos para "arreglar" datos obsoletos sin entender el modelo.
- `useEffect` + `fetch('/api/...')` en una página de cliente para los datos iniciales.
- Server Action sin autenticación o sin zod, fiándose de `formData.get('userId')`.
- `try { ...; redirect('/x') } catch {}` que se traga la redirección.
- `'use cache'` en una función que llama a `cookies()` o devuelve datos por usuario sin ninguna clave.
- `revalidatePath('/')` tras cada mutación.
- Await secuenciales para consultas independientes; un único `loading.tsx` que bloquea toda la página.
- Devolver registros enteros de la base de datos (con campos internos) a componentes de cliente.

## Lista de verificación

- [ ] Toda función cacheada tiene `cacheLife` y `cacheTag` explícitos; nada por usuario se cachea sin el usuario en la clave.
- [ ] Toda mutación invalida la etiqueta relevante más estrecha.
- [ ] Toda Server Action: autenticación -> zod -> autorización -> mutación -> invalidación -> resultado tipado.
- [ ] Las lecturas independientes son paralelas; las regiones lentas están detrás de Suspense con esqueletos dimensionados.
- [ ] Sin obtención de datos en `useEffect` para el renderizado inicial.
- [ ] Solo cruzan al cliente los DTO; sin secretos ni campos internos.
- [ ] Las APIs específicas de cada versión se han comprobado con la versión de Next.js del proyecto.

## Patrón de referencia de Server Actions

Ejemplo de extremo a extremo: esquema compartido entre cliente y servidor, acción con autenticación, validación, autorización e invalidación, y un formulario accesible que la consume.

### 1. Esquema (compartido)

```ts
// features/projects/schema.ts
import { z } from 'zod';

export const RenameProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(2, 'Use at least 2 characters').max(80),
});

export type ActionState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message?: string; fieldErrors?: Record<string, string[] | undefined> };

export const initialActionState: ActionState = { status: 'idle' };
```

La API de zod 4 (`z.flattenError`, `z.treeifyError`) difiere de la de zod 3 (`error.flatten()`); ajústate a la versión instalada.

### 2. Capa de acceso a datos

```ts
// features/projects/queries.ts
import 'server-only';
import { cache } from 'react';
import { cacheLife, cacheTag } from 'next/cache';

export const getOwnedProject = cache(async (id: string, userId: string) => {
  return db.project.findFirst({
    where: { id, ownerId: userId },
    select: { id: true, name: true, updatedAt: true },
  });
});

export async function listProjects(userId: string) {
  'use cache';
  cacheLife('minutes');
  cacheTag('projects', `projects:user:${userId}`);
  return db.project.findMany({
    where: { ownerId: userId },
    select: { id: true, name: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  });
}
```

### 3. Acción

```ts
// features/projects/actions.ts
'use server';

import { updateTag } from 'next/cache';
import { z } from 'zod';
import { requireUser } from '@/lib/auth';
import { getOwnedProject } from './queries';
import { RenameProjectSchema, type ActionState } from './schema';

export async function renameProject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();                       // 1. authenticate (throws/redirects)

  const parsed = RenameProjectSchema.safeParse({          // 2. validate
    id: formData.get('id'),
    name: formData.get('name'),
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const project = await getOwnedProject(parsed.data.id, user.id); // 3. authorize
  if (!project) return { status: 'error', message: 'Project not found.' };

  try {
    await db.project.update({                            // 4. mutate
      where: { id: project.id },
      data: { name: parsed.data.name },
    });
  } catch (err) {
    console.error('renameProject failed', { projectId: project.id, err });
    return { status: 'error', message: 'Could not save. Try again.' };
  }

  updateTag(`project:${project.id}`);                      // 5. invalidate (read-your-writes)
  updateTag(`projects:user:${user.id}`);
  return { status: 'success', message: 'Project renamed.' }; // 6. typed result
}
```

Si la acción termina con una navegación, llama a `redirect()` después del try/catch, nunca dentro.

### 4. Formulario (hoja de cliente)

```tsx
'use client';

import { useActionState, useId } from 'react';
import { useFormStatus } from 'react-dom';
import { renameProject } from '@/features/projects/actions';
import { initialActionState } from '@/features/projects/schema';

export function RenameProjectForm({ id, name }: { id: string; name: string }) {
  const [state, formAction] = useActionState(renameProject, initialActionState);
  const inputId = useId();
  const errorId = `${inputId}-error`;
  const nameError = state.status === 'error' ? state.fieldErrors?.name?.[0] : undefined;

  return (
    <form action={formAction} noValidate>
      <input type="hidden" name="id" value={id} />
      <label htmlFor={inputId}>Project name</label>
      <input
        id={inputId}
        name="name"
        defaultValue={name}
        required
        aria-invalid={nameError ? true : undefined}
        aria-describedby={nameError ? errorId : undefined}
      />
      {nameError && <p id={errorId}>{nameError}</p>}
      <SubmitButton />
      <p role="status" aria-live="polite">
        {state.status === 'success' ? state.message : state.status === 'error' ? state.message : ''}
      </p>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-disabled={pending}>
      {pending ? 'Saving...' : 'Save'}
    </button>
  );
}
```

Notas:
- Los inputs no controlados con `defaultValue` + `FormData` son lo predeterminado; el formulario funciona antes de la hidratación.
- React 19 reinicia los formularios no controlados tras una acción exitosa. Si necesitas conservar los valores en caso de error, devuelve los valores enviados en el estado o usa `key` de forma deliberada.
- Ejecuta el mismo esquema de zod en el cliente solo si quieres validación en línea instantánea; la comprobación del servidor es la que cuenta.

### Variante con Firebase

- Verifica la cookie de sesión con `firebase-admin` (`verifySessionCookie(cookie, true)`) dentro de `requireUser()`.
- Las escrituras mediante el SDK de administración se saltan las Security Rules: tu acción ES las reglas. Autoriza de forma explícita.
- Tras las escrituras, invalida las etiquetas de la misma manera; los oyentes en tiempo real de Firestore en el cliente se actualizarán por su cuenta.
