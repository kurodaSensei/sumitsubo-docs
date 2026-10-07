---
title: "react-testing"
description: "Pruebas en aplicaciones React y Next.js: Vitest más React Testing Library para componentes y hooks, MSW para simular la red, Playwright para E2E y para Server Components asíncronos, axe para comprobaciones automáticas de accesibilidad, y pruebas de Server Actions y esquemas de zod como funciones corrientes. Prueba el comportamiento, no la implementación. Úsala al escribir o revisar *.test.ts(x), *.spec.ts, tests/**, e2e/**, vitest.config.*, playwright.config.* o manejadores de MSW, al añadir una funcionalidad o corrección que necesite cobertura, o al decidir qué probar."
source-hash: "5a949c405b7615b8"
---

# Pruebas en React y Next.js

Stack: Vitest (jsdom o happy-dom), React Testing Library con `@testing-library/user-event`, MSW 2, Playwright, `@axe-core/playwright` y `vitest-axe`. Configuración y ayudantes: `references/setup.md`.

## Principios

1. **Prueba lo que observan las personas usuarias y quien llama al código.** La salida renderizada, los roles accesibles, la URL, los efectos de red, los valores devueltos. No el estado, no las tripas de un hook, no los nombres de clase.
2. **Confianza por minuto.** Pocas pruebas E2E para los recorridos críticos, muchas pruebas de integración rápidas para componentes con hijos reales, y pruebas unitarias para la lógica pura.
3. **Simula en la frontera.** Simula la red (MSW) o el módulo de acceso a datos, nunca el componente bajo prueba ni React mismo.
4. **Cada corrección de un fallo se publica con una prueba que falló primero.**
5. **Las pruebas son código.** Tipadas, legibles, sin `any`, sin esperas basadas en dormir.

## Qué probar y dónde

| Sujeto | Herramienta | Notas |
|---|---|---|
| Esquemas de zod, formateadores, reductores, utilidades | Vitest | Puras, rápidas, guiadas por tabla (`it.each`). |
| Server Actions | Vitest | Llámalas como funciones con `FormData`; simula `requireUser`, la base de datos y `next/cache`. Verifica autenticación, validación, autorización e invalidación. |
| Acceso a datos (`queries.ts`) | Vitest con una base de datos de pruebas o un emulador | Firebase: la Emulator Suite; SQL: una base efímera (Testcontainers o docker). Prueba también las reglas de seguridad. |
| Componentes de cliente | Vitest con RTL y user-event | Renderiza con hijos reales; MSW para las peticiones. |
| Server Components asíncronos, enrutado, caché, streaming | Playwright | El soporte de RTL para RSC asíncronos es limitado: comprueba su estado actual; E2E es el camino fiable. |
| Recorridos críticos (registro, pago, formulario de contacto) | Playwright | Contra una compilación de producción. |
| Accesibilidad | axe en RTL y en Playwright, más una pasada manual con teclado | Las comprobaciones automáticas encuentran entre el 30 % y el 40 % de los problemas (`sumi:a11y`). |

## Consultas: primero las accesibles

Prioridad: `getByRole` (con `name`) > `getByLabelText` > `getByPlaceholderText` > `getByText` > `getByTestId` (último recurso, para enganchar con cosas sin semántica como un canvas o un gráfico).

ASÍ SÍ:
```tsx
const user = userEvent.setup();
render(<RenameProjectForm id="p1" name="Old" />);
await user.clear(screen.getByRole('textbox', { name: /project name/i }));
await user.type(screen.getByRole('textbox', { name: /project name/i }), 'A');
await user.click(screen.getByRole('button', { name: /save/i }));
expect(await screen.findByText(/at least 2 characters/i)).toBeVisible();
```

ASÍ NO:
```tsx
const { container } = render(<Form />);
fireEvent.change(container.querySelector('.input-name')!, { target: { value: 'A' } });
expect(wrapper.state('error')).toBe(true);
```

Si no puedes encontrar un elemento por su rol y su nombre, eso suele ser un fallo de accesibilidad: arregla el componente.

## Asincronía

- `findBy*` y `waitFor` para la interfaz asíncrona. Nunca esperas con `setTimeout`.
- `waitFor` contiene una sola comprobación, sin efectos secundarios dentro.
- Temporizadores falsos (`vi.useFakeTimers({ shouldAdvanceTime: true })`) para el debounce; combínalos con `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`.

## Server Actions

```ts
vi.mock('@/lib/auth', () => ({ requireUser: vi.fn() }));
vi.mock('next/cache', () => ({ updateTag: vi.fn(), revalidateTag: vi.fn() }));

it('rejects renaming a project the user does not own', async () => {
  vi.mocked(requireUser).mockResolvedValue({ id: 'u1' } as User);
  vi.mocked(getOwnedProject).mockResolvedValue(null);
  const fd = new FormData(); fd.set('id', 'p9'); fd.set('name', 'New name');
  const result = await renameProject({ status: 'idle' }, fd);
  expect(result).toEqual({ status: 'error', message: expect.any(String) });
  expect(updateTag).not.toHaveBeenCalled();
});
```

Cubre por cada acción: sin autenticar, entrada inválida, recurso no autorizado, y éxito con su invalidación.

## Red: MSW

- Un `handlers.ts` por funcionalidad con los valores por defecto del camino feliz; sobrescríbelos por prueba con `server.use(...)` para errores y casos límite.
- `onUnhandledRequest: 'error'`, para que las llamadas sin simular fallen con ruido.
- Reutiliza los mismos manejadores en Storybook o en desarrollo si te sirve.

## Playwright

