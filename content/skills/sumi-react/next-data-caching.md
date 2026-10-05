---
title: "next-data-caching"
description: "Data fetching, caching and mutations in Next.js App Router - fetching in Server Components, the Cache Components model ('use cache', cacheLife, cacheTag), revalidateTag/updateTag/revalidatePath, dynamic APIs (cookies, headers, searchParams), Server Actions with zod validation and per-action auth, streaming with Suspense, avoiding waterfalls. Use when writing queries.ts/actions.ts, any 'use server' or 'use cache' code, fetch() calls in app/**, forms that mutate data, revalidation logic, next.config.* cache flags, or when debugging stale data, slow TTFB or request waterfalls."
plugin: "sumi-react"
kind: "skill"
references: 1
source: "plugins/sumi-react/skills/next-data-caching/SKILL.md"
---

# Next.js data, caching and Server Actions

Target: Next.js 16 with `cacheComponents: true`. Caching semantics changed significantly across 14 -> 15 -> 16; if the project is on an older version or has the flag off, **verify against current docs** before applying the cache sections. Server Action pattern in full: `references/server-actions.md`.

## Mental model (Next 16, Cache Components)

- **Nothing is cached unless you say so.** `fetch` is uncached by default (since 15). Data is fresh per request.
- **Opt in with `'use cache'`** at the file, component or function level. Arguments and closed-over values become part of the cache key; they must be serializable.
- **Dynamic data must be inside `<Suspense>`** (or cached). Reading `cookies()`, `headers()`, `searchParams`, `params` (non-static) or uncached I/O outside a Suspense boundary is a build-time error under Cache Components. This is what produces a static shell + streamed dynamic holes (the old "PPR").
- **Profiles over magic numbers:** `cacheLife('minutes' | 'hours' | 'days' | 'max' | custom)`.
- **Tags drive invalidation:** `cacheTag('project:123')`, then invalidate from mutations.

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

- Do not read `cookies()`/`headers()` inside a `'use cache'` scope. Read them outside and pass the needed value in as an argument (it becomes part of the key), or use the private cache variant (`'use cache: private'` - verify current status).
- Per-user data: either leave uncached (fresh per request inside Suspense) or cache with the user id as an argument. Never cache a function that reads the session implicitly.

## Invalidation

| API | Where | Semantics |
|---|---|---|
| `updateTag(tag)` | Server Actions only | Expire now; next read blocks for fresh data. Use for read-your-own-writes. |
| `revalidateTag(tag, profile)` | Actions, route handlers | Stale-while-revalidate. Next 16 expects a cacheLife profile as 2nd arg (e.g. `'max'`); single-arg form is deprecated. |
| `revalidatePath(path)` | Actions, route handlers | Coarse; use when tags are not modeled. |
| `refresh()` | Server Actions | Re-render uncached data on the current page without touching caches (verify). |

- Prefer tags named `entity` and `entity:id`. Invalidate the narrowest tag that covers the change.
- Webhooks (CMS, Stripe, Firestore triggers calling a route handler) -> `revalidateTag(tag, 'max')` after verifying the signature.

## Fetching in Server Components

DO - start independent work in parallel and await late:

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

DO - better still, split slow parts behind Suspense so the shell streams:

```tsx
<Suspense fallback={<InvoicesSkeleton />}>
  <Invoices userId={user.id} />   {/* async server component, fetches its own data */}
</Suspense>
```

DON'T - sequential awaits for independent data (`const a = await x(); const b = await y();`).
DON'T - fetch in a parent only to prop-drill through five layers. Let the component that needs data fetch it; dedupe with React `cache()`.

- Wrap per-request reads used in several places (`getCurrentUser`, `getPost` used by page and `generateMetadata`) with `cache()` from `react` for request-scoped dedupe. This is not persistent caching.
- Pass promises to client components and unwrap with `use()` when the client needs to start rendering before data resolves.
- Database/SDK calls (Prisma, Drizzle, firebase-admin) do not go through `fetch`; caching for them is only what you declare with `'use cache'`.
- Use `connection()` from `next/server` to explicitly mark a component dynamic when it reads nothing request-specific but must not be prerendered (e.g. `Math.random`, `Date.now`).
- Use `after()` from `next/server` for non-blocking work after the response (analytics, logs).

