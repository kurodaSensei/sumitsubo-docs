---
title: "shopify-sections-blocks"
description: "Creación de sections y blocks pensados para el comerciante: convenciones de {% schema %} (orden de los ajustes, etiquetas cortas en minúscula de oración, texto info, valores por defecto, presets, visible_if, enabled_on/disabled_on, limit, max_blocks), blocks locales de la section frente a blocks del tema (@theme, @app, blocks estáticos, anidamiento, content_for), block.shopify_attributes, ajustes expuestos como propiedades personalizadas de CSS, esquemas de color y estados vacíos a prueba de comerciantes. Úsala al crear o editar sections/**/*.liquid, blocks/**/*.liquid, un bloque {% schema %}, presets, o cuando una section se comporta mal en el editor del tema (blocks que no se pueden seleccionar, ajustes que no se actualizan en vivo, composición rota con campos vacíos)."
source-hash: "3b2fcbece341b9ea"
---

# Sections y blocks de Shopify

El comerciante es el usuario principal del schema de una section. Una section está terminada cuando una persona sin conocimientos de desarrollo puede añadirla, rellenarla, romperla con contenido extraño y aun así obtener una página que se vea intencionada.

## Anatomía de una section

```liquid
{%- liquid
  assign heading = section.settings.heading
  assign columns = section.settings.columns
-%}
{% style %}
  #shopify-section-{{ section.id }} {
    --section-pt: {{ section.settings.padding_top }}px;
    --section-pb: {{ section.settings.padding_bottom }}px;
    --grid-columns: {{ columns }};
  }
{% endstyle %}

<div class="feature-grid color-{{ section.settings.color_scheme }}">
  {%- if heading != blank -%}
    <h2 class="feature-grid__heading">{{ heading }}</h2>
  {%- endif -%}
  <ul class="feature-grid__list" role="list">
    {%- for block in section.blocks -%}
      <li class="feature-grid__item" {{ block.shopify_attributes }}>
        {%- render 'feature-item', block: block -%}
      </li>
    {%- else -%}
      {%- if request.design_mode -%}<li>{{ 'sections.feature_grid.empty' | t }}</li>{%- endif -%}
    {%- endfor -%}
  </ul>
</div>

{% schema %}
{
  "name": "t:sections.feature_grid.name",
  "tag": "section",
  "class": "section section--feature-grid",
  "max_blocks": 8,
  "disabled_on": { "groups": ["header", "footer"] },
  "settings": [
    { "type": "inline_richtext", "id": "heading", "label": "t:settings.heading", "default": "Why customers choose us" },
    { "type": "range", "id": "columns", "label": "t:settings.columns", "min": 1, "max": 4, "step": 1, "default": 3 },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:settings.color_scheme", "default": "scheme-1" },
    { "type": "header", "content": "t:settings.padding" },
    { "type": "range", "id": "padding_top", "label": "t:settings.top", "min": 0, "max": 120, "step": 4, "unit": "px", "default": 48 },
    { "type": "range", "id": "padding_bottom", "label": "t:settings.bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "default": 48 }
  ],
  "blocks": [ { "type": "feature" } ],
  "presets": [ { "name": "t:sections.feature_grid.name", "blocks": [ { "type": "feature" }, { "type": "feature" }, { "type": "feature" } ] } ]
}
{% endschema %}
```

Los valores de `inline_richtext` / `richtext` son HTML saneado: imprímelos sin procesar. Los valores de `text` / `textarea`: `| escape`. Elige el tipo de forma deliberada.

## Convenciones del schema

Orden de los ajustes (de arriba abajo en el editor):
1. Fuente de contenido: selectores de recursos (`product`, `collection`, `blog`, `page`, `*_list`, `metaobject`).
2. Contenido: encabezado, texto, imagen, botones.
3. Composición: columnas, alineación, ancho, proporción de aspecto, posición de los medios.
4. Estilo: esquema de color, opciones tipográficas.
5. Espaciado: padding / margin, siempre al final, bajo un `header`.

Etiquetas y ayuda:
- Minúscula de oración, cortas (apunta a menos de 30 caracteres), frases nominales: "Products per row", "Show rating", "Overlay opacity". No "How many products should be displayed in each row", no "Show Rating".
- Deja que el tipo de ajuste lleve el significado: "Subheading" y no "Subheading text field"; las etiquetas de checkbox expresan el estado activado: "Show rating", no "Enable/disable rating".
- Usa `info` para consecuencias o restricciones ("Recommended: 1600 x 900 px", "Applies on desktop only"). Usa `header` para agrupar 4 o más ajustes relacionados.
- `select` para 2 a 5 opciones cortas que se lean como un control segmentado; `radio` cuando las opciones necesiten etiquetas más largas.
- Rangos: `min`/`max`/`step` sensatos, una `unit` y un `default` dentro del rango y sobre un paso.

