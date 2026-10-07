---
title: "shopify-performance-a11y"
description: "Core Web Vitals y WCAG 2.2 AA para temas de Shopify: prioridad y precarga de la imagen LCP, carga diferida según la posición de la section, sizes responsivos, carga de fuentes con font_face, carga de CSS/JS, exceso de scripts de apps y app blocks, CLS por imágenes, app blocks y banners, INP en las interacciones de variantes y carrito; patrones de accesibilidad de comercio electrónico para tarjetas de producto, precios de oferta, selectores de variante, galerías, filtros, diálogos del cajón del carrito, selectores de cantidad y anuncios. Úsala al construir o auditar layout/theme.liquid, header, hero, sections de producto, colección, carrito o búsqueda, snippets/*card*.liquid, snippets/*price*.liquid, facetas, o cuando Lighthouse, CrUX, el informe de rendimiento web de Shopify, axe o una revisión manual de accesibilidad señalan problemas."
source-hash: "3da4d6ae1b0f2090"
---

# Rendimiento y accesibilidad en Shopify

Objetivos: LCP por debajo de 2,5 s, CLS por debajo de 0,1, INP por debajo de 200 ms en p75 en móvil; WCAG 2.2 AA. La metodología genérica está en `sumi:performance` y `sumi:a11y`; esta skill cubre lo específico de los temas de Shopify.

## LCP

El elemento LCP en la mayoría de las tiendas es la imagen hero o la primera imagen de producto.

```liquid
{%- liquid
  assign is_above_fold = false
  if section.index != nil and section.index <= 2
    assign is_above_fold = true
  endif
-%}
{%- if is_above_fold -%}
  {{ image | image_url: width: 2400 | image_tag: widths: '750, 1100, 1500, 2000, 2400', sizes: '100vw', loading: 'eager', fetchpriority: 'high', preload: true, alt: image.alt }}
{%- else -%}
  {{ image | image_url: width: 2400 | image_tag: widths: '750, 1100, 1500, 2000, 2400', sizes: '100vw', loading: 'lazy', alt: image.alt }}
{%- endif -%}
```

- Exactamente una o dos imágenes de alta prioridad por página; `preload: true` en una como máximo (añade una pista de precarga; abusar de ella compite con el CSS).
- Nunca cargues de forma diferida la imagen LCP; nunca la hagas aparecer con un fundido mediante JS ni la ocultes tras la inicialización de un slider.
- Sliders hero: renderiza la diapositiva 1 como una imagen eager normal; las siguientes, lazy. Prefiere que no haya autoplay.
- `sizes` debe coincidir con el ancho en CSS; un `sizes` sobredimensionado desperdicia ancho de banda en móvil.
- El tiempo del servidor importa: un Liquid pesado (bucles anidados, muchas consultas a `all_products`) retrasa el primer byte. Consulta `shopify-liquid`.
- La lógica de `section.index` de la imagen debe tener una alternativa cuando es nil (Section Rendering API, sections estáticas). Comprueba si la plataforma ya aplica carga diferida por defecto a `image_tag` y mantén valores explícitos de todos modos (verifica en shopify.dev).

## CLS

- `image_tag` emite width/height; consérvalos y define `aspect-ratio` en los contenedores de medios para los ajustes de proporción (`adapt`, cuadrado, vertical).
- Reserva espacio para todo lo que se inyecte más tarde: app blocks (estrellas de reseñas, pagos a plazos), barras de anuncios, banners de cookies (superpuestos, que no empujen el contenido), recomendaciones, panel de búsqueda predictiva.
- Fuentes: `font_display: 'swap'` más alternativas de métricas compatibles; evita las fuentes de iconos de carga tardía.
- Ningún contenido insertado por encima del existente después de la carga (banners por geolocalización, barras de "envío gratis") sin una altura reservada.

## Fuentes y CSS