## Server Actions

Every Server Action is a **public HTTP endpoint**. Treat it like an API route.

Mandatory order inside every action:
1. Authenticate (`requireUser()`), even if the page is behind auth.
2. Validate input with zod (`safeParse` on `FormData`/args). Never trust types from the client.
3. Authorize the specific resource (ownership/role).
4. Mutate.
5. Invalidate (`updateTag` / `revalidateTag`) and/or `redirect()` (outside try/catch).
6. Return a typed, serializable result: `{ status: 'success', ... } | { status: 'error', fieldErrors?, message? }`.

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

- Consume with `useActionState` + `<form action>` for progressive enhancement; `useFormStatus` for pending UI in submit buttons; `useOptimistic` for instant feedback (`react-components`).
- Keep actions in `features/<domain>/actions.ts` with `'use server'` at the top. Inline `'use server'` closures in Server Components capture variables - be careful what you close over (encrypted, but still sent).
- Do not return raw DB errors or stack traces. Log server-side, return a user-safe message.
- Actions are for mutations. Do not use them to fetch data for rendering.
- Rate-limit sensitive actions (auth, contact forms) and add bot protection for public forms.

## Streaming and loading UX

- One Suspense boundary per independently slow region. Fallbacks match final dimensions (CLS, `sumi:performance`).
- Order: render what you have, stream what you wait for. Do not block the shell on a slow third-party API.
- Suspense fallbacks announce nothing by default; for long loads in app UIs, a polite live region or `aria-busy` on the region helps (`sumi:a11y`).

## Client-side data

- Default: server-rendered data + Server Actions + `router.refresh()`-free invalidation via tags.
- Reach for TanStack Query (or SWR) only for genuinely client-driven data: polling, infinite scroll, realtime, offline. Firestore realtime listeners (`onSnapshot`) belong in client leaves with cleanup.
- Never mirror server data into `useState` + `useEffect` fetch.

## AI slop tells

- `export const dynamic = 'force-dynamic'` or `revalidate = 0` sprinkled to "fix" stale data without understanding the model.
- `useEffect` + `fetch('/api/...')` in a client page for initial data.
- Server Action without auth or without zod, trusting `formData.get('userId')`.
- `try { ...; redirect('/x') } catch {}` swallowing the redirect.
- `'use cache'` on a function that calls `cookies()` or returns per-user data keyed by nothing.
- `revalidatePath('/')` after every mutation.
- Sequential awaits for independent queries; one `loading.tsx` blocking the whole page.
- Returning entire DB records (with internal fields) to client components.

## Done checklist

- [ ] Every cached function has explicit `cacheLife` and `cacheTag`; nothing per-user is cached without the user in the key.
- [ ] Every mutation invalidates the narrowest relevant tag.
- [ ] Every Server Action: auth -> zod -> authorize -> mutate -> invalidate -> typed result.
- [ ] Independent reads are parallel; slow regions are behind Suspense with sized skeletons.
- [ ] No data fetching in `useEffect` for initial render.
- [ ] DTOs only cross to the client; no secrets or internal fields.
- [ ] Version-specific APIs checked against the project's Next.js version.

## Server Action reference pattern

End-to-end example: schema shared between client and server, action with auth/validation/authorization/invalidation, and an accessible form consuming it.

### 1. Schema (shared)

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

zod 4 API (`z.flattenError`, `z.treeifyError`) differs from zod 3 (`error.flatten()`); match the installed version.

### 2. Data access layer

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

### 3. Action

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

If the action ends with navigation, call `redirect()` after the try/catch, never inside it.

### 4. Form (client leaf)

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

Notes:
- Uncontrolled inputs with `defaultValue` + `FormData` are the default; the form works before hydration.
- React 19 resets uncontrolled forms after a successful action. If you need to keep values on error, return submitted values in state or use `key` deliberately.
- Run the same zod schema client-side only if you want instant inline validation; the server check is the one that counts.

### Firebase variant

- Verify the session cookie with `firebase-admin` (`verifySessionCookie(cookie, true)`) inside `requireUser()`.
- Writes via admin SDK bypass Security Rules - your action IS the rules. Authorize explicitly.
- After writes, invalidate tags the same way; Firestore realtime listeners on the client will update independently.
