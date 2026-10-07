---
title: "shopify-liquid"
description: "Escritura de Liquid en Shopify: sintaxis y trampas de evaluación, render frente a include, LiquidDoc {% doc %} para snippets y blocks, control de espacios en blanco, la etiqueta liquid, rendimiento de bucles y paginación, metafields y metaobjects, imágenes responsivas con image_url e image_tag, filtros de dinero y de traducción. Úsala al escribir o revisar cualquier archivo .liquid (sections/**/*.liquid, blocks/**/*.liquid, snippets/**/*.liquid, layout/*.liquid, templates/**/*.liquid), cuando la salida es incorrecta o está en blanco, cuando puede que un filtro o un objeto no exista, o cuando una página se renderiza con lentitud en el servidor."
source-hash: "791ec0af2292a9b4"
---

# Shopify Liquid

Liquid es un lenguaje de plantillas pequeño y seguro, con objetos, etiquetas y filtros propios de Shopify. La mayoría de los errores de la IA aquí son APIs inventadas y lógica que presupone un lenguaje de propósito general. Si no estás seguro de que exista un filtro, un objeto o una propiedad, consulta `references/liquid-quick-reference.md` y luego verifica en shopify.dev. Nunca adivines.

## Reglas de sintaxis que muerden

- Sin paréntesis en las condiciones. `and`/`or` se evalúan de derecha a izquierda. Anida bloques `if` o precalcula booleanos con `assign`.
- Sin ternario, sin `!`, sin `&&`. Usa `unless`, `!=`, `and`.
- `contains` funciona solo con cadenas y arrays de cadenas, no con arrays de objetos. Usa `where` / `has` / `find` para objetos.
- Veracidad: solo `nil` y `false` son falsos. `''`, `0`, `[]` son verdaderos. Comprueba el contenido con `!= blank`; comprueba los arrays con `.size > 0`.
- `| default:` también reemplaza `false`. Para los checkboxes usa `| default: true, allow_false: true` o comprueba `== false` de forma explícita.
- La aritmética de enteros trunca: `{{ 7 | divided_by: 2 }}` es `3`. Usa `2.0` para obtener un decimal.
- Los precios son enteros en centavos (subunidades). Da formato con los filtros `money`; nunca dividas entre 100 a mano.
- Los auxiliares de bucle son `forloop.index`, `forloop.index0`, `forloop.first`, `forloop.last`, `forloop.length`. No existe `loop.index` ni `@index`.
- `for` admite `limit:`, `offset:`, `reversed` y una rama `{% else %}` para arrays vacíos.
- Las variables asignadas en una section son globales a ese archivo; dentro de un snippet siguen siendo locales.

## render, no include

```liquid
{%- # DO: explicit inputs, isolated scope -%}
{% render 'product-card', product: product, show_vendor: section.settings.show_vendor %}
{% render 'product-card' for section.settings.collection.products as product %}

{%- # DON'T: include is deprecated and leaks scope -%}
{% include 'product-card' %}
```

Un snippet renderizado no puede ver las variables del llamador (salvo las globales como `settings`, `request`, `shop`). Pásale todo lo que necesite. `render` no admite una variable como nombre del snippet.

## Documenta snippets y blocks con LiquidDoc

```liquid
{% doc %}
  Renders a product price with sale and unit price states.

  @param {product} product - Product to price
  @param {boolean} [show_compare] - Show compare-at price when on sale. Default: true
  @param {string} [class] - Extra classes on the wrapper

  @example
  {% render 'price', product: product, show_compare: false %}
{% enddoc %}
```

Los nombres entre corchetes son opcionales. Theme check y los editores lo usan para el autocompletado y la validación de argumentos. Da a cada parámetro opcional un valor por defecto documentado y aplícalo con `default`.

## Espacios en blanco y lógica de varias líneas

Usa `{%- -%}` / `{{- -}}` alrededor de la lógica para mantener limpio el HTML. Usa `{% liquid %}` para bloques de asignaciones; dentro de él, una etiqueta por línea, sin delimitadores, y `echo` para la salida.