```liquid
{%- # In <head>, from settings -%}
<link rel="preconnect" href="https://fonts.shopifycdn.com" crossorigin>
{{ settings.type_body_font | font_url | preload_tag: as: 'font', type: 'font/woff2', crossorigin: true }}
{% style %}
  {{ settings.type_body_font | font_face: font_display: 'swap' }}
  {{ settings.type_body_font | font_modify: 'weight', 'bold' | font_face: font_display: 'swap' }}
{% endstyle %}
```

- Precarga solo los uno o dos archivos de fuente usados sobre el pliegue; protege los resultados de `font_modify` (nil cuando el peso no existe).
- CSS crítico pequeño y en `<head>`; el CSS específico de cada section se carga con su section (`{% stylesheet %}`, un asset por section, o la división del bundler) en lugar de un único archivo gigante.
- Prefiere las fuentes del sistema cuando la marca lo permita.

## JavaScript y apps

- Todos los scripts del tema con `defer` o `type="module"`. Sin scripts de terceros que bloqueen el renderizado en `<head>`, salvo lo que inyecta `content_for_header` (que no puedes editar).
- Audita las apps: las apps desinstaladas suelen dejar snippets, llamadas `{% render 'app-x' %}` y etiquetas de script en `theme.liquid`. Elimina los restos con el acuerdo del comerciante.
- Prefiere los app embeds y los app blocks (eliminables desde el editor) a las etiquetas de script pegadas. Carga los widgets de chat, las reseñas y el UGC al interactuar o en reposo.
- No incluyas una biblioteca de sliders para un solo carrusel; CSS scroll-snap más un componente pequeño es suficiente.
- INP: los manejadores de cambio de variante y de añadir al carrito deben ser cortos; cede el control (`await` una microtarea o `scheduler.yield` donde esté disponible) antes del trabajo pesado en el DOM, evita el thrash de composición y aplica debounce a la entrada.
- Mide con datos de campo (CrUX, el informe de rendimiento web de Shopify en el administrador) más Lighthouse en móvil para inicio, colección, producto y carrito. Compara con la línea base del tema antes de culpar al código.

## Patrones de accesibilidad (resumen)

El marcado completo está en `references/ecommerce-a11y-patterns.md`.

- Tarjeta de producto: un enlace (el título del producto) es la parada de tabulación; un pseudoelemento extiende su área de clic sobre la tarjeta. Las acciones secundarias (quick add) son botones reales con nombres que incluyen el título del producto; nunca `tabindex="-1"` en algo que los usuarios videntes de teclado pueden ver.
- Precio: los precios de oferta y regular se etiquetan con texto para lectores de pantalla ("Regular price", "Sale price") mediante traducciones; las insignias "Sold out" y "Sale" son texto, no solo color.
- Selector de variante: cada opción es un `<fieldset>` + `<legend>`, los valores son inputs radio nativos (con estilo visual de botones o muestras); los valores no disponibles siguen siendo enfocables y se anuncian ("Sold out" / "Unavailable"), las muestras tienen nombres en texto.
- Galería: las miniaturas son botones con `aria-current` / estado pressed; el cambio de medio principal se anuncia de forma cortés; el zoom/lightbox es un diálogo modal; el vídeo tiene controles y no se reproduce solo con sonido; 3D/AR mediante los botones del model viewer de Shopify.
- Filtros: botones de divulgación (`aria-expanded`) que envuelven grupos `<fieldset>`; el rango de precios tiene inputs etiquetados; el recuento de resultados va en una región en vivo cortés; los filtros aplicados se quitan con botones con nombre ("Remove filter: Red").
- Cajón del carrito: `<dialog>` nativo abierto con `showModal()`, encabezado etiquetado, botón de cierre primero, el foco vuelve al disparador, `Escape` cierra. Los selectores de cantidad de cada línea tienen botones etiquetados ("Increase quantity for X") y un input etiquetado; los botones de eliminar incluyen el nombre del producto.
- Anuncios: una región en vivo cortés para las actualizaciones del carrito y de los filtros, creada al cargar la página (no inyectada junto con el contenido).
- Especificidades de WCAG 2.2: foco no oculto por cabeceras fijas o cajones (2.4.11, usa `scroll-padding-top`), tamaño de objetivo de al menos 24 x 24 px CSS para muestras, selectores de cantidad y botones de cierre (2.5.8), sliders/carruseles y filtros de rango operables sin arrastrar (2.5.7), ubicación coherente de la ayuda (3.2.6).
- Movimiento: respeta `prefers-reduced-motion` en marquesinas, parallax y autoplay; todo autoplay tiene un control de pausa visible.
- Idioma: `<html lang="{{ request.locale.iso_code }}">`; enlace de salto a `#MainContent`; un `h1` por página (título del producto en la PDP, título de la colección en la PLP).