Valores por defecto y presets:
- Todo ajuste que afecte a la composición tiene un `default`. Los textos por defecto deben leerse como texto de ejemplo real, no como "Lorem ipsum" ni "Heading".
- Toda section que se pueda añadir tiene al menos un `preset` con suficientes blocks para verse terminada al insertarla.
- Usa `visible_if` para ocultar los ajustes que no apliquen: `"visible_if": "{{ section.settings.layout == 'split' }}"`. No se admite en los selectores de recursos (verifica la lista actual).
- Restringe la ubicación con `enabled_on` / `disabled_on` (`templates`, `groups`); usa `limit` para las sections de una por página. No definas enabled_on y disabled_on a la vez.
- Referencia: `references/schema-reference.md` para claves, todos los tipos de ajuste y límites de validación.

## Blocks

Blocks locales de la section: se definen en el array `blocks` del schema de la section con `type`, `name`, `settings`. Se renderizan iterando `section.blocks` y `case block.type`. Válido para temas sin `blocks/`.

Blocks del tema (archivos en `blocks/`):

```liquid
{% doc %}
  Group block: lays out child blocks in a row or column.
{% enddoc %}
<div class="group group--{{ block.settings.direction }}" style="--gap: {{ block.settings.gap }}px" {{ block.shopify_attributes }}>
  {% content_for 'blocks' %}
</div>
{% schema %}
{
  "name": "t:blocks.group.name",
  "blocks": [ { "type": "@theme" }, { "type": "@app" } ],
  "settings": [
    { "type": "select", "id": "direction", "label": "t:settings.direction", "options": [ { "value": "row", "label": "t:options.row" }, { "value": "column", "label": "t:options.column" } ], "default": "column" },
    { "type": "range", "id": "gap", "label": "t:settings.gap", "min": 0, "max": 64, "step": 4, "unit": "px", "default": 16 }
  ],
  "presets": [ { "name": "t:blocks.group.name" } ]
}
{% endschema %}
```

Reglas:
- `{{ block.shopify_attributes }}` en el elemento más externo de cada block, o el editor no podrá seleccionarlo ni resaltarlo. Si el schema define `"tag": null`, el contenedor es tuyo y debes imprimirlo tú mismo.
- `{% content_for 'blocks' %}` una vez por archivo. Haz `capture` de él si debe ir en una de varias ramas.
- Blocks estáticos: `{% content_for 'block', type: 'price', id: 'price' %}` para los hijos que la section siempre necesita (el comerciante edita los ajustes, no puede eliminarlos ni reordenarlos). Los ID deben ser únicos dentro del padre.
- Acepta `@app` donde una app pueda inyectarse razonablemente (información de producto, carrito, pie de página). Los comerciantes dependen de los app blocks.
- Un block sin una entrada `presets` no puede ser añadido por el comerciante (aun así puede ser estático). Los blocks internos intencionados suelen llevar el prefijo `_` por convención (verifica la convención del tema).
- Limita la profundidad de anidamiento a lo que el diseño necesite (group > item > leaf); los árboles profundos confunden al editor.

## Ajustes a CSS

- Pasa los valores como propiedades personalizadas con alcance de instancia (`{% style %}` con `#shopify-section-{{ section.id }}`, o un `style="--x: ..."` en línea para uno o dos valores). El CSS estático consume `var(--x, fallback)`.
- Las opciones discretas se convierten en clases modificadoras (`media--left`), no en una sopa de propiedades en línea.
- Los colores provienen de esquemas de color o de ajustes globales, nunca de literales en el marcado. Consulta `sumi:css-architecture`.
- `{% style %}` se actualiza en vivo en el editor; una hoja de estilos estática con Liquid no existe (`{% stylesheet %}` no puede contener Liquid).

## Renderizado a prueba de comerciantes