```liquid
{%- liquid
  assign product = section.settings.product | default: product
  assign on_sale = false
  if product.compare_at_price > product.price
    assign on_sale = true
  endif
-%}
```

Comentarios en línea: `{% # note %}`. Comentarios de bloque: `{% comment %}...{% endcomment %}`.

## Escapado

- Ajustes de texto plano y entrada de clientes: `{{ block.settings.heading | escape }}`.
- Ajustes `richtext` / `inline_richtext`: imprímelos sin procesar (ya es HTML saneado).
- Valores en atributos: `escape`. Valores en JSON en línea: `| json` (nunca construyas cadenas JSON a mano).

## Rendimiento en el servidor

Liquid se renderiza en cada petición sin caché; un Liquid lento significa un TTFB lento y peor LCP.

- Nunca anides bucles sobre colecciones grandes (`for product in collection.products` dentro de `for collection in collections`). Precalcula con `where`, `map`, `uniq`, o mueve los datos a un metafield/metaobject.
- Iterar `collection.products` sin `paginate` devuelve como máximo 50 elementos. Usa `{% paginate collection.products by section.settings.per_page %}`; respeta el tope de tamaño de página de la plataforma (verifica el máximo actual en shopify.dev).
- Usa `limit:` en cada bucle que alimente una interfaz de tamaño fijo (un carrusel de 8 renderiza 8, no 50).
- `all_products['handle']` tiene límite de frecuencia por página (verifica el límite actual); prefiere un ajuste `product` o `product_list`.
- Evita volver a renderizar el mismo snippet con entradas idénticas; haz `capture` una vez y muestra el resultado dos veces.
- Perfila con `shopify theme profile` o con el Theme Inspector (verifica las herramientas actuales) antes de microoptimizar.

## Imágenes

```liquid
{%- # DO: responsive, sized, explicit loading -%}
{{ section.settings.image
  | image_url: width: 2400
  | image_tag:
    widths: '480, 800, 1200, 1600, 2400',
    sizes: '(min-width: 990px) 50vw, 100vw',
    loading: 'lazy',
    class: 'media__img',
    alt: section.settings.image.alt
}}

{%- # DON'T: deprecated filter, no srcset, no dimensions, hardcoded alt -%}
<img src="{{ section.settings.image | img_url: 'master' }}" alt="image">
```

- `image_url` necesita `width:` y/o `height:` (máx. 5760). `image_tag` emite `width`/`height` y un `srcset`, lo que evita el CLS.
- `sizes` debe describir el ancho real renderizado, o el navegador descargará archivos sobredimensionados.
- Hero sobre el pliegue: `loading: 'eager', fetchpriority: 'high'` (opcionalmente `preload: true` para una sola imagen). Todo lo demás: lazy. Consulta `shopify-performance-a11y`.
- Protege siempre: `{% if image != blank %}...{% else %}{{ 'image' | placeholder_svg_tag: 'placeholder' }}{% endif %}`.
- Texto alternativo: `image.alt` de la biblioteca de medios; las imágenes decorativas llevan `alt: ''`.

## Metafields y metaobjects

```liquid
{%- assign care = product.metafields.custom.care_instructions -%}
{% if care != blank %}
  <div class="rte">{{ care | metafield_tag }}</div>
{% endif %}

{%- # List and reference types: use .value -%}
{% for item in product.metafields.custom.features.value %}{{ item | escape }}{% endfor %}
{%- assign size_chart = product.metafields.custom.size_chart.value -%}
{{ size_chart.title.value }}

{%- # Metaobject entry by type and handle (global metaobjects object) -%}
{%- assign faq = metaobjects.faq_group['shipping'] -%}
```

Nunca inventes un namespace/key. Pide (o lee de la tienda o del código existente) la definición y el tipo exactos. Recuerda que los comerciantes pueden conectar los ajustes de una section a metafields como fuentes dinámicas, así que el valor de un ajuste puede estar vacío según el recurso: protege siempre.

## Traducciones

Todo texto visible para el cliente usa `| t`. Interpola, no concatenes. Usa `count:` para los plurales.