- Ejecútalo contra `next build && next start` (con `webServer` en la configuración). Usa `baseURL`.
- Localizadores por rol o etiqueta (`page.getByRole('button', { name: 'Save' })`); comprobaciones que esperan solas (`await expect(locator).toBeVisible()`), sin esperas manuales.
- Siembra los datos por API o por el emulador desde las fixtures; aísla el estado en cada prueba; reutiliza la autenticación con `storageState`.
- Incluye un proyecto móvil y al menos un recorrido solo con teclado para los flujos críticos.
- Pasa axe en las páginas clave: `new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag22aa']).analyze()`; falla si hay violaciones.
- Regresión visual (`toHaveScreenshot`) solo para las superficies estables del sistema de diseño, enmascarando las regiones dinámicas.

## Higiene

- Los nombres de las pruebas describen el comportamiento: `it('shows an error when the name is too short')`.
- Preparar, actuar, comprobar; un comportamiento por prueba; las variaciones por tabla.
- Reinicia los simulacros entre pruebas (`restoreMocks: true` en la configuración).
- Nada de pruebas de instantánea sobre árboles de componentes completos: comprueban la implementación y acaban aprobándose sin mirar.
- La cobertura es una señal, no un objetivo. Vigila las ramas en las acciones y los esquemas, no los porcentajes sobre el JSX.

## Señales de relleno de IA

- `getByTestId` por todas partes, `container.querySelector`, comprobar clases de CSS.
- Simular los propios hooks del componente o sus hijos para que una prueba pase.
- `toMatchSnapshot()` gigantes del marcado renderizado.
- `await new Promise(r => setTimeout(r, 1000))`.
- `fireEvent` donde `user-event` modela la interacción real.
- Pruebas que solo comprueban que "renderiza sin reventar".
- Pruebas de Server Actions que nunca cubren el camino sin autenticar o sin autorizar.
- `as any` para callar al tipado en las pruebas.

## Lista de verificación

- [ ] El comportamiento nuevo tiene pruebas al nivel más barato que dé confianza; las correcciones de fallos tienen una prueba de regresión.
- [ ] Las consultas van por rol o etiqueta; no se comprueba ningún detalle de implementación.
- [ ] Las Server Actions cubren sin autenticar, inválido, sin autorizar, y éxito con invalidación.
- [ ] La red está simulada con MSW; las peticiones no manejadas fallan.
- [ ] Los recorridos críticos están cubiertos en Playwright contra una compilación de producción, incluyendo un camino con teclado y un escaneo de axe.
- [ ] Sin esperas dormidas, sin `any`, con los simulacros reiniciados entre pruebas; la suite pasa en verde en CI.

## Referencia de configuración de pruebas

Las versiones cambian rápido; comprueba las instaladas y la documentación actual para las claves de configuración.

### Vitest

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    restoreMocks: true,
    css: false,
    include: ['src/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
```

```ts
// tests/setup.ts
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from './msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => { server.resetHandlers(); cleanup(); });
afterAll(() => server.close());
```

Los módulos que importan `server-only` revientan en jsdom: aliásalo en las pruebas (`resolve.alias: { 'server-only': new URL('./tests/empty.ts', import.meta.url).pathname }`) o simúlalo con `vi.mock('server-only', () => ({}))`.

Simula la navegación de Next.js en las pruebas de componentes de cliente:

```ts
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
  usePathname: () => '/projects',
  useSearchParams: () => new URLSearchParams(),
}));
```

### MSW 2

```ts
// tests/msw/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('https://api.example.com/projects', () =>
    HttpResponse.json([{ id: 'p1', name: 'Alpha' }]),
  ),
];

// tests/msw/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';
export const server = setupServer(...handlers);
```

Sobrescritura por prueba:

```ts
server.use(http.get('https://api.example.com/projects', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));
```

### Ayudante de render

```tsx
// tests/render.tsx
import { render, type RenderOptions } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';

export function setup(ui: ReactElement, options?: RenderOptions) {
  return { user: userEvent.setup(), ...render(ui, { wrapper: TestProviders, ...options }) };
}
```

`TestProviders` envuelve solo lo que los componentes necesitan de verdad (tema, internacionalización, cliente de consultas con `retry: false`).

### Playwright

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  use: { baseURL: 'http://localhost:3000', trace: 'on-first-retry' },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'], storageState: 'tests/e2e/.auth/user.json' }, dependencies: ['setup'] },
    { name: 'mobile', use: { ...devices['Pixel 7'], storageState: 'tests/e2e/.auth/user.json' }, dependencies: ['setup'] },
  ],
  webServer: {
    command: 'pnpm build && pnpm start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

Fixture de axe:

```ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('projects page has no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto('/projects');
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
});
```

Ejemplo de recorrido con teclado:

```ts
test('contact form is completable by keyboard', async ({ page }) => {
  await page.goto('/contact');
  await page.keyboard.press('Tab');                 // skip link
  await page.getByLabel('Email').focus();
  await page.keyboard.type('a@b.co');
  await page.keyboard.press('Tab');
  await page.keyboard.type('Hello there');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'Send' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('status')).toContainText(/sent/i);
});
```

### Firebase

- Ejecuta las pruebas contra la Emulator Suite (`firebase emulators:exec "pnpm test"`).
- Prueba las Security Rules con `@firebase/rules-unit-testing`: un caso permitido y uno denegado por cada ruta de regla.
- Nunca apuntes las pruebas a un proyecto real.

### Orden en CI

1. Comprobación de tipos y lint
2. Vitest (unitarias e integración)
3. Compilación
4. Playwright (chromium y móvil), subiendo las trazas si falla