## Señales de relleno de IA

- `loading="lazy"` en el hero, o `fetchpriority="high"` en todas las imágenes.
- `| img_url` o `<img src>` sin width/height/srcset; `sizes="100vw"` en una tarjeta de una cuadrícula de 4 columnas.
- `<link>` de Google Fonts añadido junto a los ajustes `font_picker` del tema; `script_tag` que bloquea el renderizado en `<head>`.
- Botones de variante como `<div onclick>` o listas de `<button>` sin semántica de grupo; muestras solo con color de fondo.
- Tarjetas de producto donde imagen, título, precio y botón son cuatro enlaces distintos a la misma URL.
- Cajón del carrito construido con un `<div>` sin gestión del foco; regiones `aria-live` inyectadas junto con su contenido.
- `aria-label` en todo, o roles ARIA que sobrescriben la semántica nativa (`role="button"` en `<a href>`).

## Lista de verificación

- [ ] Imagen LCP eager + `fetchpriority="high"`, no lazy; todas las demás imágenes lazy con `sizes` precisos.
- [ ] Sin cambios de composición por imágenes, app blocks, banners o fuentes (CLS por debajo de 0,1 en los templates clave).
- [ ] Scripts con defer; restos de apps eliminados; sin bibliotecas duplicadas; INP verificado al cambiar de variante y al añadir al carrito.
- [ ] Fuentes de los ajustes del tema con `swap`; como máximo dos precargas de fuentes.
- [ ] Tarjeta de producto, precio, selector de variante, galería, filtros y cajón del carrito coinciden con la referencia de patrones.
- [ ] Pasada solo con teclado: foco visible, orden lógico, sin trampas, foco no oculto, Escape cierra las superposiciones.
- [ ] Comprobación puntual con lector de pantalla (VoiceOver o NVDA) de los anuncios de añadir al carrito y de filtrado.
- [ ] axe/Lighthouse de accesibilidad sin errores en inicio, colección, producto, carrito y búsqueda; contraste comprobado en cada esquema de color.

Relacionado: `shopify-liquid`, `shopify-storefront-js`, `sumi:performance`, `sumi:a11y`, `sumi:css-architecture`.

## Patrones de accesibilidad de comercio electrónico (WCAG 2.2 AA)

Bocetos de marcado en Liquid. Todos los textos visibles provienen de las configuraciones regionales; las claves de traducción aquí son ilustrativas, reutiliza las claves existentes del tema cuando las haya. `visually-hidden` es la clase utilitaria del tema solo para lectores de pantalla.

### Tarjeta de producto

Una parada de tabulación para la navegación; toda la tarjeta es clicable mediante un enlace extendido.