```liquid
{{ 'products.product.sold_out' | t }}
{{ 'cart.items_count' | t: count: cart.item_count }}
{%- # DON'T -%} <button>Add to cart</button>  {{ cart.item_count }} items
```

## Señales de relleno de IA

- Filtros inventados: `| format_money`, `| currency`, `| image_resize`, `| truncate_html`, `| json_parse`, `| to_string`, `| slugify` (Liquid tiene `handleize`).
- Objetos o propiedades inventados: `product.reviews`, `product.rating` sin un metafield, `variant.stock`, `cart.subtotal` (es `cart.total_price` / `cart.items_subtotal_price`), `forloop.count`.
- APIs obsoletas: `img_url`, `img_tag`, `product_img_url`, `include`. (`| within` para URLs de producto sensibles a la colección: verifica la guía actual en shopify.dev antes de usarlo.)
- Vicios de JavaScript: `&&`, `||`, ternarios, `.length` (es `.size`), `===`, comprobaciones con `null` en lugar de `blank`.
- Cadenas en inglés, símbolos de moneda o `| divided_by: 100` escritos a mano en los precios.
- `{% break %}` usado fuera de un bucle para "retornar" desde un snippet.

## Lista de verificación

- [ ] Todo filtro, etiqueta y objeto existe (referencia rápida o shopify.dev); sin APIs obsoletas.
- [ ] Los snippets usan `render` con parámetros explícitos y un encabezado `{% doc %}`.
- [ ] Textos mediante `| t`; precios mediante `money*`; texto de usuario escapado.
- [ ] Bucles acotados (`limit`, `paginate`); sin bucles anidados sobre arrays grandes.
- [ ] Imágenes mediante `image_url` + `image_tag` con `widths`, `sizes` precisos, estrategia de carga y alt.
- [ ] Acceso a metafields protegido con `!= blank`; namespaces/keys confirmados, no adivinados.
- [ ] `shopify theme check` sin avisos en los archivos tocados.

Relacionado: `shopify-theme-architecture`, `shopify-sections-blocks`, `sumi:performance`.

## Referencia rápida de Liquid (temas de Shopify)

Una lista curada de lo que existe. La ausencia aquí no prueba la ausencia en la plataforma, pero todo lo que no figure debe verificarse en shopify.dev antes de usarlo. Los elementos marcados (newer) se añadieron en los últimos años; confirma que el contexto del tema de la tienda los admite.

### Tags

| Categoría | Tags |
|---|---|
| Salida / variables | `{{ }}`, `assign`, `capture`, `echo` (inside `liquid`), `increment`, `decrement` |
| Control | `if` / `elsif` / `else`, `unless`, `case` / `when` (comma or `or` for multiple values) |
| Iteración | `for` (`limit`, `offset`, `reversed`, `range (1..n)`), `else` in `for`, `break`, `continue`, `cycle`, `tablerow`, `paginate` |
| Tema | `layout`, `section`, `sections` (groups), `content_for 'blocks'`, `content_for 'block'`, `render`, `schema`, `style`, `stylesheet`, `javascript`, `form`, `doc` |
| Otros | `liquid`, `comment`, `# inline comment`, `raw` |
| Obsoleto | `include` (use `render`) |

Notas:
- `{% stylesheet %}` / `{% javascript %}`: uno por archivo, solo contenido estático (sin Liquid dentro), concatenados por Shopify en assets compartidos. Permitidos en sections y blocks; el soporte en snippets existe en temas más recientes (verifica). Si el proyecto empaqueta CSS/JS, sigue al proyecto.
- `{% style %}`: renderiza una etiqueta `<style>` que puede contener Liquid y se actualiza en vivo en el editor. Úsalo para propiedades personalizadas por instancia.
- `{% form 'product', product %}`, `'cart'`, `'contact'`, `'customer_login'`, `'create_customer'`, `'customer'` (newsletter), `'localization'`, `'new_comment', article`, además de los formularios de cuenta. Usa la etiqueta; no escribas a mano las acciones de los formularios.
- `content_for 'blocks'` puede aparecer una vez por archivo; haz `capture` de él si debe colocarse de forma condicional.

### Objetos globales

