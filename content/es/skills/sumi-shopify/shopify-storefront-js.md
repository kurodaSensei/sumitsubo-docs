---
title: "shopify-storefront-js"
description: "JavaScript de la tienda para temas de Shopify: JS puro y Web Components, mejora progresiva sobre los formularios de Liquid, Section Rendering API, Cart AJAX API (add, change, update, renderizado agrupado de sections para el cajón del carrito y los contadores), búsqueda predictiva, selección de variantes con sincronización de URL y medios, eventos del editor del tema, debounce y gestión de condiciones de carrera, anuncios con aria-live y carga de scripts sin bloqueo. Úsala al escribir o revisar assets/*.js, src/**/*.{js,ts}, custom elements, cajón del carrito, quick add, selectores de cantidad, facetas/filtros, búsqueda predictiva, selectores de variante, o cuando una section deba actualizarse sin recargar la página completa."
source-hash: "d97be2b76b2ca1a8"
---

# JavaScript de la tienda en Shopify

Usa por defecto Liquid renderizado en el servidor más pequeños Web Components que lo mejoren. Liquid renderiza el HTML; el JS le pide a Shopify HTML nuevo (Section Rendering API) en lugar de reconstruir el marcado a partir de JSON. Estándares generales de JS/TS: `sumi:js-ts`.

## Principios

- JS puro, módulos ES, sin jQuery, sin runtime de framework en la tienda salvo que el proyecto ya incluya uno. Una biblioteca de carruseles o de diálogos es aceptable solo si el proyecto ya la usa; prefiere `<dialog>`, `<details>` y CSS scroll-snap nativos.
- Mejora progresiva: el formulario de producto es un `{% form 'product' %}` real que envía sin JS; la página del carrito funciona sin el cajón; los filtros son un formulario GET.
- Un custom element por comportamiento, acotado a su subárbol. Sin singletons globales que alcancen el DOM por nombre de clase.
- Carga con `<script src="{{ 'x.js' | asset_url }}" defer></script>` o `type="module"`. Nunca `script_tag` (sin defer), nunca `<script>` en línea dentro de bucles ni por instancia de block.
- URLs desde `window.Shopify.routes.root` (o los objetos Liquid `routes.*` pasados mediante atributos data) para que funcionen las rutas multi-idioma/mercado.
- Los textos vienen de Liquid (atributos `data-*` o un único blob JSON renderizado con `| t` y `| json`), nunca texto en inglés fijo en el JS.

## Patrón de Web Component

```js
class QuantityInput extends HTMLElement {
  #input; #abort;
  connectedCallback() {
    this.#input = this.querySelector('input[type="number"]');
    this.#abort = new AbortController();
    this.addEventListener('click', this.#onClick, { signal: this.#abort.signal });
  }
  disconnectedCallback() { this.#abort.abort(); }
  #onClick = (event) => {
    const button = event.target.closest('button[name]');
    if (!button) return;
    button.name === 'plus' ? this.#input.stepUp() : this.#input.stepDown();
    this.#input.dispatchEvent(new Event('change', { bubbles: true }));
  };
}
if (!customElements.get('quantity-input')) customElements.define('quantity-input', QuantityInput);
```

Protege `customElements.define` (las sections se vuelven a renderizar en el editor y los scripts pueden cargarse dos veces). Limpia los listeners en `disconnectedCallback`; las sections se reemplazan por completo.

## Section Rendering API

```js
async function fetchSection(sectionId, url = window.location.pathname) {
  const target = new URL(url, window.location.origin);
  target.searchParams.set('section_id', sectionId);
  const res = await fetch(target, { headers: { Accept: 'text/html' } });
  if (!res.ok) throw new Error(`Section ${sectionId}: ${res.status}`);
  return new DOMParser().parseFromString(await res.text(), 'text/html');
}
```

- `?section_id=x` devuelve el HTML de una section; `?sections=a,b` devuelve JSON `{ id: html }` (número de sections por petición limitado; verifica, históricamente 5).
- Usa el id de ejecución de la section (`section.id`, expuesto mediante `data-section-id`) para las sections de template; las sections de grupo también tienen ids generados.
- Reemplaza el subárbol estable más pequeño, conserva el foco (guarda el identificador de `document.activeElement` y restáuralo) y anuncia el cambio.

