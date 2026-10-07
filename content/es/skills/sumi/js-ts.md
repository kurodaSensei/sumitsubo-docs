---
title: "js-ts"
description: "Estándares de JavaScript y TypeScript para código de navegador y de Node: TypeScript estricto, módulos, patrones asíncronos y de fetch con cancelación y errores, DOM y eventos, Web Components para sitios sin framework, seguridad (XSS, secretos), validación en tiempo de ejecución y linting. Úsala al escribir o revisar *.js, *.ts, *.mjs, scripts dentro de plantillas, Web Components o la configuración de herramientas (tsconfig, eslint.config.*)."
source-hash: "3f0718500d2ff8bf"
---

# JavaScript y TypeScript

## TypeScript

- `strict: true`, más `noUncheckedIndexedAccess` y `exactOptionalPropertyTypes` donde el proyecto lo permita. Sin `any`; usa `unknown` y acótalo.
- Modela el dominio: uniones discriminadas para los estados (`{ status: 'loading' } | { status: 'error'; error: Error } | { status: 'ok'; data: T }`), tipos con marca para los IDs cuando mezclarlos sea peligroso, `as const` + `satisfies` para los objetos de configuración.
- Los tipos fluyen desde la fuente de verdad: infiérelos de esquemas (zod/valibot) o de tipos de API generados; no los dupliques a mano.
- Valida en las fronteras (formularios, respuestas de red, localStorage, parámetros de URL, webhooks). En el interior, confía en los tipos.
- Prefiere alias `type` para uniones y formas, e `interface` cuando se pretenda extender o fusionar. Exporta los tipos junto al código que los posee.

## Lenguaje

- Solo módulos ES; exports con nombre (exports por defecto solo donde un framework los exija).
- `const` por defecto; nada de `var`. Actualizaciones inmutables (`structuredClone`, spread, `toSorted`, `toSpliced`, `with`).
- APIs modernas antes que bibliotecas: `Intl` (fechas, números, plurales, tiempo relativo), `URL`/`URLSearchParams`, `AbortController`, `structuredClone`, `Array.prototype.at`, `Object.groupBy`, encadenamiento opcional y `??` donde los valores realmente puedan estar ausentes.
- Sin one-liners ingeniosos que necesiten un comentario para descifrarse.

## Asíncrono y red

```ts
async function getProducts(signal?: AbortSignal): Promise<Product[]> {
  const res = await fetch('/api/products', { signal, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new HttpError(res.status, await res.text());
  return ProductList.parse(await res.json()); // runtime validation at the boundary
}
```

- Comprueba siempre `res.ok`; `fetch` no rechaza ante errores HTTP.
- Cancela las peticiones obsoletas (búsqueda mientras se escribe, cambios de ruta) con `AbortController`; aplica debounce a las peticiones iniciadas por el usuario.
- Ejecuta en paralelo el trabajo independiente (`Promise.all` / `allSettled`), nunca esperas secuenciales dentro de un bucle por accidente.
- Tiempos de espera con `AbortSignal.timeout(ms)`. Reintentos solo para peticiones idempotentes, con espera creciente.
- Muestra los errores al usuario en lenguaje llano; registra los detalles técnicos una sola vez.

## DOM y eventos (código sin framework)

- Delegación de eventos en un contenedor estable para las listas; `{ passive: true }` en los listeners de scroll/touch.
- Limpia los listeners, observers y temporizadores (el `signal` de un AbortController en `addEventListener` lo deja en una línea).
- Agrupa las lecturas del DOM antes de las escrituras; evita el layout thrashing en los bucles. Usa `IntersectionObserver` / `ResizeObserver` en lugar de sondear el scroll o el redimensionado.
- Mantén las tareas largas por debajo de 50 ms: cede el control con `scheduler.yield()` (alternativa `setTimeout`) durante el trabajo pesado para proteger el INP.
- Mejora progresiva: la página funciona (o se degrada con sentido) antes de que cargue el JS.

## Web Components (Shopify, WordPress, sitios estáticos)

- Un custom element por componente interactivo (`<cart-drawer>`), DOM ligero por defecto para que se aplique el CSS del tema; shadow DOM solo para widgets realmente encapsulados.
- Inicializa en `connectedCallback`, desmonta en `disconnectedCallback`; lee la configuración de atributos o atributos de datos; comunica mediante `CustomEvent` con `bubbles: true`.
- Protege contra la redefinición: `if (!customElements.get('cart-drawer')) customElements.define(...)`.

## Seguridad

- Nunca inyectes cadenas no confiables con `innerHTML`; usa `textContent`, las APIs del DOM o un sanitizador (DOMPurify) para el HTML inevitable.
- Sin secretos en los bundles del cliente. Solo claves públicas, y solo las diseñadas para serlo.
- Valida y codifica los parámetros de URL antes de usarlos; evita `eval`, `new Function` y `setTimeout` con cadenas.
- Pon `rel="noopener noreferrer"` en los enlaces `target="_blank"` creados por script.

## Herramientas

- Configuración plana de ESLint (`eslint.config.js`) con reglas de TypeScript; Prettier para el formato; sin debates de estilo en la revisión.
- Lint y comprobación de tipos en CI y antes del commit. Política de cero advertencias para el código nuevo.

## Señales de relleno genérico

- `any`, `// @ts-ignore`, conversiones con `as` para hacer desaparecer los errores.
- `useEffect`/watchers para valores derivados (las skills específicas de cada framework lo cubren).
- Cadenas `.then()` mezcladas con `async/await`; rechazos de promesas sin gestionar; `await` en bucles para peticiones independientes.
- jQuery o lodash para cosas que hace la plataforma.
- Estado global mutable y listeners que nunca se eliminan.

## Lista de verificación

- [ ] `tsc --noEmit` y el lint pasan sin advertencias nuevas.
- [ ] Cada llamada de red: comprobación de ok, respuesta tipada/validada, cancelación donde corresponda, estado de error visible para el usuario.
- [ ] Ningún listener/observer se filtra; sin tareas largas en los manejadores de interacción.
- [ ] Sin inyección de HTML no confiable, sin secretos en el código del cliente.