- Protege cada campo opcional: ningún `<h2>` vacío, ningún botón sin etiqueta o enlace, ningún contenedor de imagen sin imagen.
- Cuando un recurso obligatorio está vacío (no se eligió ningún producto), renderiza un marcador de posición cuidado solo en el editor (`request.design_mode`) y nada, o una alternativa sensata, en la tienda.
- Maneja títulos largos, 1 block frente al máximo de blocks, imágenes ausentes, RTL y textos traducidos que son un 40 % más largos.
- Nunca dejes que un ajuste rompa la estructura: el nivel de encabezado es un ajuste solo si está restringido (un `select` de h2/h3), no texto libre.
- Los eventos del editor vuelven a ejecutar tu JS al recargar la section; consulta `shopify-storefront-js`.

## Señales de relleno de IA

- Section monolítica con 40 ajustes que cubre cinco composiciones; divídela en sections, blocks o presets.
- Texto fijo ("Shop now"), colores (`#ff0000`) o valores en píxeles que deberían ser ajustes o tokens.
- Etiquetas en Title Case o frases completas; sin valores por defecto; rangos donde `default` queda fuera de `min`/`max`.
- `section.blocks` iterado sin `block.shopify_attributes`; dos `content_for 'blocks'` en un mismo archivo.
- Mezclar `@theme` con definiciones de blocks locales; inventar tipos de ajuste (`"type": "toggle"`, `"type": "slider"`, `"type": "image"`).
- Sin `presets`, así que la section nunca aparece en "Add section".
- `<script>` en línea por instancia de section o por block dentro de un bucle.

## Lista de verificación

- [ ] El schema valida (theme check), los ID están en snake_case y son estables, los ajustes siguen el orden indicado arriba.
- [ ] Etiquetas cortas y en minúscula de oración; `info` donde hay una restricción; claves de traducción si el tema las usa.
- [ ] Todo ajuste que afecta a la composición tiene un valor por defecto válido; los presets renderizan una section de aspecto terminado.
- [ ] `visible_if`, `enabled_on`/`disabled_on`, `limit`, `max_blocks` definidos donde evitan un mal uso.
- [ ] `block.shopify_attributes` en la raíz de cada block; blocks seleccionables y reordenables en el editor.
- [ ] Estilos mediante propiedades personalizadas y clases; sin colores ni textos fijos.
- [ ] Probado en los estados vacío, mínimo, máximo y de contenido largo en el editor.
- [ ] Semántica y accesibilidad según `shopify-performance-a11y` y `sumi:a11y`.

Relacionado: `shopify-liquid`, `shopify-theme-architecture`.

## Referencia del schema

Condensada de la documentación de la plataforma. Los límites y las claves nuevas cambian; verifica en shopify.dev cuando un valor importe.

### Claves del schema de una section

| Clave | Notas |
|---|---|
| `name` | Título en el editor. Obligatoria. Admite claves `t:`. |
| `tag` | Elemento contenedor (por defecto `div`): `article`, `aside`, `div`, `footer`, `header`, `section`. |
| `class` | Clases adicionales en el contenedor `shopify-section`. |
| `limit` | Máximo de instancias por template / grupo (1 o 2). |
| `settings` | Array de ajustes (abajo). ID únicos dentro de la section. |
| `blocks` | Definiciones de blocks locales, o `@theme` / `@app` / tipos específicos de blocks del tema. No locales y `@theme` a la vez. |
| `max_blocks` | Tope de blocks de primer nivel (máximo de la plataforma: 50). |
| `presets` | Hace que la section se pueda añadir; cada uno tiene `name`, `category` opcional, `settings`, `blocks` (array u objeto + `block_order`). |
| `default` | Valores por defecto de una section renderizada de forma estática con `{% section 'name' %}` (patrón heredado). |
| `enabled_on` / `disabled_on` | `{ "templates": [...], "groups": [...] }`. Usa uno, no ambos. Los valores de template incluyen `*`, `index`, `product`, `collection`, `list-collections`, `page`, `blog`, `article`, `search`, `cart`, `404`, `password`, `gift_card`, `metaobject`, `customers/*`. Grupos: `header`, `footer`, `aside`, o tipos de grupo personalizados (verifica). |
| `locales` | Traducciones en línea para sections portables; prefiere los archivos de configuración regional del tema. |

### Claves del schema de un block del tema

| Clave | Notas |
|---|---|
| `name` | Obligatoria. |
| `tag` | Cualquier nombre de elemento, o `null` para no tener contenedor (entonces imprime `block.shopify_attributes` tú mismo). |
| `class` | Se añade al contenedor. |
| `settings` | Los mismos tipos de ajuste que en las sections. |
| `blocks` | Aceptados anidados: `@theme`, `@app` o tipos específicos. |
| `presets` | Obligatorio para que el block aparezca en el selector. Los presets pueden incluir blocks anidados y ajustes. |