## Cart AJAX API

```js
const root = window.Shopify.routes.root;
async function addToCart(formData, sectionIds = []) {
  if (sectionIds.length) formData.append('sections', sectionIds.join(','));
  formData.append('sections_url', window.location.pathname);
  const res = await fetch(`${root}cart/add.js`, { method: 'POST', body: formData, headers: { Accept: 'application/json' } });
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.description || data.message), { status: res.status, data });
  return data; // line item(s) + data.sections when requested
}
```

- Endpoints: `cart.js` (GET), `cart/add.js`, `cart/change.js` (`id` = clave de la línea, `quantity`), `cart/update.js` (`updates`, `note`, `attributes`), `cart/clear.js`. Usa la `key` de la línea, no el id de la variante, para los cambios (la misma variante puede aparecer en varias líneas con distintas propiedades o planes de venta).
- Solicita el renderizado agrupado de sections (`sections`) para refrescar el cajón, la burbuja del icono del carrito y la barra de envío gratis en el mismo viaje de ida y vuelta, en lugar de un segundo fetch.
- Los errores 422 (agotado, regla de cantidad, inventario) llevan un mensaje legible en `description`: muéstralo junto al control y anúncialo.
- Dispara un evento personalizado documentado tras el éxito (`document.dispatchEvent(new CustomEvent('cart:updated', { detail: { cart } }))`) para que otros componentes y apps puedan reaccionar. Comprueba lo que el tema ya despacha antes de inventar nombres.

## Selección de variantes

- Los inputs de opción son grupos de radios en fieldsets (consulta `shopify-performance-a11y`). Al cambiar, resuelve la variante, actualiza el input oculto `id`, haz `history.replaceState` de la URL `?variant=` y refresca el precio, la disponibilidad, los medios y los botones de compra.
- Prefiere volver a renderizar mediante la Section Rendering API con `?variant=<id>` (o valores de opción, verifica el soporte actual de URL de listados combinados/valores de opción) en lugar de enviar todas las variantes como JSON en productos con muchas variantes.
- Nunca confíes solo en la disponibilidad del lado del cliente; la API del carrito es la fuente de verdad.

## Búsqueda predictiva

- `GET {root}search/suggest?q=...&section_id=predictive-search` devuelve HTML renderizado en el servidor usando el objeto `predictive_search`; `search/suggest.json` devuelve JSON. Prefiere la variante de section por paridad de marcado y de traducciones.
- Aplica debounce a la entrada (unos 250 a 300 ms), aborta las peticiones obsoletas con `AbortController`, ignora las respuestas de consultas desactualizadas, cachea por consulta.
- Semántica de combobox: input `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`; resultados `role="listbox"` con `role="option"`; teclas de flecha, Enter, Escape. Anuncia el número de resultados mediante una región en vivo cortés. Detalles: `references/ajax-apis.md`.

## Corrección asíncrona

- Aplica debounce a la escritura de la cantidad; deshabilita o marca como ocupados (`aria-busy="true"`) los controles durante una petición; serializa las mutaciones del carrito (cola) para que los clics rápidos no compitan entre sí.
- Gestiona siempre `!res.ok` y los fallos de red con un mensaje visible y traducido. Ningún `catch {}` silencioso.
- Aborta las peticiones en curso al navegar o al volver a renderizar.

## Compatibilidad con el editor del tema

Escucha en `document` los eventos `shopify:section:load`, `shopify:section:unload`, `shopify:section:select`, `shopify:section:deselect`, `shopify:section:reorder`, `shopify:block:select`, `shopify:block:deselect`, `shopify:inspector:activate`/`deactivate`. Los custom elements suelen reinicializarse solos al cargar; usa `block:select` para abrir la diapositiva, la pestaña o el cajón que contiene el block seleccionado. Comprueba `window.Shopify.designMode` para el comportamiento exclusivo del editor.

## Señales de relleno de IA