```liquid
<article class="card" aria-labelledby="CardTitle-{{ section.id }}-{{ product.id }}">
  <div class="card__media">
    {%- if product.featured_media -%}
      {{ product.featured_media | image_url: width: 900 | image_tag: widths: '300, 450, 600, 900', sizes: '(min-width: 990px) 25vw, 50vw', loading: 'lazy', alt: '' }}
    {%- endif -%}
  </div>
  <h3 class="card__title">
    <a href="{{ product.url }}" id="CardTitle-{{ section.id }}-{{ product.id }}" class="card__link">{{ product.title | escape }}</a>
  </h3>
  {% render 'price', product: product %}
  {%- unless product.available -%}<span class="badge">{{ 'products.product.sold_out' | t }}</span>{%- endunless -%}
  {%- if show_quick_add and product.available -%}
    <button type="button" class="card__quick-add" aria-describedby="CardTitle-{{ section.id }}-{{ product.id }}">
      {{ 'products.product.quick_add' | t }}
    </button>
  {%- endif -%}
</article>
```

```css
.card { position: relative; }
.card__link::after { content: ""; position: absolute; inset: 0; }
.card__quick-add { position: relative; z-index: 1; } /* sits above the stretched link */
```

- Imagen con `alt=""` porque el enlace del título da nombre a la tarjeta; evita anunciar el título dos veces.
- El nivel del encabezado de la tarjeta encaja con el esquema de la página (normalmente `h3` bajo un `h2` de la section). Conviértelo en un parámetro del snippet si se reutiliza en contextos distintos.
- Quick add visible con el foco además de con hover (`:focus-within`), nunca solo con hover.
- Las insignias y "Sold out" son texto; el color es decoración.

### Precio

```liquid
{%- liquid
  assign on_sale = false
  if product.compare_at_price > product.price
    assign on_sale = true
  endif
-%}
<div class="price{% if on_sale %} price--on-sale{% endif %}">
  {%- if on_sale -%}
    <span class="visually-hidden">{{ 'products.product.price.sale_price' | t }}</span>
    <span class="price__sale">{{ product.price | money }}</span>
    <span class="visually-hidden">{{ 'products.product.price.regular_price' | t }}</span>
    <s class="price__compare">{{ product.compare_at_price | money }}</s>
  {%- else -%}
    <span class="visually-hidden">{{ 'products.product.price.regular_price' | t }}</span>
    <span>{{ product.price | money }}</span>
  {%- endif -%}
</div>
```

- Rangos de precios: una clave de traducción "From {{ price }}" con interpolación (`'products.product.price.from_price_html' | t: price: ...`), nunca concatenación de cadenas.
- La mayoría de los lectores de pantalla no anuncian `<s>` como tachado; las etiquetas ocultas llevan el significado.
- Precios unitarios: etiqueta con el "Unit price" traducido y usa `unit_price_with_measurement`.
- Cuando el precio se actualiza al cambiar de variante, la región no es en vivo por sí misma; anuncia mediante la región en vivo compartida solo si el cambio no es evidente a partir del control que el usuario acaba de operar.

### Selector de variante

```liquid
{%- for option in product.options_with_values -%}
  <fieldset class="variant-picker__option">
    <legend>{{ option.name | escape }}{% if option.values.size > 1 %}: <span data-selected-value>{{ option.selected_value | escape }}</span>{% endif %}</legend>
    {%- for value in option.values -%}
      <input type="radio" class="visually-hidden" id="{{ section.id }}-{{ option.position }}-{{ forloop.index0 }}"
        name="{{ option.name | escape }}-{{ section.id }}" value="{{ value | escape }}"
        {% if option.selected_value == value %}checked{% endif %}>
      <label for="{{ section.id }}-{{ option.position }}-{{ forloop.index0 }}">
        {{ value | escape }}
        {%- comment -%} if this value has no available variant in the current combination, append a visually-hidden translated "Sold out" / "Unavailable" {%- endcomment -%}
      </label>
    {%- endfor -%}
  </fieldset>
{%- endfor -%}
```