Las entradas de blocks locales de la section admiten `type`, `name`, `settings` y `limit` opcional por tipo.

### Atributos de ajuste (ajustes de entrada)

`type`, `id`, `label` obligatorios. Opcionales: `default`, `info`, `placeholder` (de tipo texto), `visible_if`.

Sintaxis de `visible_if`: `"{{ section.settings.layout == 'split' }}"` o `"{{ block.settings.show_button }}"`. Oculta, no borra el valor; tu Liquid debe seguir ignorando los valores irrelevantes. No se admite en los selectores de recursos ni en `color_scheme_group` (verifica).

### Tipos de ajuste

Barra lateral (sin `id`): `header` (`content`, `info` opcional), `paragraph` (`content`).

| Grupo | Tipos | Extras clave / trampas |
|---|---|---|
| Texto | `text`, `textarea`, `inline_richtext`, `richtext`, `html`, `liquid` | El valor por defecto de `richtext` debe ir envuelto en `<p>`; `inline_richtext` no tiene párrafos; `html`/`liquid` son vías de escape, evítalos para el contenido normal. |
| Número | `number`, `range` | `range` necesita `min`, `max`, `default`; `step` y `unit` son opcionales; la plataforma limita el número de pasos (verifica, históricamente 101). |
| Elección | `checkbox`, `select`, `radio`, `text_alignment` | `select`/`radio` necesitan `options: [{ value, label }]`; las opciones de `select` pueden tener `group`. El valor por defecto de `checkbox` debe ser booleano. |
| Medios | `image_picker`, `video`, `video_url` | `video_url` necesita `accept: ["youtube", "vimeo"]`. `image_picker` devuelve un objeto de imagen; protege contra blank. |
| Color | `color`, `color_background`, `color_scheme`, `color_scheme_group` | El valor por defecto de `color` debe ser un hex; `color_background` devuelve cadenas de gradiente CSS. Los grupos de esquemas viven solo en settings_schema. |
| Tipo | `font_picker` | `default` obligatorio, p. ej. `assistant_n4`; carga con `font_face`. |
| Navegación | `link_list`, `url` | `url` no puede tener un valor por defecto no vacío salvo `/collections` o `/collections/all` (verifica). |
| Recursos | `product`, `product_list`, `collection`, `collection_list`, `blog`, `page`, `article`, `article_list`, `metaobject`, `metaobject_list` | Sin `default`. Las listas admiten `limit` (máx. 50). Los selectores de metaobject necesitan `metaobject_type`. |

No existe ningún tipo de ajuste `toggle`, `slider`, `image`, `boolean`, `color_picker`, `dropdown`, `json` ni `markdown`.

### Presets con blocks del tema anidados

```json
"presets": [
  {
    "name": "t:blocks.card.presets.image_card",
    "category": "t:categories.layout",
    "settings": { "padding": 24 },
    "blocks": {
      "media": { "type": "image" },
      "body": {
        "type": "group",
        "blocks": {
          "title": { "type": "heading", "settings": { "text": "Card title" } },
          "cta":   { "type": "button" }
        },
        "block_order": ["title", "cta"]
      }
    },
    "block_order": ["media", "body"]
  }
]
```

Usa la forma de objeto con `block_order` cuando necesites ID estables o debas rellenar blocks estáticos (añade `"static": true` a las entradas que correspondan a llamadas `content_for 'block'`; verifica la sintaxis actual).

### Forma del archivo de ajustes globales

```json
[
  { "name": "theme_info", "theme_name": "...", "theme_version": "1.0.0", "theme_author": "...", "theme_documentation_url": "...", "theme_support_url": "..." },
  { "name": "t:settings_schema.colors.name", "settings": [ { "type": "color_scheme_group", "id": "color_schemes", "definition": [ ... ], "role": { ... } } ] },
  { "name": "t:settings_schema.typography.name", "settings": [ { "type": "font_picker", "id": "type_body_font", "label": "t:settings.body_font", "default": "assistant_n4" } ] }
]
```

Accede como `settings.<id>`; los esquemas de color mediante `settings.color_schemes[scheme_id].settings.<role>`.

### Tabla rápida de estilo de etiquetas

| Haz | No hagas |
|---|---|
| Products per row | How many products should be displayed in each row |
| Show rating | Show Rating / Enable or disable rating stars |
| Subheading | Subheading text field |
| Overlay opacity | Adjust the opacity of the dark overlay on the image |
| Desktop layout (con `info` para el detalle) | Layout (desktop only, mobile always stacks) |