- jQuery (`$(...)`, `$.ajax`), o un framework montado solo para alternar una clase.
- Reconstruir el HTML de las tarjetas de producto o de las líneas del carrito en plantillas literales de JS, con texto en inglés y formato de moneda fijos, en lugar de Section Rendering.
- `fetch('/cart/add.js')` con una raíz fija, sin gestión de errores, sin cabecera `Accept`, con el id de variante usado para `change.js`.
- `innerHTML` con datos de la API sin escapar (XSS) o `styled_text` tratado como seguro sin motivo.
- Sondeo con `setTimeout` para el carrito, envoltorios `DOMContentLoaded` que se rompen tras recargar sections, bolsas de estado globales `window.myTheme = {...}`.
- Listeners añadidos en `connectedCallback` sin eliminarlos; `customElements.define` sin protección.
- `onclick=""` en línea en Liquid; `<script>` dentro de un `{% for %}`.

## Lista de verificación

- [ ] Funciona sin JS en la línea base (los formularios envían, los enlaces navegan); el JS solo mejora.
- [ ] Scripts con defer o módulos; sin scripts bloqueantes en `<head>`; sin cargas duplicadas de bibliotecas.
- [ ] Rutas mediante `Shopify.routes.root`; textos traducidos desde Liquid; precios formateados en el servidor.
- [ ] Las mutaciones del carrito usan claves de línea, `sections` agrupadas, estados de error, estados de ocupado y peticiones serializadas.
- [ ] Las actualizaciones del DOM conservan el foco y anuncian los resultados mediante `aria-live`.
- [ ] Se reinicializa en `shopify:section:load`; se limpia al desconectarse; sin errores de consola en el editor.
- [ ] Sin tareas largas en la interacción (comprueba el INP); consulta `sumi:performance`.

Relacionado: `shopify-performance-a11y`, `shopify-liquid`, `sumi:js-ts`.

## APIs AJAX de la tienda: patrones

Los endpoints son relativos a `window.Shopify.routes.root` (termina en `/`). Las formas de las respuestas están resumidas; verifica los campos en shopify.dev antes de depender de uno poco usado.

### Resumen de la Cart API

| Endpoint | Método | Cuerpo | Devuelve |
|---|---|---|---|
| `cart.js` | GET | ninguno | JSON del carrito (`items`, `item_count`, `total_price`, `currency`, `token`, ...) |
| `cart/add.js` | POST | `FormData` del formulario de producto, o JSON `{ items: [{ id, quantity, properties, selling_plan }] }` | Línea(s) añadida(s); clave `sections` si se solicita |
| `cart/change.js` | POST | `{ id: lineKey, quantity }` (o `line`, índice desde 1) | Carrito completo; `sections` si se solicita |
| `cart/update.js` | POST | `{ updates: { [variantIdOrKey]: qty }, note, attributes }` | Carrito completo |
| `cart/clear.js` | POST | ninguno | Carrito vacío |

Parámetros comunes en las llamadas que mutan: `sections` (lista separada por comas de ids de section) y `sections_url` (contexto de página para el renderizado).

Gestión de errores: una respuesta no 2xx devuelve JSON con `status`, `message`, `description`. 422 es una regla de negocio (agotado, cantidad máxima, plan de venta obligatorio). Muestra `description` junto al control.

### Flujo del cajón del carrito

1. Envío del formulario de producto: `preventDefault`, pon `aria-busy="true"` y `aria-disabled="true"` en el botón, mantén visible la etiqueta.
2. `cart/add.js` con `sections: cart-drawer,cart-icon-bubble` (usa los ids de section reales del tema).
3. En caso de éxito: cambia el HTML interno del cajón desde `data.sections['cart-drawer']`, actualiza la burbuja, abre el cajón (`dialog.showModal()`), mueve el foco al encabezado del cajón o al botón de cierre, anuncia "Added to cart" mediante la región en vivo.
4. En caso de error: restaura el botón, renderiza el mensaje en una región `role="alert"` o cortés ligada al formulario (`aria-describedby`).
5. Al cerrar: devuelve el foco al disparador.