- Los radios nativos dan navegación con flechas y una sola parada de tabulación por grupo sin esfuerzo. No los reimplementes con `role="radiogroup"` en divs.
- Los inputs ocultos visualmente deben seguir mostrando el foco: da estilo a `input:focus-visible + label`.
- Muestras: la etiqueta contiene el nombre del valor como texto (oculto visualmente está bien), el color/imagen de la muestra es decoración. Tamaño de objetivo de 24 x 24 px CSS como mínimo, 44 recomendado.
- Combinaciones no disponibles: mantenlas enfocables y seleccionables (para que los usuarios puedan saber que están agotadas), márcalas con texto y deshabilita el botón de añadir al carrito con un motivo visible.
- Alternativa desplegable: `<select>` con `<label>` es totalmente aceptable y a menudo mejor para listas largas de opciones.
- Los temas más nuevos pueden leer la disponibilidad de los objetos `product_option_value` (`value.available`, `value.swatch`); verifica en shopify.dev antes de depender de ellos.

### Galería de producto

- Envuélvela en una región etiquetada (`<section aria-label="{{ 'products.product.media.gallery_label' | t }}">` o un encabezado).
- Miniaturas: `<button aria-label="{{ 'products.product.media.load_image' | t: index: forloop.index }}" aria-current="true|false">` con `alt=""` en la imagen de la miniatura. Prefiere `aria-current` o `aria-pressed`, no ambos.
- Las imágenes principales conservan un `alt` significativo (alt del medio desde el administrador; recurre al título del producto solo si la imagen es la foto principal del producto).
- Carrusel en móvil: lista con scroll-snap con botones anterior/siguiente y un indicador de posición ("2 of 6" como texto). Deslizar nunca es la única vía (2.5.7).
- Zoom/lightbox: `<dialog>` modal, foco en el botón de cierre, Escape cierra, devuelve el foco al botón de la imagen que lo abrió.
- Vídeo: `controls`, subtítulos cuando existan, sin autoplay con sonido; los bucles silenciados con autoplay llevan un botón de pausa.

### Filtros de colección (facetas)

```liquid
<form id="FacetFiltersForm" action="{{ collection.url }}" method="get">
  {%- for filter in collection.filters -%}
    <details class="facet" {% if filter.active_values.size > 0 %}open{% endif %}>
      <summary>{{ filter.label | escape }}{% if filter.active_values.size > 0 %} ({{ filter.active_values.size }}){% endif %}</summary>
      {%- case filter.type -%}
        {%- when 'list', 'boolean' -%}
          <fieldset>
            <legend class="visually-hidden">{{ filter.label | escape }}</legend>
            {%- for value in filter.values -%}
              <label>
                <input type="checkbox" name="{{ value.param_name }}" value="{{ value.value }}" {% if value.active %}checked{% endif %} {% if value.count == 0 and value.active == false %}disabled{% endif %}>
                {{ value.label | escape }} <span class="facet__count">({{ value.count }})</span>
              </label>
            {%- endfor -%}
          </fieldset>
        {%- when 'price_range' -%}
          <fieldset>
            <legend class="visually-hidden">{{ filter.label | escape }}</legend>
            <label for="Price-GTE">{{ 'collections.filters.from' | t }}</label>
            <input id="Price-GTE" type="text" inputmode="decimal" name="{{ filter.min_value.param_name }}" value="{{ filter.min_value.value | money_without_currency | remove: ',' }}">
            <label for="Price-LTE">{{ 'collections.filters.to' | t }}</label>
            <input id="Price-LTE" type="text" inputmode="decimal" name="{{ filter.max_value.param_name }}" value="{{ filter.max_value.value | money_without_currency | remove: ',' }}">
          </fieldset>
          {%- comment -%} money_without_currency formats per locale ("1,234.56" / "12,50"): normalize separators for your store's format before submitting. {%- endcomment -%}
      {%- endcase -%}
    </details>
  {%- endfor -%}
  <noscript><button type="submit">{{ 'collections.filters.apply' | t }}</button></noscript>
</form>
<p class="visually-hidden" role="status" aria-live="polite" id="ProductCount">{{ 'collections.products_count' | t: count: collection.products_count }}</p>
```