`settings`, `shop`, `request` (`design_mode`, `visual_preview_mode`, `page_type`, `locale`, `path`, `host`), `routes` (`root_url`, `cart_url`, `cart_add_url`, `cart_change_url`, `cart_update_url`, `search_url`, `predictive_search_url`, `account_url`, `collections_url`), `cart`, `customer` (nil when logged out), `localization` (`available_countries`, `available_languages`, `country`, `language`), `linklists`, `collections`, `pages`, `blogs`, `all_products` (rate-limited), `metaobjects`, `template` (`name`, `suffix`, `directory`), `theme`, `canonical_url`, `page_title`, `page_description`, `page_image`, `content_for_header`, `content_for_layout`, `section`, `block`, `predictive_search`, `recommendations`, `powered_by_link`, `additional_checkout_buttons`, `content_for_additional_checkout_buttons`.

### Objetos con alcance de página

| Template | Objetos |
|---|---|
| product | `product` |
| collection | `collection`, `current_tags` |
| list-collections | `collections` |
| blog / article | `blog`, `article`, `current_tags` |
| page | `page` |
| search | `search` (`results`, `terms`, `results_count`, `filters`, `types`) |
| cart | `cart` |
| customers/* | `customer`, `order`, `form` objects as applicable |
| metaobject | `metaobject` |

### Propiedades de uso común

- product: `id`, `title`, `handle`, `url`, `vendor`, `type`, `tags`, `description`, `price`, `price_min`, `price_max`, `price_varies`, `compare_at_price`, `compare_at_price_min`, `available`, `featured_media`, `featured_image`, `media`, `images`, `options`, `options_with_values`, `options_by_name`, `variants`, `selected_variant`, `selected_or_first_available_variant`, `first_available_variant`, `has_only_default_variant`, `requires_selling_plan`, `selling_plan_groups`, `metafields`, `quantity_price_breaks_configured?`.
- variant: `id`, `title`, `price`, `compare_at_price`, `available`, `sku`, `barcode`, `option1..3`, `options`, `featured_media`, `inventory_quantity` (solo cuando se rastrea y se expone; no prometas cantidades de stock), `inventory_management`, `inventory_policy`, `url`, `unit_price`, `unit_price_measurement`, `quantity_rule`, `metafields`.
- product_option: `name`, `position`, `values`, `selected_value`. product_option_value (newer): `name`, `available`, `selected`, `swatch`, `variant`, `product_url`, `id`.
- collection: `id`, `title`, `handle`, `url`, `description`, `image`, `featured_image`, `products`, `products_count`, `all_products_count`, `filters`, `sort_by`, `sort_options`, `default_sort_by`, `metafields`.
- cart: `item_count`, `items`, `total_price`, `items_subtotal_price`, `original_total_price`, `total_discount`, `cart_level_discount_applications`, `note`, `attributes`, `requires_shipping`, `currency`, `empty?`, `checkout_charge_amount`.
- line_item: `key`, `id`, `variant_id`, `product`, `variant`, `title`, `quantity`, `final_price`, `final_line_price`, `original_line_price`, `line_level_discount_allocations`, `properties`, `selling_plan_allocation`, `url`, `image`, `unit_price`.
- image / media: `src`, `alt`, `width`, `height`, `aspect_ratio`, `id`, `media_type` (`image`, `video`, `external_video`, `model`), `preview_image`, `presentation` (punto focal).
- section: `id`, `settings`, `blocks`, `index` (posición desde 1; puede ser nil, p. ej. al renderizar mediante la Section Rendering API), `index0`, `location` (nombre del template o del grupo).
- block: `id`, `type`, `settings`, `shopify_attributes`.
- metafield: `value`, `type`, `list?`. Los tipos de referencia exponen el objeto referenciado mediante `.value`.

### Filtros

#### Media
- `image_url: width:, height:, crop:, format:` (format: `pjpg`, `jpg`, `webp`; Shopify negocia los formatos modernos automáticamente)
- `image_tag: widths:, sizes:, loading:, fetchpriority:, preload:, alt:, class:, width:, height:`
- `placeholder_svg_tag` (p. ej. `'product-1'`, `'collection-1'`, `'image'`, `'lifestyle-1'`)
- `media_tag`, `video_tag: autoplay:, loop:, muted:, controls:, image_size:`, `external_video_tag`, `external_video_url: autoplay:, loop:`, `model_viewer_tag`
- Obsoletos: `img_url`, `img_tag`, `product_img_url`, `collection_img_url`, `article_img_url`

#### Assets, URLs y HTML
- `asset_url`, `asset_img_url` (prefiere `asset_url` + `image_tag` o SVG en línea), `file_url`, `file_img_url`, `shopify_asset_url`, `global_asset_url`
- `inline_asset_content` (incrusta un SVG de assets/)
- `stylesheet_tag` (bloquea el renderizado por diseño), `script_tag` (sin `defer`; escribe en su lugar `<script src="{{ 'x.js' | asset_url }}" defer></script>`), `preload_tag: as:`
- `link_to`, `url_for_type`, `url_for_vendor`, `link_to_tag`, `link_to_add_tag`, `link_to_remove_tag`, `highlight_active_tag`, `sort_by`
- `time_tag: format:`, `highlight: search.terms`, `default_pagination`, `default_errors`
- `payment_type_svg_tag`, `payment_button`, `payment_terms`

#### Dinero
- `money`, `money_with_currency`, `money_without_currency`, `money_without_trailing_zeros`. El formato viene de los ajustes de la tienda; nunca escribas símbolos a mano.

#### Localización y contenido
- `t` (alias `translate`) con interpolación con nombre y plurales con `count:`
- `format_address`, `metafield_tag`, `metafield_text`, `structured_data` (JSON-LD de product/article), `weight_with_unit`, `unit_price_with_measurement`
- `customer_login_link`, `customer_logout_link`, `customer_register_link`, `login_button`, `avatar`

#### Fuentes y color
- `font_face: font_display: 'swap'`, `font_url`, `font_modify: 'weight', 'bold'` (devuelve nil cuando la variante no existe; protégelo)
- `color_to_rgb`, `color_to_hsl`, `color_to_hex`, `color_to_oklch` (newer), `color_modify: 'alpha', 0.5`, `color_lighten`, `color_darken`, `color_saturate`, `color_desaturate`, `color_mix`, `color_brightness`, `color_contrast`, `color_difference`, `brightness_difference`, `color_extract`

#### Array
- `where: 'prop', value`, `map`, `first`, `last`, `size`, `join`, `sort`, `sort_natural`, `uniq`, `reverse`, `compact`, `concat`, `sum`
- (newer) `find: 'prop', value`, `find_index`, `has: 'prop', value`, `reject: 'prop', value`

#### Cadena
- `append`, `prepend`, `replace`, `replace_first`, `replace_last`, `remove`, `remove_first`, `remove_last`, `split`, `strip`, `lstrip`, `rstrip`, `strip_html`, `strip_newlines`, `newline_to_br`, `truncate`, `truncatewords`, `upcase`, `downcase`, `capitalize`, `handleize` (alias `handle`), `camelize`, `pluralize`, `escape`, `escape_once`, `url_encode`, `url_decode`, `url_escape`, `url_param_escape`, `slice`, `base64_encode`/`decode`, `md5`, `sha1`, `sha256`, `hmac_sha1`, `hmac_sha256`, `json`

#### Matemáticas y otros
- `plus`, `minus`, `times`, `divided_by`, `modulo`, `abs`, `ceil`, `floor`, `round`, `at_least`, `at_most`
- `date: format` (strftime, o `format: 'abbreviated_date'` para formatos de la configuración regional), `default: value, allow_false: true`

### No existe (alucinaciones frecuentes)

`format_money`, `currency`, `money_format`, `image_resize`, `resize`, `img_src`, `truncate_html`, `json_parse`, `parse_json`, `to_string`, `to_number`, `slugify`, `titleize`, `length` (use `size`), `filter`, `includes`, `contains` as a filter, `product.reviews`, `product.rating`, `product.stock`, `variant.stock`, `cart.subtotal`, `loop.index`, `forloop.count`.