### Cambios de cantidad en el cajón

```js
let queue = Promise.resolve();
function changeLine(key, quantity, sectionIds) {
  queue = queue.then(async () => {
    const res = await fetch(`${Shopify.routes.root}cart/change.js`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ id: key, quantity, sections: sectionIds, sections_url: location.pathname }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.description || data.message);
    return data;
  });
  return queue;
}
```

Aplica debounce a la entrada tecleada (300 ms); aplica en `change`, no en cada pulsación de tecla. Tras el renderizado, restaura el foco en el input de la misma línea (haz la correspondencia por `data-line-key`, ya que los índices de línea cambian). Anuncia el nuevo subtotal de forma cortés.

### Section Rendering API

- `GET /path?section_id=<id>`: HTML sin procesar de una section, renderizada en el contexto de esa ruta (producto, colección, términos de búsqueda, parámetros de consulta como filtros y `page`).
- `GET /path?sections=<id1>,<id2>`: mapa JSON de id a HTML. Número limitado de ids por llamada (verifica).
- Funciona para las sections de template y las sections de grupo. Las sections estáticas renderizadas con `{% section %}` usan el nombre de su archivo como id.
- `section.index` es nil en este contexto: las decisiones lazy/eager basadas en el índice deben tener una alternativa.

Patrón de filtrado por facetas: los filtros son un `<form>` GET; al cambiar, serializa con `new URLSearchParams(new FormData(form))`, `history.pushState`, haz fetch de `?section_id=<main-collection-id>&<params>`, reemplaza la cuadrícula de productos y el panel de facetas, actualiza el recuento de resultados en una región en vivo, mantén el foco en el control cambiado. Gestiona `popstate` para volver a renderizar al ir hacia atrás o adelante.

### Búsqueda predictiva

Petición:

```
GET {root}search/suggest?q=<term>&resources[type]=product,collection,query&resources[limit]=6&resources[limit_scope]=each&section_id=predictive-search
```

- Parámetros: `q` (obligatorio), `resources[type]` (`product`, `collection`, `page`, `article`, `query`), `resources[limit]` (1 a 10), `resources[limit_scope]` (`all` o `each`), `resources[options][unavailable_products]` (`show`, `hide`, `last`), `resources[options][fields]` (`title`, `product_type`, `variants.title`, `variants.sku`, `vendor`, `tag`, `body`).
- Variante JSON: `search/suggest.json` devuelve `resources.results.{products,collections,pages,articles,queries}`. `queries[].styled_text` contiene marcado `<mark>`; lo genera Shopify, pero aun así renderiza los demás campos mediante `textContent`.
- Evita buscar en `body` en tiendas multi-idioma salvo que lo hayas verificado; puede mostrar coincidencias de idiomas mezclados.

Contrato de interacción del combobox (combobox de WAI-ARIA APG con popup listbox):
- Input: `role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls="<listbox id>"`, `aria-activedescendant` apuntando al id de la opción resaltada.
- Abajo/Arriba mueven el resaltado, Enter sigue el enlace resaltado o envía el formulario de búsqueda, Escape cierra y luego borra.
- Región en vivo: "6 results" (traducido, con plural) tras cada respuesta estabilizada; no anuncies cada pulsación de tecla.
- Mantén un `<form action="{{ routes.search_url }}">` real para que Enter sin JS siga funcionando.

### Recomendaciones de producto

`GET {root}recommendations/products?product_id=<id>&limit=4&section_id=<id>&intent=related|complementary` devuelve el HTML de la section renderizada con el objeto `recommendations`. Carga al intersectar (IntersectionObserver), reserva espacio para evitar el CLS, oculta la section si `recommendations.performed? and recommendations.products_count == 0`.

### Eventos e integración

- Comprueba lo que el tema ya emite (p. ej. pub/sub al estilo Dawn, o eventos personalizados `cart:updated`) y reutilízalo.
- Las apps suelen escuchar los cambios del carrito o parchear `fetch`; mantén tus peticiones estándar para que sigan funcionando.
- No interceptes la navegación al checkout; el checkout queda fuera del control del tema.