- `<details>/<summary>` es una divulgación nativa; un `button[aria-expanded][aria-controls]` personalizado es la alternativa cuando la animación o la composición lo exigen.
- El cajón de filtros en móvil es un diálogo modal con un botón de aplicar/cerrar y un recuento de resultados visible.
- Lista de filtros activos: botones o enlaces con nombre "Remove filter: {{ label }}", más "Clear all".
- Tras una actualización asíncrona: mantén el foco en el control que el usuario cambió; actualiza el texto de la región del recuento (no vuelvas a crear la región).
- El `<select>` de orden tiene una etiqueta visible. Los valores de filtro de muestras (cuando existan) siguen teniendo etiquetas de texto. Verifica los valores de `filter.type` y el soporte de muestras en shopify.dev.

### Cajón del carrito

```html
<dialog id="CartDrawer" class="cart-drawer" aria-labelledby="CartDrawerTitle">
  <div class="cart-drawer__header">
    <h2 id="CartDrawerTitle">{{ 'cart.title' | t }}</h2>
    <button type="button" class="cart-drawer__close" aria-label="{{ 'general.close' | t }}" data-close>...</button>
  </div>
  <!-- line items, subtotal, checkout button -->
</dialog>
```

- `dialog.showModal()` aporta contención del foco, fondo inerte y gestión de Escape; aun así, restaura el foco en el disparador al hacer `close`.
- El disparador (icono del carrito) es un enlace a `/cart` que el JS mejora para abrir el cajón; tiene un nombre accesible que incluye el recuento ("Cart, 3 items") mediante traducciones.
- Línea de pedido: enlace del producto, detalles de la variante como texto, selector de cantidad (input etiquetado más botones "Decrease/Increase quantity for {{ title }}"), botón de eliminar "Remove {{ title }}", precio de la línea. Errores por línea en texto, vinculados mediante `aria-describedby`.
- Estado vacío: encabezado más un enlace para seguir comprando; el foco aterriza en el encabezado.
- El botón de checkout es un `<button name="checkout">` real en el formulario del carrito o un enlace a `/checkout`; no lo secuestres.

### Región en vivo

```html
<div id="A11yAnnouncer" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
```

```js
export function announce(message) {
  const region = document.getElementById('A11yAnnouncer');
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}
```

Renderízala una vez en `theme.liquid`. Úsala para: artículo añadido, cantidad actualizada, recuento de resultados de filtros, recuento de resultados de búsqueda, errores de formulario no adyacentes al foco. Usa `role="alert"` solo para errores bloqueantes.

### Cabecera y navegación

- Enlace de salto primero en `<body>`, con destino `<main id="MainContent" tabindex="-1">`.
- Mega menú: botones de divulgación (`aria-expanded`) para los elementos de primer nivel con submenús, no `role="menu"`; Escape cierra y devuelve el foco; retardo de intención de hover y sin apertura solo con hover.
- Cabecera fija: define `scroll-padding-top` igual a la altura de la cabecera para que los elementos enfocados no queden ocultos (2.4.11).
- Los selectores de localización (país, idioma) usan `{% form 'localization' %}` con controles etiquetados.

### Formularios (newsletter, contacto, cuenta)

- `<label>` visible para cada campo; el placeholder no es una etiqueta. Tokens de `autocomplete` (`email`, `given-name`, `tel`).
- Errores de `form.errors` renderizados junto a los campos, vinculados con `aria-describedby`, resumen con enlaces al enviar; el foco pasa al resumen.
- Mensajes de éxito (`form.posted_successfully?`) en una región de estado, con foco o anunciados.
- No exijas volver a introducir información ya proporcionada en el mismo flujo (3.3.7).
